// vite.config.js

import { defineConfig } from "vite";

export default defineConfig({
  root: "view",
  publicDir: "../public",
  server: {
    proxy: {
      // Aturan ini akan menangani semua panggilan yang diawali dengan /api
      "/api": {
        target: "https://bf66-114-122-111-207.ngrok-free.app",
        changeOrigin: true,
        secure: false,

        // BENAR UNTUK KASUS ANDA: Jangan ubah path.
        // /api/login dari frontend akan tetap menjadi /api/login ke backend.
        rewrite: (path) => path,

        // PENTING: Tambahkan header untuk melewati halaman peringatan Ngrok.
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
          });
        },
      },

      // Aturan ini tetap sama untuk gambar profil
      "/profile/": {
        target: "https://bf66-114-122-111-207.ngrok-free.app",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
          });
        },
      },
    },
  },
});