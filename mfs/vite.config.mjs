import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: true,
    assetsDir: "static",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          mui: ["@mui/material", "@emotion/react", "@emotion/styled"],
          charts: ["recharts"],
          pdf: ["react-pdf"],
          motion: ["framer-motion"],
        },
      },
    },
  },
});
