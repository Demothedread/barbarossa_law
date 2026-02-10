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
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-top: 2px solid var(--warning-yellow, #fbbf24);
  z-index: 9998;
}

.offline-indicator__icon {
  font-size: 1.25rem;
  animation: pulse 2s ease-in-out infinite;
}

.offline-indicator__text {
  font-size: 0.875rem;
  color: var(--lunar-white, #fff);
}

.offline-indicator__action {
  padding: 0.375rem 0.75rem;
  background: var(--warning-yellow, #fbbf24);
  color: #1a1a2e;
  border: none;
  border-radius: 4px;
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
