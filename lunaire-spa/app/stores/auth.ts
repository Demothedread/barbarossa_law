import { defineStore } from "pinia";

export interface User {
  id: string;
  username: string;
  email?: string;
  preferences?: Record<string, unknown>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  showAuthModal: boolean;
  authMode: "login" | "register";
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    showAuthModal: false,
    authMode: "login",
  }),

  getters: {
    displayName: (state) => state.user?.username || "Guest",
  },

  actions: {
    openAuthModal(mode: "login" | "register" = "login") {
      this.authMode = mode;
      this.showAuthModal = true;
      this.error = null;
    },

    closeAuthModal() {
      this.showAuthModal = false;
      this.error = null;
    },

    async register(username: string, password: string, email?: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const config = useRuntimeConfig();
        const response = await fetch(`${config.public.apiBase}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Registration failed");
        }

        this.token = data.token;
        this.user = data.user;
        this.isAuthenticated = true;
        this.showAuthModal = false;

        // Persist token
        if (import.meta.client) {
          localStorage.setItem("auth_token", data.token);
        }

        return true;
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Registration failed";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async login(username: string, password: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const config = useRuntimeConfig();
        const response = await fetch(`${config.public.apiBase}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Login failed");
        }

        this.token = data.token;
        this.user = data.user;
        this.isAuthenticated = true;
        this.showAuthModal = false;

        // Persist token
        if (import.meta.client) {
          localStorage.setItem("auth_token", data.token);
        }

        return true;
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Login failed";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        const config = useRuntimeConfig();
        if (this.token) {
          await fetch(`${config.public.apiBase}/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          });
        }
      } catch {
        // Ignore logout errors
      }

      this.user = null;
      this.token = null;
      this.isAuthenticated = false;

      if (import.meta.client) {
        localStorage.removeItem("auth_token");
      }
    },

    async fetchMe() {
      if (!this.token) return;

      try {
        const config = useRuntimeConfig();
        const response = await fetch(`${config.public.apiBase}/auth/me`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.user = data.user;
          this.isAuthenticated = true;
        } else {
          // Token invalid, clear it
          this.logout();
        }
      } catch {
        this.logout();
      }
    },

    async initAuth() {
      if (import.meta.client) {
        const token = localStorage.getItem("auth_token");
        if (token) {
          this.token = token;
          await this.fetchMe();
        }
      }
    },

    getAuthHeaders(): Record<string, string> {
      if (this.token) {
        return { Authorization: `Bearer ${this.token}` };
      }
      return {};
    },
  },

  persist: {
    pick: ["token"],
  },
});
