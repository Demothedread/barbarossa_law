<template>
  <div class="app-root">
    <!-- Constructivist geometric background -->
    <div class="geo-bg" />

    <!-- Main app layout -->
    <div class="app-layout" :class="{ 'app-layout--no-dock': !showDock }">
      <!-- Top Navigation -->
      <AppNav />

      <!-- Left Study Dock -->
      <StudyDock v-if="showDock" />

      <!-- Main Content Area -->
      <main class="app-main">
        <NuxtPage />
      </main>
    </div>

    <!-- Toast Container -->
    <ToastContainer />

    <!-- Offline Indicator -->
    <OfflineIndicator />

    <!-- Auth Modal -->
    <AuthModal />

    <!-- Vercel Analytics -->
    <Analytics />
  </div>
</template>

<script setup lang="ts">
import { Analytics } from "@vercel/analytics/nuxt";

const route = useRoute();

// Hide dock during quiz to maximize focus
const showDock = computed(() => {
  return !route.path.includes("/quiz/");
});
</script>
