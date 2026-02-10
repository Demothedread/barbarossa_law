<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in visibleToasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          role="alert"
          :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
        >
          <span class="toast__icon">{{ getIcon(toast.type) }}</span>
          <span class="toast__message">{{ toast.message }}</span>
          <button
            v-if="toast.action"
            class="toast__action"
            @click="handleAction(toast)"
          >
            {{ toast.action.label }}
          </button>
          <button
            v-if="toast.dismissible"
            class="toast__close"
            aria-label="Dismiss"
            @click="removeToast(toast.id)"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Toast, ToastType } from "~/stores/toast";
import { TOAST_ICONS, useToastStore } from "~/stores/toast";

const toastStore = useToastStore();
const visibleToasts = computed(() => toastStore.visibleToasts);

const getIcon = (type: ToastType) => TOAST_ICONS[type];

const removeToast = (id: string) => {
  toastStore.remove(id);
};

const handleAction = (toast: Toast) => {
  if (toast.action?.handler) {
    toast.action.handler();
  }
  toastStore.remove(toast.id);
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  background: var(--midnight-purple, #1a1a2e);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 280px;
  max-width: 100%;
}

.toast__icon {
  font-size: 1.125rem;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.toast__message {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--lunar-white, #fff);
}

.toast__action {
  background: transparent;
  border: 1px solid currentColor;
  color: inherit;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toast__action:hover {
  background: rgba(255, 255, 255, 0.1);
}

.toast__close {
  background: none;
  border: none;
  color: var(--star-silver, #888);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.toast__close:hover {
  opacity: 1;
  color: var(--lunar-white, #fff);
}

/* Type-specific styles */
.toast--success {
  border-left: 4px solid var(--success-green, #4ade80);
}

.toast--success .toast__icon {
  color: var(--success-green, #4ade80);
  background: rgba(74, 222, 128, 0.15);
}

.toast--error {
  border-left: 4px solid var(--error-red, #f87171);
}

.toast--error .toast__icon {
  color: var(--error-red, #f87171);
  background: rgba(248, 113, 113, 0.15);
}

.toast--warning {
  border-left: 4px solid var(--warning-yellow, #fbbf24);
}

.toast--warning .toast__icon {
  color: var(--warning-yellow, #fbbf24);
  background: rgba(251, 191, 36, 0.15);
}

.toast--info {
  border-left: 4px solid var(--info-blue, #60a5fa);
}

.toast--info .toast__icon {
  color: var(--info-blue, #60a5fa);
  background: rgba(96, 165, 250, 0.15);
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
