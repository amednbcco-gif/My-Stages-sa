// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///home/project/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/logo.svg"],
      manifest: {
        name: "STAGES - Infrastructure Project Tracker",
        short_name: "STAGES",
        description: "Plan \xB7 Execute \xB7 Verify \xB7 Close",
        start_url: "/",
        display: "standalone",
        background_color: "#0a192f",
        theme_color: "#0a192f",
        orientation: "any",
        icons: [
          { src: "/assets/logo.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/assets/logo.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }
        ]
      }
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgVml0ZVBXQSh7XG4gICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxuICAgICAgaW5jbHVkZUFzc2V0czogW1wiYXNzZXRzL2xvZ28uc3ZnXCJdLFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogXCJTVEFHRVMgLSBJbmZyYXN0cnVjdHVyZSBQcm9qZWN0IFRyYWNrZXJcIixcbiAgICAgICAgc2hvcnRfbmFtZTogXCJTVEFHRVNcIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiUGxhbiBcdTAwQjcgRXhlY3V0ZSBcdTAwQjcgVmVyaWZ5IFx1MDBCNyBDbG9zZVwiLFxuICAgICAgICBzdGFydF91cmw6IFwiL1wiLFxuICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjMGExOTJmXCIsXG4gICAgICAgIHRoZW1lX2NvbG9yOiBcIiMwYTE5MmZcIixcbiAgICAgICAgb3JpZW50YXRpb246IFwiYW55XCIsXG4gICAgICAgIGljb25zOiBbXG4gICAgICAgICAgeyBzcmM6IFwiL2Fzc2V0cy9sb2dvLnN2Z1wiLCBzaXplczogXCIxOTJ4MTkyXCIsIHR5cGU6IFwiaW1hZ2Uvc3ZnK3htbFwiLCBwdXJwb3NlOiBcImFueSBtYXNrYWJsZVwiIH0sXG4gICAgICAgICAgeyBzcmM6IFwiL2Fzc2V0cy9sb2dvLnN2Z1wiLCBzaXplczogXCI1MTJ4NTEyXCIsIHR5cGU6IFwiaW1hZ2Uvc3ZnK3htbFwiLCBwdXJwb3NlOiBcImFueSBtYXNrYWJsZVwiIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIH0pLFxuICBdLFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsZUFBZSxDQUFDLGlCQUFpQjtBQUFBLE1BQ2pDLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLGFBQWE7QUFBQSxRQUNiLFdBQVc7QUFBQSxRQUNYLFNBQVM7QUFBQSxRQUNULGtCQUFrQjtBQUFBLFFBQ2xCLGFBQWE7QUFBQSxRQUNiLGFBQWE7QUFBQSxRQUNiLE9BQU87QUFBQSxVQUNMLEVBQUUsS0FBSyxvQkFBb0IsT0FBTyxXQUFXLE1BQU0saUJBQWlCLFNBQVMsZUFBZTtBQUFBLFVBQzVGLEVBQUUsS0FBSyxvQkFBb0IsT0FBTyxXQUFXLE1BQU0saUJBQWlCLFNBQVMsZUFBZTtBQUFBLFFBQzlGO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
