import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Client public : aucun secret, aucune clé (04_structure_rules/05).
// En dev, on relaie /v1 vers le backend de confiance (port 3000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/v1": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
