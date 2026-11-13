import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // When running `vite` alone (front-end only), proxy API calls to
      // `vercel dev` (see docs/RUNBOOK.md) so relative fetch('/api/...')
      // calls work the same way they will in production.
      "/api": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
  },
});
