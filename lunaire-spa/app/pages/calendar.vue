<template>
  <div class="calendar-page">
    <ScheduleCrashCourse />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: "Study Calendar",
});

useHead({
  title: "Study Calendar | Barbarossa",
  meta: [
    {
      name: "description",
      content: "21-Day Bar Review Crash Course calendar and study schedule",
    },
  ],
});
</script>

<style scoped>
.calendar-page {
  min-height: 100vh;
  padding: var(--space-lg);
  background: var(--surface-1);
}

@media (max-width: 768px) {
  .calendar-page {
    padding: var(--space-md);
  }
}
</style>
