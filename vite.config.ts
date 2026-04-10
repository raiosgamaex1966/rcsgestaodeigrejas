import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["mask-icon.svg"],
      manifest: {
        name: "RCS Gestão de Igrejas",
        short_name: "RCS Gestão",
        description: "Plano de gestão completa para igrejas, ministérios e pastores.",
        theme_color: "#0f0f0f",
        background_color: "#faf8f5",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "https://wupotdvlfvnxbtmtyiez.supabase.co/storage/v1/object/public/church-assets/pwa-icons/1766086206189-favicon_2.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "https://wupotdvlfvnxbtmtyiez.supabase.co/storage/v1/object/public/church-assets/pwa-icons/1766086219915-favicon_2.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "https://wupotdvlfvnxbtmtyiez.supabase.co/storage/v1/object/public/church-assets/pwa-icons/1766086219915-favicon_2.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
