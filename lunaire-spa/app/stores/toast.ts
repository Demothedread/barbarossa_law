import { defineStore } from "pinia";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

export const useToastStore = defineStore("toast", {
  state: () => ({
    toasts: [] as Toast[],
  }),

  actions: {
    add(toast: Omit<Toast, "id">) {
      const id = crypto.randomUUID();
      const newToast = { ...toast, id };
      this.toasts.push(newToast);

      // Auto-remove after duration
      const duration = toast.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => this.remove(id), duration);
      }
    },

    remove(id: string) {
      const index = this.toasts.findIndex((t) => t.id === id);
      if (index !== -1) {
        this.toasts.splice(index, 1);
      }
    },

    success(message: string, duration?: number) {
      this.add({ message, type: "success", duration });
    },

    error(message: string, duration?: number) {
      this.add({ message, type: "error", duration });
    },

    warning(message: string, duration?: number) {
      this.add({ message, type: "warning", duration });
    },

    info(message: string, duration?: number) {
      this.add({ message, type: "info", duration });
    },
  },
});
