// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 🔹 Configuración completa para entorno local con API y SW
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy local → evita problemas CORS al enviar datos desde IndexedDB
      "/api": {
        target: "http://localhost:4000", // tu backend local
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
