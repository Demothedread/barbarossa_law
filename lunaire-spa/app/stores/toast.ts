import { defineStore } from "pinia";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface ToastConfig {
  /** Duration in ms (0 = no auto-dismiss, default varies by type) */
  duration?: number;
  /** Can be manually dismissed (default: true) */
  dismissible?: boolean;
  /** Optional action button */
  action?: {
    label: string;
    handler: () => void;
  };
}

// Default durations by type
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 6000, // Errors stay longer
};

// Icon mapping for toast types
export const TOAST_ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

export const useToastStore = defineStore("toast", {
  state: () => ({
    toasts: [] as Toast[],
    maxToasts: 5, // Limit visible toasts
  }),

  getters: {
    // Get visible toasts (most recent first, limited)
    visibleToasts: (state) => {
      return [...state.toasts].slice(-state.maxToasts).reverse();
    },
  },

  actions: {
    add(toast: Omit<Toast, "id">) {
      const id = crypto.randomUUID();
      const newToast: Toast = {
        ...toast,
        id,
        dismissible: toast.dismissible ?? true,
      };
      this.toasts.push(newToast);

      // Auto-remove after duration
      const duration = toast.duration ?? DEFAULT_DURATIONS[toast.type];
      if (duration > 0) {
        setTimeout(() => this.remove(id), duration);
      }

      // Trim old toasts if too many
      while (this.toasts.length > this.maxToasts * 2) {
        this.toasts.shift();
      }

      return id;
    },

    remove(id: string) {
      const index = this.toasts.findIndex((t) => t.id === id);
      if (index !== -1) {
        this.toasts.splice(index, 1);
      }
    },

    clear() {
      this.toasts = [];
    },

    // Convenience methods
    success(message: string, config?: ToastConfig) {
      return this.add({ message, type: "success", ...config });
    },

    error(message: string, config?: ToastConfig) {
      return this.add({ message, type: "error", ...config });
    },

    warning(message: string, config?: ToastConfig) {
      return this.add({ message, type: "warning", ...config });
    },

    info(message: string, config?: ToastConfig) {
      return this.add({ message, type: "info", ...config });
    },

    // Generic show method (used by useApiClient)
    show(message: string, type: ToastType = "info", config?: ToastConfig) {
      return this.add({ message, type, ...config });
    },
  },
});
