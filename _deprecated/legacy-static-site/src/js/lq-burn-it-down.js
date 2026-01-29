import { getIconString } from "./lunaire-icons.js";

/**
 * Inferno overlay module to "burn down" the UI.
 * @returns {HTMLElement}
 */
export function createBurnItDownSection() {
  const section = document.createElement("section");
  section.className = "burn-it-down-section module-frame-alt";
  section.id = "burn-it-down";

  section.innerHTML = `
    <div class="burn-it-down-header">
      <h2>${getIconString("warning", 32)} Burn It Down</h2>
      <p>
        Need to blow off steam? Light the deck on fire, watch the flames roll in,
        then reset when you are ready to study again.
      </p>
    </div>
    <div class="burn-it-down-actions">
      <button class="btn-primary" data-action="ignite">Ignite the Inferno</button>
      <button class="btn-secondary" data-action="reset">Reset the Deck</button>
    </div>
  `;

  ensureInfernoOverlay();

  // Create a live region for screen reader announcements
  const announcer = document.createElement("div");
  announcer.className = "sr-only";
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");
  section.appendChild(announcer);

  section.addEventListener("click", (event) => {
    const action = event.target?.dataset?.action;
    if (action === "ignite") {
      document.body.classList.add("inferno-mode");
      announcer.textContent =
        "Inferno effect activated. The screen is now on fire.";
    }
    if (action === "reset") {
      document.body.classList.remove("inferno-mode");
      announcer.textContent =
        "Inferno effect cleared. The screen has been reset.";
    }
  });

  return section;
}

function ensureInfernoOverlay() {
  if (document.querySelector(".inferno-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "inferno-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="inferno-core">
      <p>${getIconString(
        "warning",
        48,
      )} Everything is on fire. Barbarossa is laughing.</p>
    </div>
  `;

  document.body.appendChild(overlay);
}
