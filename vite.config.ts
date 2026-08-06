import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/logo.svg"],
      manifest: {
        name: "STAGES - Infrastructure Project Tracker",
        short_name: "STAGES",
        description: "Plan · Execute · Verify · Close",
        start_url: "/",
        display: "standalone",
        background_color: "#0a192f",
        theme_color: "#0a192f",
        orientation: "any",
        icons: [
          { src: "/assets/logo.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/assets/logo.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
    }),
  ],
});
