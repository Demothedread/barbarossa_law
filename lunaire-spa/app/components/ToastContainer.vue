<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
        >
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" @click="removeToast(toast.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToastStore } from "~/stores/toast";

const toastStore = useToastStore();
const toasts = computed(() => toastStore.toasts);

const removeToast = (id: string) => {
  toastStore.remove(id);
};
</script>

<style scoped>
.toast__close {
  background: none;
  border: none;
  color: var(--star-silver);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 4px;
}

.toast__close:hover {
  color: var(--lunar-white);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
