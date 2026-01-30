<template>
  <div class="app-root">
    <!-- Animated starfield background -->
    <div class="starfield" />

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

    <!-- Auth Modal -->
    <AuthModal />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

// Hide dock during quiz to maximize focus
const showDock = computed(() => {
  return !route.path.includes("/quiz/");
});
</script>
