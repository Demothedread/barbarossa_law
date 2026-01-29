/**
 * Beach Boys Easter Egg Theme
 * Activated by clicking "showBeachBoysTheme" element
 * Auto-reverts when next element loads
 */

export class BeachBoysTheme {
  constructor() {
    this.isActive = false;
    this.originalStyles = null;
    this.themeElements = [];
    this.mutationObserver = null;
  }

  /**
   * Initialize the Beach Boys theme easter egg
   */
  init() {
    // Load the Beach Boys CSS
    this.loadBeachBoysCSS();

    // Set up click handlers for trigger elements
    this.setupTriggers();

    // Set up mutation observer to detect next element load
    this.setupMutationObserver();

    console.log("🏖️ Beach Boys Easter Egg initialized!");
  }

  /**
   * Load the Beach Boys theme CSS
   */
  loadBeachBoysCSS() {
    if (!document.getElementById("beach-boys-theme-css")) {
      const link = document.createElement("link");
      link.id = "beach-boys-theme-css";
      link.rel = "stylesheet";
      link.href = "css/beach-boys-theme.css";
      document.head.appendChild(link);
    }
  }

  /**
   * Set up click triggers for the easter egg
   */
  setupTriggers() {
    // Look for elements with specific IDs or classes
    const triggerSelectors = [
      "#showBeachBoysTheme",
      ".beach-boys-trigger",
      '[data-easter-egg="beach-boys"]',
    ];

    triggerSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.addEventListener("click", () => this.activate());
        el.style.cursor = "pointer";
      });
    });

    // Also allow activation via konami-style click pattern or keyboard
    this.setupSecretTrigger();
  }

  /**
   * Set up secret trigger (triple-click on header title)
   */
  setupSecretTrigger() {
    let clickCount = 0;
    let clickTimer = null;

    const headerTitle = document.querySelector(".lunaire-header__title");
    if (headerTitle) {
      headerTitle.addEventListener("click", () => {
        clickCount++;

        if (clickTimer) clearTimeout(clickTimer);

        if (clickCount >= 3) {
          this.activate();
          clickCount = 0;
        } else {
          clickTimer = setTimeout(() => {
            clickCount = 0;
          }, 500);
        }
      });
    }

    // Keyboard shortcut: Ctrl+Shift+B
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "B") {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Set up mutation observer to detect DOM changes
   */
  setupMutationObserver() {
    this.mutationObserver = new MutationObserver((mutations) => {
      if (!this.isActive) return;

      // Check if a significant element was added (like a new page/section)
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if this is a major page element
              const isMajorElement =
                node.classList?.contains("quiz") ||
                node.classList?.contains("homepage-container") ||
                node.classList?.contains("review-container") ||
                node.classList?.contains("statistics-container") ||
                node.id === "app" ||
                node.tagName === "SECTION";

              if (isMajorElement) {
                console.log(
                  "🏖️ New element detected, deactivating Beach Boys theme",
                );
                this.deactivate();
                return;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Toggle the theme
   */
  toggle() {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /**
   * Activate the Beach Boys theme
   */
  activate() {
    if (this.isActive) return;

    this.isActive = true;

    // Store original body classes
    this.originalStyles = document.body.className;

    // Add transition class
    document.body.classList.add("beach-boys-transition-in");

    // Add theme class
    document.body.classList.add("beach-boys-theme");

    // Create decorative elements
    this.createDecorativeElements();

    // Start observing DOM changes
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Play surf music jingle (optional)
    this.playSurfJingle();

    // Show activation message
    this.showActivationMessage();

    // Remove transition class after animation
    setTimeout(() => {
      document.body.classList.remove("beach-boys-transition-in");
    }, 800);

    console.log("🏖️🌊🎸 Beach Boys Theme ACTIVATED! Good vibrations! 🎸🌊🏖️");
  }

  /**
   * Deactivate the Beach Boys theme
   */
  deactivate() {
    if (!this.isActive) return;

    // Add transition out class
    document.body.classList.add("beach-boys-transition-out");

    setTimeout(() => {
      this.isActive = false;

      // Remove theme class
      document.body.classList.remove("beach-boys-theme");
      document.body.classList.remove("beach-boys-transition-out");

      // Remove decorative elements
      this.removeDecorativeElements();

      // Stop observing
      this.mutationObserver.disconnect();

      console.log("🏖️ Beach Boys Theme deactivated");
    }, 500);
  }

  /**
   * Create decorative beach elements
   */
  createDecorativeElements() {
    // Wave polygons container
    const waveContainer = document.createElement("div");
    waveContainer.className = "wave-polygons beach-boys-element";
    waveContainer.innerHTML = `
      <div class="wave-polygon wave-polygon-3"></div>
      <div class="wave-polygon wave-polygon-2"></div>
      <div class="wave-polygon wave-polygon-1"></div>
      <div class="wave-foam"></div>
    `;
    document.body.appendChild(waveContainer);
    this.themeElements.push(waveContainer);

    // Sun rays
    const sunRays = document.createElement("div");
    sunRays.className = "sun-rays beach-boys-element";
    sunRays.innerHTML = '<div class="sun-ray"></div>';
    document.body.appendChild(sunRays);
    this.themeElements.push(sunRays);

    // Palm tree
    const palmTree = document.createElement("div");
    palmTree.className = "palm-tree beach-boys-element";
    palmTree.innerHTML = `
      <div class="palm-frond" style="--base-rotation: -30deg;"></div>
      <div class="palm-frond" style="--base-rotation: 30deg;"></div>
      <div class="palm-frond" style="--base-rotation: -60deg;"></div>
      <div class="palm-frond" style="--base-rotation: 60deg;"></div>
      <div class="palm-trunk"></div>
    `;
    document.body.appendChild(palmTree);
    this.themeElements.push(palmTree);

    // Seagulls
    for (let i = 0; i < 3; i++) {
      const seagull = document.createElement("div");
      seagull.className = "seagull beach-boys-element";
      seagull.style.animationDelay = `${i * 5}s`;
      seagull.style.top = `${5 + i * 8}%`;
      document.body.appendChild(seagull);
      this.themeElements.push(seagull);
    }

    // Surfboard
    const surfboard = document.createElement("div");
    surfboard.className = "surfboard beach-boys-element";
    document.body.appendChild(surfboard);
    this.themeElements.push(surfboard);

    // Beach ball
    const beachBall = document.createElement("div");
    beachBall.className = "beach-ball beach-boys-element";
    document.body.appendChild(beachBall);
    this.themeElements.push(beachBall);
  }

  /**
   * Remove all decorative elements
   */
  removeDecorativeElements() {
    this.themeElements.forEach((el) => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    this.themeElements = [];
  }

  /**
   * Play a brief surf music jingle
   */
  playSurfJingle() {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Create a simple surf guitar-like sound
      const notes = [
        { freq: 329.63, time: 0 }, // E4
        { freq: 392.0, time: 0.15 }, // G4
        { freq: 440.0, time: 0.3 }, // A4
        { freq: 493.88, time: 0.45 }, // B4
        { freq: 440.0, time: 0.6 }, // A4
        { freq: 392.0, time: 0.75 }, // G4
      ];

      notes.forEach((note) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = "triangle";
        osc.frequency.setValueAtTime(
          note.freq,
          audioContext.currentTime + note.time,
        );

        gain.gain.setValueAtTime(0, audioContext.currentTime + note.time);
        gain.gain.linearRampToValueAtTime(
          0.2,
          audioContext.currentTime + note.time + 0.05,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + note.time + 0.15,
        );

        osc.start(audioContext.currentTime + note.time);
        osc.stop(audioContext.currentTime + note.time + 0.2);
      });
    } catch (error) {
      console.log("Could not play surf jingle:", error);
    }
  }

  /**
   * Show activation message
   */
  showActivationMessage() {
    const message = document.createElement("div");
    message.className = "beach-boys-activation-message";
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
      color: #1e6091;
      padding: 2rem 3rem;
      border-radius: 20px;
      font-family: "zeplin-vf", "strenuous-3d", sans-serif;
      font-size: 2rem;
      font-weight: bold;
      text-align: center;
      z-index: 10000;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      animation: beachMessageIn 0.5s ease-out, beachMessageOut 0.5s ease-in 2s forwards;
    `;
    message.innerHTML = `
      🏖️ Good Vibrations! 🌊<br>
      <span style="font-size: 1rem; font-family: 'please-display', sans-serif;">
        Beach Boys Mode Activated
      </span>
    `;

    // Add keyframes
    const style = document.createElement("style");
    style.textContent = `
      @keyframes beachMessageIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      @keyframes beachMessageOut {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(message);

    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 2500);
  }
}

// Create singleton instance
export const beachBoysTheme = new BeachBoysTheme();

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => beachBoysTheme.init());
} else {
  beachBoysTheme.init();
}

// Export activation function for external use
export function showBeachBoysTheme() {
  beachBoysTheme.activate();
}

export function hideBeachBoysTheme() {
  beachBoysTheme.deactivate();
}
