// IndexedDB nativo: tasks (UI) + outbox (para Background Sync)

export interface Task {
  id?: number;
  firebaseId?: string;
  title: string;
  description: string;
  completed: boolean;
  priority: "Alta" | "Media" | "Baja";
  dueDate?: string;
  synced?: boolean; // true si ya se envió al server/Firebase
}

const DB_NAME = "taskland-db";
let db: IDBDatabase | null = null;

export async function openDB(): Promise<IDBDatabase> {
  if (db) return db;

  db = await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const d = req.result;

      if (!d.objectStoreNames.contains("tasks")) {
        d.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
      }

      if (!d.objectStoreNames.contains("outbox")) {
        d.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return db!;
}

// ---------- TASKS ----------
export async function saveTask(task: Task) {
  const db = await openDB();
  const tx = db.transaction("tasks", "readwrite");

  tx.objectStore("tasks").put(task);

  await new Promise((res, rej) => {
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await openDB();

  return await new Promise((res, rej) => {
    const tx = db.transaction("tasks", "readonly");
    const req = tx.objectStore("tasks").getAll();

    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
}

export async function deleteTask(id: number) {
  const db = await openDB();
  const tx = db.transaction("tasks", "readwrite");

  tx.objectStore("tasks").delete(id);

  await new Promise((res, rej) => {
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}

// ---------- OUTBOX (para sync) ----------
export async function queueToOutbox(payload: any) {
  const db = await openDB();
  const tx = db.transaction("outbox", "readwrite");

  tx.objectStore("outbox").put({ ...payload, queuedAt: Date.now() });

  await new Promise((res, rej) => {
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}

export async function getOutbox(): Promise<any[]> {
  const db = await openDB();

  return await new Promise((res, rej) => {
    const tx = db.transaction("outbox", "readonly");
    const req = tx.objectStore("outbox").getAll();

    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
}

export async function deleteOutbox(id: number) {
  const db = await openDB();
  const tx = db.transaction("outbox", "readwrite");

  tx.objectStore("outbox").delete(id);

  await new Promise((res, rej) => {
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}