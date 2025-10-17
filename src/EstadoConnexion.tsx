import { useEffect, useState } from "react";

export default function EstadoConexion() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        background: online ? "#4caf50" : "#ff5252",
        color: "#fff",
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 14,
        boxShadow: "0 3px 8px rgba(0,0,0,.2)",
      }}
    >
      {online ? "Online" : "Offline"}
    </div>
  );
}
