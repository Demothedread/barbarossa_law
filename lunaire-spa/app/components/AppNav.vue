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
      
      <!-- Authenticated: show user dropdown -->
      <div v-if="authStore.isAuthenticated" class="user-dropdown">
        <button class="btn btn--secondary" @click="showDropdown = !showDropdown">
          <IconUser />
          {{ authStore.displayName }}
        </button>
        <div v-if="showDropdown" class="user-dropdown__menu">
          <button @click="handleLogout">Sign Out</button>
        </div>
      </div>
      
      <!-- Not authenticated: show sign in button -->
      <button v-else class="btn btn--secondary" @click="authStore.openAuthModal('login')">
        <IconUser />
        Sign In
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const showDropdown = ref(false);

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

const handleLogout = async () => {
  await authStore.logout();
  showDropdown.value = false;
};

// Close dropdown when clicking outside
onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-dropdown')) {
        showDropdown.value = false;
      }
    });
  }
});

// Initialize auth on mount
onMounted(() => {
  authStore.initAuth();
});
</script>

<style scoped>
.user-dropdown {
  position: relative;
}

.user-dropdown__menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--color-surface, #1a1a2e);
  border: 1px solid var(--color-border, #333);
  border-radius: 8px;
  padding: 0.5rem;
  min-width: 120px;
  z-index: 100;
}

.user-dropdown__menu button {
  width: 100%;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: var(--color-text, #fff);
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
}

.user-dropdown__menu button:hover {
  background: var(--color-bg, #0a0a1a);
}
</style>
