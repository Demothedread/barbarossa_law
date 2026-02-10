/**
 * Beach Boys Theme Composable
 * Provides a Vue-native way to toggle the Beach Boys easter egg theme
 */

const beachBoysActive = ref(false);
const themeElements: HTMLElement[] = [];

export const useBeachBoysTheme = () => {
  /**
   * Load Beach Boys CSS if not already present
   */
  const loadCSS = () => {
    if (
      import.meta.client &&
      !document.getElementById("beach-boys-theme-css")
    ) {
      const link = document.createElement("link");
      link.id = "beach-boys-theme-css";
      link.rel = "stylesheet";
      link.href = "/css/beach-boys-theme.css";
      document.head.appendChild(link);
    }
  };

  /**
   * Create decorative beach elements
   */
  const createDecorativeElements = () => {
    if (!import.meta.client) return;

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
    themeElements.push(waveContainer);

    // Sun rays
    const sunRays = document.createElement("div");
    sunRays.className = "sun-rays beach-boys-element";
    sunRays.innerHTML = '<div class="sun-ray"></div>';
    document.body.appendChild(sunRays);
    themeElements.push(sunRays);

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
    themeElements.push(palmTree);

    // Seagulls
    for (let i = 0; i < 3; i++) {
      const seagull = document.createElement("div");
      seagull.className = "seagull beach-boys-element";
      seagull.style.animationDelay = `${i * 5}s`;
      seagull.style.top = `${5 + i * 8}%`;
      document.body.appendChild(seagull);
      themeElements.push(seagull);
    }

    // Surfboard
    const surfboard = document.createElement("div");
    surfboard.className = "surfboard beach-boys-element";
    document.body.appendChild(surfboard);
    themeElements.push(surfboard);

    // Beach ball
    const beachBall = document.createElement("div");
    beachBall.className = "beach-ball beach-boys-element";
    document.body.appendChild(beachBall);
    themeElements.push(beachBall);
  };

  /**
   * Remove decorative elements
   */
  const removeDecorativeElements = () => {
    themeElements.forEach((el) => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    themeElements.length = 0;
  };

  /**
   * Play surf music jingle
   */
  const playSurfJingle = () => {
    if (!import.meta.client) return;

    try {
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();

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
    } catch {
      // Could not play surf jingle - audio may not be available
    }
  };

  /**
   * Show activation message
   */
  const showActivationMessage = () => {
    if (!import.meta.client) return;

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
      if (message.parentNode) message.parentNode.removeChild(message);
      if (style.parentNode) style.parentNode.removeChild(style);
    }, 2500);
  };

  /**
   * Activate the Beach Boys theme
   */
  const activate = () => {
    if (!import.meta.client || beachBoysActive.value) return;

    loadCSS();
    beachBoysActive.value = true;

    // Add transition and theme classes
    document.body.classList.add("beach-boys-transition-in");
    document.body.classList.add("beach-boys-theme");

    createDecorativeElements();
    playSurfJingle();
    showActivationMessage();

    // Remove transition class after animation
    setTimeout(() => {
      document.body.classList.remove("beach-boys-transition-in");
    }, 800);
  };

  /**
   * Deactivate the Beach Boys theme
   */
  const deactivate = () => {
    if (!import.meta.client || !beachBoysActive.value) return;

    document.body.classList.add("beach-boys-transition-out");

    setTimeout(() => {
      beachBoysActive.value = false;
      document.body.classList.remove("beach-boys-theme");
      document.body.classList.remove("beach-boys-transition-out");
      removeDecorativeElements();
    }, 500);
  };

  /**
   * Toggle the theme
   */
  const toggle = () => {
    if (beachBoysActive.value) {
      deactivate();
    } else {
      activate();
    }
  };

  return {
    isActive: computed(() => beachBoysActive.value),
    activate,
    deactivate,
    toggle,
  };
};
