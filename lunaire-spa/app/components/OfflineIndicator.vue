<template>
  <Transition name="offline-indicator">
    <div v-if="!isOnline" class="offline-indicator" role="alert">
      <span class="offline-indicator__icon">📡</span>
      <span class="offline-indicator__text">
        You're offline. Some features may be limited.
      </span>
      <button
        v-if="hasCachedData"
        class="offline-indicator__action"
        @click="showOfflineMode"
      >
        Study Offline
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useOfflineStorage } from "~/composables/useOfflineStorage";

const { isOnline, cacheSize } = useOfflineStorage();
const router = useRouter();

const hasCachedData = computed(() => cacheSize.value > 0);

const showOfflineMode = () => {
  router.push("/quiz/setup?offline=true");
};
</script>

<style scoped>
.offline-indicator {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--paper);
  border-top: 3px solid var(--accent-yellow, #ffd600);
  z-index: 9998;
}

.offline-indicator__icon {
  font-size: 1.25rem;
  animation: pulse 2s ease-in-out infinite;
}

.offline-indicator__text {
  font-size: 0.875rem;
  color: var(--ink);
}

.offline-indicator__action {
  padding: 0.375rem 0.75rem;
  background: var(--accent-yellow, #ffd600);
  color: var(--ink);
  border: 2px solid;
  border-color: var(--bevel-light) var(--bevel-dark) var(--bevel-dark)
    var(--bevel-light);
  border-radius: 0;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s,
    background-color 0.2s;
}

.offline-indicator__action:hover {
  transform: scale(1.05);
  background: #f59e0b;
}

/* Animations */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.offline-indicator-enter-active,
.offline-indicator-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.offline-indicator-enter-from,
.offline-indicator-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
