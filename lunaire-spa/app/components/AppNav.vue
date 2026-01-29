e
<template>
  <nav class="app-nav">
    <!-- Brand -->
    <NuxtLink to="/" class="app-nav__brand">
      <span class="app-nav__title">Barbarossa </span>
      <span class="app-nav__tagline"> NO FRILLS ALL THRILLS </span>
    </NuxtLink>

    <!-- Navigation Links -->
    <div class="app-nav__links">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.path"
        :to="link.path"
        class="app-nav__link"
        :class="{ 'app-nav__link--active': isActive(link.path) }"
      >
        {{ link.label }}
      </NuxtLink>
    </div>

    <!-- Actions -->
    <div class="app-nav__actions">
      <button
        class="btn btn--ghost"
        title="Toggle contrast"
        @click="toggleContrast"
      >
        <IconContrast />
      </button>
      <button class="btn btn--secondary">
        <IconUser />
        Account
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/quiz/setup", label: "Practice" },
  { path: "/essays", label: "Essays" },
  { path: "/study", label: "Study" },
  { path: "/statistics", label: "Statistics" },
  { path: "/about", label: "About" },
];

const isActive = (path: string) => {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
};

const toggleContrast = () => {
  document.body.classList.toggle("low-contrast");
};
</script>
