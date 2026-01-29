/**
 * Module: lq-loading.js
 * Utility functions for showing and hiding loading and error states.
 * @module lq-loading
 */

/**
 * Display a loading indicator with optional message.
 * @param {string} [message='Loading...'] - Message to display
 */
export function showLoading(message = "Loading...") {
  const app = document.getElementById("app");
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");

  if (loadingEl) {
    const textEl = loadingEl.querySelector("p");
    if (textEl) textEl.textContent = message;
    loadingEl.style.display = "block";
  }
  if (app) app.style.display = "none";
  if (errorEl) errorEl.style.display = "none";
}

/**
 * Hide the loading indicator and show main content.
 */
export function hideLoading() {
  const app = document.getElementById("app");
  const loadingEl = document.getElementById("loading");
  if (loadingEl) loadingEl.style.display = "none";
  if (app) app.style.display = "block";
}

/**
 * Show an error message.
 * @param {string} message - Error message
 */
export function showError(message) {
  const app = document.getElementById("app");
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const errorMsgEl = document.getElementById("errorMessage");

  if (errorMsgEl) errorMsgEl.textContent = message;
  if (errorEl) errorEl.style.display = "block";
  if (app) app.style.display = "none";
  if (loadingEl) loadingEl.style.display = "none";
}

/**
 * Hide the error message and show main content.
 */
export function hideError() {
  const app = document.getElementById("app");
  const errorEl = document.getElementById("error");
  if (errorEl) errorEl.style.display = "none";
  if (app) app.style.display = "block";
}
