// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@pinia/nuxt", "@vueuse/nuxt", "@nuxt/content", "@vite-pwa/nuxt"],

  devtools: { enabled: true },
  compatibilityDate: "2024-04-03",

  ssr: false, // Pure SPA mode

  app: {
    head: {
      title: "Deez' Eazy-Breezy Bar Review Bonanza | monobloc.com",
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
        },
        {
          name: "description",
          content:
            "The Adequate, Unaccredited, Probably Illegal, but Arguably Ethical Bar Review. No frills. Generic. The baseline of what you need. Free at monobloc.com.",
        },
        { name: "theme-color", content: "#0a0a1a" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black-translucent",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
        },
        {
          rel: "stylesheet",
          href: "https://use.typekit.net/wow2lwe.css",
        },
        {
          rel: "apple-touch-icon",
          href: "/icons/apple-touch-icon-180x180.png",
        },
      ],
    },
  },

  css: ["./app/assets/css/main.css"],

  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE ||
        process.env.API_BASE ||
        "http://localhost:5001/api",
      supabaseUrl:
        process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
      supabaseKey:
        process.env.NUXT_PUBLIC_SUPABASE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.SUPABASE_KEY ||
        "",
    },
  },

  // PWA Configuration
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Deez' Eazy-Breezy Bar Review Bonanza",
      short_name: "Deez' Eazy-Breezy",
      description:
        "The Adequate, Unaccredited, Probably Illegal Bar Review — monobloc.com",
      theme_color: "#0a0a1a",
      background_color: "#0a0a1a",
      display: "standalone",
      orientation: "portrait",
      icons: [
        {
          src: "/icons/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icons/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/icons/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      // Cache static assets
      globPatterns: ["**/*.{js,css,html,png,svg,ico,woff,woff2}"],
      // Runtime caching for API calls
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
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /\/api\/subjects$/,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "api-subjects-cache",
            expiration: {
              maxEntries: 1,
              maxAgeSeconds: 60 * 60, // 1 hour
            },
          },
        },
        {
          urlPattern: /\/api\/questions\?/,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-questions-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 30, // 30 minutes
            },
            networkTimeoutSeconds: 10,
          },
        },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600, // Check for updates every hour
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      type: "module",
    },
  },
});
