<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="authStore.showAuthModal"
        class="auth-modal-overlay"
        @click.self="authStore.closeAuthModal"
      >
        <div class="auth-modal">
          <button class="auth-modal__close" @click="authStore.closeAuthModal">
            ×
          </button>

          <h2 class="auth-modal__title">
            {{
              authStore.authMode === "login" ? "Welcome Back" : "Create Account"
            }}
          </h2>

          <form class="auth-form" @submit.prevent="handleSubmit">
            <div class="auth-form__field">
              <label for="username">Username</label>
              <input
                id="username"
                v-model="username"
                type="text"
                required
                autocomplete="username"
                placeholder="Enter username"
              />
            </div>

            <div
              v-if="authStore.authMode === 'register'"
              class="auth-form__field"
            >
              <label for="email">Email (optional)</label>
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="Enter email"
              />
            </div>

            <div class="auth-form__field">
              <label for="password">Password</label>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="Enter password"
              />
            </div>

            <div v-if="authStore.error" class="auth-form__error">
              {{ authStore.error }}
            </div>

            <button
              type="submit"
              class="btn btn--primary auth-form__submit"
              :disabled="authStore.isLoading"
            >
              {{
                authStore.isLoading
                  ? "Please wait..."
                  : authStore.authMode === "login"
                    ? "Sign In"
                    : "Create Account"
              }}
            </button>
          </form>

          <div class="auth-modal__switch">
            <template v-if="authStore.authMode === 'login'">
              Don't have an account?
              <button
                class="auth-modal__link"
                @click="authStore.authMode = 'register'"
              >
                Sign up
              </button>
            </template>
            <template v-else>
              Already have an account?
              <button
                class="auth-modal__link"
                @click="authStore.authMode = 'login'"
              >
                Sign in
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

const username = ref("");
const email = ref("");
const password = ref("");

const handleSubmit = async () => {
  if (authStore.authMode === "login") {
    await authStore.login(username.value, password.value);
  } else {
    await authStore.register(
      username.value,
      password.value,
      email.value || undefined,
    );
  }

  if (authStore.isAuthenticated) {
    // Clear form on success
    username.value = "";
    email.value = "";
    password.value = "";
  }
};

// Clear form when modal opens
watch(
  () => authStore.showAuthModal,
  (isOpen) => {
    if (isOpen) {
      username.value = "";
      email.value = "";
      password.value = "";
    }
  },
);
</script>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.auth-modal {
  background: var(--paper);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  position: relative;
}

.auth-modal__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: var(--color-text-muted, #888);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;
}

.auth-modal__close:hover {
  color: var(--ink);
}

.auth-modal__title {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
  text-align: center;
  color: var(--ink);
}

.auth-form__field {
  margin-bottom: 1rem;
}

.auth-form__field label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-muted, #aaa);
  font-size: 0.875rem;
}

.auth-form__field input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-bg, var(--concrete));
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  color: var(--ink);
  font-size: 1rem;
}

.auth-form__field input:focus {
  outline: none;
  border-color: var(--color-primary, #6366f1);
}

.auth-form__error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 0.75rem;
  border-radius: 0;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.auth-form__submit {
  width: 100%;
  padding: 0.875rem;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.auth-modal__switch {
  margin-top: 1.5rem;
  text-align: center;
  color: var(--color-text-muted, #888);
  font-size: 0.875rem;
}

.auth-modal__link {
  background: none;
  border: none;
  color: var(--color-primary, #6366f1);
  cursor: pointer;
  font-size: inherit;
  text-decoration: underline;
}

.auth-modal__link:hover {
  color: var(--color-primary-light, #818cf8);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .auth-modal,
.modal-leave-active .auth-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .auth-modal,
.modal-leave-to .auth-modal {
  transform: scale(0.95);
}
</style>
