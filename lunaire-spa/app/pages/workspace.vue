<template>
  <div class="workspace-page">
    <WorkspaceContainer />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
});

useSeoMeta({
  title: "Study Workspace - Deez' Eazy-Breezy Bar Review",
  description:
    "Your customizable study workspace with draggable, resizable panels",
});
</script>

<style scoped>
.workspace-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #0a0f1a;
}
</style>
