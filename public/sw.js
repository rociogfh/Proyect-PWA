/* --- Service Worker (PWA + Sync + Offline) --- */
const VERSION = "v15";                       // bump para forzar update
const STATIC_CACHE  = `static-${VERSION}`;
const DYNAMIC_CACHE = `dynamic-${VERSION}`;
const OFFLINE_URL   = "/offline.html";

const APP_SHELL = [
  "/", "/index.html", OFFLINE_URL, "/manifest.json",
  "/icons/icon-192.png", "/icons/icon-512.png",
  // Nota: no precachear /src/* en producción
];

/* ---------------- Install & Activate ---------------- */
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => ![STATIC_CACHE, DYNAMIC_CACHE].includes(k))
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* ---------- Helpers de estrategia ---------- */
const isStaticAsset = (url) =>
  url.origin === location.origin &&
  (url.pathname === "/" ||
   url.pathname === "/index.html" ||
   url.pathname === "/manifest.json" ||
   url.pathname.startsWith("/assets/") ||   // Vite build
   url.pathname.endsWith(".js") ||
   url.pathname.endsWith(".css"));

/* ---------------- Fetch strategies ----------------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo GET
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 8000);
        const net = await fetch(req, { signal: controller.signal });
        clearTimeout(t);
        return net;
      } catch {
        const offline = await caches.match(OFFLINE_URL, { ignoreSearch: true });
        return offline || new Response("Sin conexión", { status: 503 });
      }
    })());
    return;
  }

  // App-Shell y estáticos → Cache-First
  if (isStaticAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;        // cache-first
      try {
        const net = await fetch(req);
        cache.put(req, net.clone());
        return net;
      } catch {
        return cached || new Response("", { status: 504 });
      }
    })());
    return;
  }
  // Imágenes: stale-while-revalidate
  if (req.destination === "image") {
    event.respondWith((async () => {
      const cache = await caches.open(DYNAMIC_CACHE);
      const cached = await cache.match(req);
      const net = fetch(req)
        .then((res) => { cache.put(req, res.clone()); return res; })
        .catch(() => null);
      return cached || net || fetch(req);
    })());
    return;
  }

  // APIs: network-first (incluye /api/entries)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        // sólo cachea GET exitosos
        if (req.method === "GET" && res.ok) {
          const cache = await caches.open(DYNAMIC_CACHE);
          await cache.put(new Request(req.url), res.clone());
        }
        return res;
      } catch {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cached = await cache.match(req.url);
        return (
          cached ||
          new Response(
            JSON.stringify({ error: "offline" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          )
        );
      }
    })());
    return;
  }

  // Resto → best-effort: cache o red
  event.respondWith(caches.match(req).then(r => r || fetch(req)));
});

/* ---------- Background Sync ---------- */
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-entries") {
    event.waitUntil(flushOutbox());
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "FLUSH_NOW") {
    event.waitUntil(flushOutbox());
  }
});

async function flushOutbox() {
  const db = await openIDB();

  // Lee objetos y claves
  const txRead = db.transaction("outbox", "readonly");
  const outR = txRead.objectStore("outbox");
  const [items, keys] = await Promise.all([
    idbReq(outR.getAll()),
    idbReq(outR.getAllKeys()),
  ]);
  await waitTx(txRead);

  if (!items.length) {
    console.log("[SW] Outbox vacío");
    return;
  }

  console.log("[SW] Enviando", items.length, "items…");

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const key = keys[i];

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(it.payload),
      });

      if (!res.ok) {
        console.warn("[SW] backend respondió", res.status, " — reintenta luego");
        continue;
      }

      // Borra del outbox
      const txDel = db.transaction("outbox", "readwrite");
      await idbReq(txDel.objectStore("outbox").delete(key));
      await waitTx(txDel);
      console.log("[SW] Borrado outbox key=", key);

      try {
        const txT = db.transaction("tasks", "readwrite");
        const stT = txT.objectStore("tasks");
        const all = await idbReq(stT.getAll());
        for (const t of all) {
          if (t.synced === false) { t.synced = true; await idbReq(stT.put(t)); }
        }
        await waitTx(txT);
      } catch {}
    } catch (e) {
      console.warn("[SW] Sin red / error fetch; reintenta luego", e);
    }
  }

  // Notifica a la UI
  const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const c of clientsList) c.postMessage({ type: "SYNC_DONE" });
}

/* --------- IDB helpers --------- */
function idbReq(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function waitTx(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
function openIDB() {
  const DB_NAME = "taskland-db";
  const DB_VERSION = 1; // <-- igual que en tu db.ts
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains("tasks"))
        d.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
      if (!d.objectStoreNames.contains("outbox"))
        d.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
