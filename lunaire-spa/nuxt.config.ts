// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@pinia/nuxt", "@vueuse/nuxt", "@nuxt/content"],

  devtools: { enabled: true },
  compatibilityDate: "2024-04-03",

  ssr: false, // Pure SPA mode

  app: {
    head: {
      title: "Barbarossa Bar Prep | The Cheap Bar Review",
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
            "Because $4,000 is for suckers. No spiral learning. No Pass Predictor. Just questions and your crushing anxiety. California Bar exam preparation.",
        },
        { name: "theme-color", content: "#0a0a1a" },
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
      ],
    },
  },

  css: ["./app/assets/css/main.css"],

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || "http://localhost:5001/api",
    },
  },
});
