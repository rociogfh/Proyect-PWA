// Registro del Service Worker con soporte para actualización y logs
export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[SW] Registrado correctamente:", registration);
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    console.log("[SW] Nueva versión disponible.");
                  } else {
                    console.log("[SW] Contenido cacheado listo para usar offline.");
                  }
                }
              };
            }
          };
        })
        .catch((error) => console.error("[SW] Error al registrar:", error));
    });
  } else {
    console.log("🚫 Service Worker no soportado en este navegador.");
  }
}
