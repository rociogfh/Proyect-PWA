// server.js (ESM)
import "dotenv/config";
import express from "express";
import cors from "cors";
import webpush from "web-push";

const app = express();
app.use(cors());
app.use(express.json());

// --- VALIDAR que las claves llegaron desde .env ---
const PUB = (process.env.VAPID_PUBLIC_KEY || "").trim();
const PRI = (process.env.VAPID_PRIVATE_KEY || "").trim();

console.log("VAPID_PUBLIC_KEY length:", PUB.length);
console.log("VAPID_PRIVATE_KEY length:", PRI.length);

// Si faltan o están vacías, cortar aquí con mensaje claro
if (!PUB || !PRI) {
  console.error("❌ Faltan claves VAPID. Revisa el archivo .env en la RAÍZ del proyecto.");
  console.error("Ejemplo de .env:");
  console.error("VAPID_PUBLIC_KEY=TU_PUBLIC_KEY");
  console.error("VAPID_PRIVATE_KEY=TU_PRIVATE_KEY");
  process.exit(1);
}

// Configurar web-push
webpush.setVapidDetails("mailto:tu-email@ejemplo.com", PUB, PRI);

// Suscripciones en memoria (demo)
const subs = new Set();
app.post("/api/push/subscribe", (req, res) => {
  subs.add(req.body);
  res.status(201).json({ ok: true });
});

app.post("/api/push/test", async (_req, res) => {
  const payload = JSON.stringify({ title: "TaskLand", body: "Notificación de prueba ✅" });
  let sent = 0;
  for (const s of subs) {
    try { await webpush.sendNotification(s, payload); sent++; } catch {}
  }
  res.json({ sent });
});

// Endpoint usado por el SW para la sync
app.post("/api/entries", (req, res) => {
  console.log("📥 Entrada recibida:", req.body);
  res.status(201).json({ ok: true });
});

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

const PORT = 4000;
app.listen(PORT, () => console.log(`✅ API en http://localhost:${PORT}`));
