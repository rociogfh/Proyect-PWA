import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { saveTask, getAllTasks, queueToOutbox } from "./db";
import type { Task } from "./db";
import { askNotify, subscribePush } from "./push";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("Media");
  const [dueDate, setDueDate] = useState("");
  const [online, setOnline] = useState(navigator.onLine);

  /* Cargar tareas y estado online/offline */
  useEffect(() => {
    getAllTasks().then((data) =>
      setTasks(data.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0)))
    );
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  /* 🔔 Pedir permiso de notificaciones al iniciar
     - Espera a que el SW esté listo
     - Si ya es granted, intenta (o reusa) suscripción
     - Si es default, muestra prompt
     - Si es denied, no puede volver a mostrar prompt (puedes guiar al usuario a habilitar permisos) */
  useEffect(() => {
    (async () => {
      try {
        if (!("Notification" in window)) return;

        // Muy importante en algunos navegadores: esperar a que el SW esté listo
        try { await navigator.serviceWorker?.ready; } catch {}

        if (Notification.permission === "granted") {
          await subscribePush(import.meta.env.VITE_VAPID_PUBLIC as string);
        } else if (Notification.permission === "default") {
          const ok = await askNotify();
          if (ok) {
            await subscribePush(import.meta.env.VITE_VAPID_PUBLIC as string);
          }
        } else {
          // "denied": el navegador no volverá a mostrar el prompt automáticamente
          // Puedes mostrar un aviso si quieres:
          // alert("Tienes las notificaciones bloqueadas en el navegador. Habilítalas en el candado de la barra de direcciones.");
        }
      } catch (e) {
        console.warn("Error al solicitar/activar notificaciones:", e);
      }
    })();
  }, []);

  const completed = tasks.filter((t) => t.completed).length;
  const percent = useMemo(
    () => (tasks.length ? Math.round((completed / tasks.length) * 100) : 0),
    [tasks, completed]
  );

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      title: title.trim(),
      description: description.trim(),
      completed: false,
      priority,
      dueDate: dueDate || undefined,
      synced: navigator.onLine,
    };

    await saveTask(newTask);
    setTasks((prev) => [{ ...newTask, id: Date.now() }, ...prev]);

    setTitle("");
    setDescription("");
    setPriority("Media");
    setDueDate("");

    if (!navigator.onLine) {
      await queueToOutbox({ type: "task", payload: newTask });
      // @ts-ignore - TS no tipa SyncManager
      const reg = await navigator.serviceWorker.ready;
      // @ts-ignore
      reg.sync?.register?.("sync-entries");
      alert("Guardado offline. Se sincronizará al volver la conexión.");
    } else {
      fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      }).catch(() => {});
    }
  }

  function toggleTask(i: number) {
    const copy = [...tasks];
    copy[i].completed = !copy[i].completed;
    setTasks(copy);
    saveTask(copy[i]);
  }

  return (
    <div className="page">
      <main className="container">
        <h1 className="title">Lista de tareas </h1>
        <p className="subtitle">Progreso: {percent}%</p>

        <section className="card">
          <div className="progress">
            <div className="progress-bar" style={{ width: `${percent}%` }} />
            <span className="progress-label">{percent}%</span>
          </div>

          <h2 className="section-title">Tareas — Agregar nueva</h2>
          <form className="form" onSubmit={addTask}>
            <input
              className="input"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="input"
              placeholder="Descripción"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="row">
              <select
                className="input"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Task["priority"])
                }
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
              <input
                className="input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="nav-row" style={{ marginTop: 10 }}>
              <button className="primary-btn" type="submit">
                Guardar tarea
              </button>
            </div>
          </form>
        </section>

        <section className="card list-card">
          <h2 className="section-title">Tus tareas</h2>
          {tasks.length === 0 ? (
            <p className="empty">Aún no hay tareas. Añade tu primera tarea arriba.</p>
          ) : (
            <ul className="list">
              {tasks.map((t, i) => (
                <li key={(t.id ?? i)} className="item">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggleTask(i)}
                    />
                    <span />
                  </label>
                  <div className="item-body">
                    <div className="item-head">
                      <h3 className={`item-title ${t.completed ? "done" : ""}`}>
                        {t.title}
                      </h3>
                      <span
                        className={`pill ${
                          t.priority === "Alta"
                            ? "pill-red"
                            : t.priority === "Media"
                            ? "pill-amber"
                            : "pill-green"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    {t.description && (
                      <p className="item-desc">{t.description}</p>
                    )}
                    <div className="item-meta">
                      {t.dueDate && <span>Vence: {t.dueDate}</span>}{" "}
                      {t.synced && <span>✅ Sincronizado</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Indicador conexión */}
      <div
        style={{
          position: "fixed",
          bottom: 12,
          right: 12,
          background: online ? "#22c55e" : "#ef4444",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: 999,
          boxShadow: "0 6px 16px rgba(0,0,0,.15)",
        }}
      >
        {online ? "Online" : "Offline"}
      </div>
    </div>
  );
}
