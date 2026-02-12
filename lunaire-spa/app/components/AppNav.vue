<template>
  <nav class="app-nav">
    <!-- Brand -->
    <NuxtLink to="/" class="app-nav__brand">
      <span class="app-nav__title">Deez' Eazy-Breezy </span>
      <span class="app-nav__tagline"> ADEQUATE & FREE </span>
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
        <button
          class="btn btn--secondary"
          @click="showDropdown = !showDropdown"
        >
          <IconUser />
          {{ authStore.displayName }}
        </button>
        <div v-if="showDropdown" class="user-dropdown__menu">
          <button @click="handleLogout">
            {{ copyStore.content.nav.signOut.text }}
          </button>
        </div>
      </div>

      <!-- Not authenticated: show sign in button -->
      <button
        v-else
        class="btn btn--secondary"
        @click="authStore.openAuthModal('login')"
      >
        <IconUser />
        {{ copyStore.content.nav.signIn.text }}
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import { useCopyStore } from "~/stores/copy";

const route = useRoute();
const authStore = useAuthStore();
const copyStore = useCopyStore();
const showDropdown = ref(false);

const navLinks = computed(() => [
  { path: "/", label: copyStore.content.nav.home.text },
  { path: "/quiz/setup", label: copyStore.content.nav.quiz.text },
  { path: "/essays", label: copyStore.content.nav.essays.text },
  { path: "/calendar", label: "Calendar" },
  { path: "/study", label: copyStore.content.nav.study.text },
  { path: "/statistics", label: copyStore.content.nav.statistics.text },
  { path: "/about", label: copyStore.content.nav.about.text },
]);

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
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".user-dropdown")) {
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
  background: var(--paper);
  border: 2px solid;
  border-color: var(--bevel-light) var(--bevel-dark) var(--bevel-dark)
    var(--bevel-light);
  padding: 0.5rem;
  min-width: 120px;
  z-index: 100;
  box-shadow: var(--shadow-lg);
}

.user-dropdown__menu button {
  width: 100%;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.user-dropdown__menu button:hover {
  background: var(--concrete);
}
</style>
