import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000"
    }
  }
});



// Why it exists：把 API 代理到后端，避免 CORS 麻烦（本地最稳）。