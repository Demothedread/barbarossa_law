/**
 * Theme Manager for Dorothy Draper Design System
 * Handles theme switching, localStorage persistence, and audio integration
 */

class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('lawquizzer-theme') || 'barbarossa';
    this.audioManager = null;
    this.themes = {
      barbarossa: {
        name: 'Barbarossa',
        description: 'Atomic-age space pirate styling',
        icon: '☠️'
      },
      classic: {
        name: 'Classic',
        description: 'Dorothy Draper maximalist style with bright pastels',
        icon: '🎭'
      },
      'quiz-show': {
        name: 'Quiz Show',
        description: '1970s game show aesthetic with gold and orange',
        icon: '📺'
      },
      friendly: {
        name: 'Friendly',
        description: 'Baseball-themed with field green and team colors',
        icon: '⚾'
      }
    };
    this.init();
  }

  init() {
    // Only create selector if not present
    if (!document.querySelector('.theme-selector')) {
      this.createThemeSelector();
    }
    this.applyTheme(this.currentTheme);
    this.bindEvents();
    this.initAudioManager();
  }

  createThemeSelector() {
    // Check if theme selector already exists
    if (document.querySelector('.theme-selector')) return;

    // Create theme selector HTML
    const themeSelector = document.createElement('div');
    themeSelector.className = 'theme-selector';
    themeSelector.innerHTML = `
      <div class="theme-selector-label">Theme:</div>
      ${Object.entries(this.themes).map(([key, theme]) => `
        <button class="theme-btn" data-theme="${key}" title="${theme.description}">
          <span class="theme-icon">${theme.icon}</span>
          <span class="theme-name">${theme.name}</span>
        </button>
      `).join('')}
    `;

    // Add to navigation
    const nav = document.querySelector('.nav-centered');
    if (nav) {
      nav.appendChild(themeSelector);
    } else {
      // Fallback: add to header
      const header = document.querySelector('.header-content-compact');
      if (header) header.appendChild(themeSelector);
    }
  }

  // Create theme selector for integrated navigation structure
  createThemeSelectorIntegrated(container) {
    if (!container) return;

    // Remove any existing theme selector in this container
    const existing = container.querySelector('.theme-selector');
    if (existing) {
      existing.remove();
    }

    // Create theme selector HTML for integrated layout
    const themeSelector = document.createElement('div');
    themeSelector.className = 'theme-selector';
    themeSelector.innerHTML = `
      ${Object.entries(this.themes).map(([key, theme]) => `
        <button class="theme-btn" data-theme="${key}" title="${theme.description}">
          <span class="theme-icon">${theme.icon}</span>
        </button>
      `).join('')}
    `;

    container.appendChild(themeSelector);

    // Update active theme button
    this.updateActiveThemeButton();
  }

  // Create mobile theme selector
  createMobileThemeSelector(container) {
    if (!container) return;

    // Remove any existing theme selector in this container
    const existing = container.querySelector('.mobile-theme-selector');
    if (existing) {
      existing.remove();
    }

    // Create mobile theme selector HTML
    const mobileThemeSelector = document.createElement('div');
    mobileThemeSelector.className = 'mobile-theme-selector';
    mobileThemeSelector.innerHTML = `
      ${Object.entries(this.themes).map(([key, theme]) => `
        <button class="mobile-theme-btn" data-theme="${key}" title="${theme.description}">
          <span class="theme-icon">${theme.icon}</span>
          <span class="theme-name">${theme.name}</span>
        </button>
      `).join('')}
    `;

    container.appendChild(mobileThemeSelector);

    // Add event listeners for mobile theme buttons
    mobileThemeSelector.querySelectorAll('.mobile-theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.applyTheme(btn.dataset.theme);
        this.addClickEffect(e);
      });
    });

    // Update active theme button
    this.updateMobileActiveThemeButton();
  }

  // Update active theme button states
  updateActiveThemeButton() {
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === this.currentTheme);
    });
  }

  // Update mobile active theme button states
  updateMobileActiveThemeButton() {
    document.querySelectorAll('.mobile-theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === this.currentTheme);
    });
  }

  applyTheme(themeName) {
    if (!this.themes[themeName]) {
      console.warn(`Theme "${themeName}" not found, falling back to classic`);
      themeName = 'classic';
    }
    document.documentElement.setAttribute('data-theme', themeName);
    this.currentTheme = themeName;
    localStorage.setItem('lawquizzer-theme', themeName);
    this.updateActiveThemeButton();
    this.updateMobileActiveThemeButton();

    // Remove only theme-* classes from body, preserve others
    // Use Array.from to avoid mutation during iteration
    Array.from(document.body.classList).forEach(cls => {
      if (/^theme-\w+/.test(cls)) {
        document.body.classList.remove(cls);
      }
    });
    document.body.classList.add(`theme-${themeName}`);

    this.playThemeTransitionSound(themeName);

    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { 
        theme: themeName, 
        themeData: this.themes[themeName] 
      } 
    }));
  }

  bindEvents() {
    // Theme button clicks
    document.addEventListener('click', (event) => {
      const themeBtn = event.target.closest('.theme-btn');
      if (themeBtn) {
        event.preventDefault();
        this.applyTheme(themeBtn.dataset.theme);
        // Only add click effect if event has coordinates (i.e., mouse event)
        if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
          this.addClickEffect(event);
        }
      }
    });

    // Keyboard support
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            this.applyTheme('classic');
            break;
          case '2':
            event.preventDefault();
            this.applyTheme('quiz-show');
            break;
          case '3':
            event.preventDefault();
            this.applyTheme('friendly');
            break;
          case '4':
            event.preventDefault();
            this.applyTheme('barbarossa');
            break;
        }
      }
    });
  }

  initAudioManager() {
    this.audioManager = new ThemeAudioManager(this.currentTheme);
    
    // Listen for theme changes
    window.addEventListener('themeChanged', (event) => {
      this.audioManager.updateTheme(event.detail.theme);
    });
  }

  playThemeTransitionSound(_theme) {
    if (this.audioManager) {
      this.audioManager.playSound('transition', 0.3);
    }
  }

  addClickEffect(event) {
    if (typeof event.clientX !== 'number' || typeof event.clientY !== 'number') return;
    if (window.effectsManager) return;
    const explosion = document.createElement('div');
    explosion.className = 'click-explosion';
    explosion.style.position = 'fixed';
    explosion.style.left = event.clientX + 'px';
    explosion.style.top = event.clientY + 'px';
    explosion.style.pointerEvents = 'none';
    explosion.style.zIndex = '9999';
    document.body.appendChild(explosion);
    setTimeout(() => explosion.remove(), 600);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getThemeData(themeName = null) {
    const theme = themeName || this.currentTheme;
    return this.themes[theme];
  }

  // Method to programmatically change theme (for other components)
  setTheme(themeName) {
    this.applyTheme(themeName);
  }
}

/**
 * Theme-specific Audio Manager
 */
class ThemeAudioManager {
  constructor(theme) {
    this.theme = theme;
    this.sounds = {};
    this.audioEnabled = true;
    this.loadThemeSounds(theme);
  }

  // Try loading both .wav and .mp3, use first that loads
  loadThemeSounds(theme) {
    const audioTheme = theme === 'barbarossa' ? 'classic' : theme;
    const basePath = `src/assets/audio/theme/${audioTheme}/`;
    const soundTypes = ['intro', 'click', 'correct', 'wrong', 'timer', 'transition'];
    const extensions = ['wav', 'mp3'];
    this.sounds = {};

    soundTypes.forEach(soundType => {
      let loaded = false;
      for (const ext of extensions) {
        if (loaded) break;
        try {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.src = `${basePath}${soundType}.${ext}`;
          // Only set if file loads successfully
          audio.addEventListener('canplaythrough', () => {
            if (!this.sounds[soundType]) {
              this.sounds[soundType] = audio;
              loaded = true;
            }
          }, { once: true });
          audio.addEventListener('error', () => {}, { once: true });
          audio.load();
          // Fallback: if canplaythrough doesn't fire, set after short delay
          setTimeout(() => {
            if (!this.sounds[soundType] && audio.readyState > 0) {
              this.sounds[soundType] = audio;
              loaded = true;
            }
          }, 400); // Slightly shorter fallback for snappier UX
        } catch (error) {
          // Ignore and try next extension
        }
      }
    });
  }

  playSound(soundType, volume = 0.5) {
    if (!this.audioEnabled || !this.sounds[soundType]) return;
    try {
      const audio = this.sounds[soundType];
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Only log if not user gesture
          if (error.name !== 'NotAllowedError') {
            console.log('Audio play failed:', error);
          }
        });
      }
    } catch (error) {
      console.log(`Failed to play ${soundType} sound:`, error);
    }
  }

  // Call this to play the intro sound when starting a quiz
  playIntro(volume = 0.5) {
    this.playSound('intro', volume);
  }

  updateTheme(newTheme) {
    this.theme = newTheme;
    this.loadThemeSounds(newTheme);
  }

  setAudioEnabled(enabled) {
    this.audioEnabled = enabled;
  }

  isAudioEnabled() {
    return this.audioEnabled;
  }
}

/**
 * Visual Effects Manager for Early-2000s Kitschy Effects
 */
class EffectsManager {
  constructor() {
    this.bindEffects();
  }

  bindEffects() {
    // Add click explosions to interactive elements
    document.addEventListener('click', this.createClickExplosion.bind(this));
    
    // Add sparkles to successful actions
    document.addEventListener('click', (event) => {
      const btn = event.target.closest('.btn-primary');
      if (btn) this.createSparkles(btn);
    });
  }

  createClickExplosion(event) {
    // Only create explosions for interactive elements
    const interactive = event.target.closest('button, .choice-item, .nav-btn, .theme-btn');
    if (!interactive) return;
    // Prevent duplicate explosion if already handled by ThemeManager
    if (event.defaultPrevented) return;
    const explosion = document.createElement('div');
    explosion.className = 'click-explosion';
    explosion.style.position = 'fixed';
    explosion.style.left = (event.clientX - 10) + 'px';
    explosion.style.top = (event.clientY - 10) + 'px';
    explosion.style.pointerEvents = 'none';
    explosion.style.zIndex = '9999';
    
    document.body.appendChild(explosion);
    
    setTimeout(() => explosion.remove(), 600);
  }

  createSparkles(element) {
    const container = element.closest('.sparkle-container') || element;
    const rect = container.getBoundingClientRect();
    // Only set position if not already set by CSS
    const computedStyle = window.getComputedStyle(container);
    if (!['relative', 'absolute', 'fixed'].includes(computedStyle.position)) {
      container.style.position = 'relative';
    }
    const SPARKLE_COUNT = 5;
    const SPARKLE_LIFETIME = 1500;
    const SPARKLE_INTERVAL = 100;

    for (let i = 0; i < SPARKLE_COUNT; i++) {
      setTimeout(() => {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.position = 'absolute';
        sparkle.style.left = (Math.random() * rect.width) + 'px';
        sparkle.style.top = (Math.random() * rect.height) + 'px';
        sparkle.style.animationDelay = (Math.random() * 1) + 's';
        sparkle.style.pointerEvents = 'none';

        container.appendChild(sparkle);

        // Remove sparkle after animation duration
        setTimeout(() => {
          if (sparkle.parentNode) {
            sparkle.remove();
          }
        }, SPARKLE_LIFETIME);
      }, i * SPARKLE_INTERVAL);
    }
  }

  addGelOverlay(element) {
    if (!element.classList.contains('gel-overlay')) {
      element.classList.add('gel-overlay');
    }
  }

  addRetroIcon(element) {
    if (!element.classList.contains('retro-icon')) {
      element.classList.add('retro-icon');
    }
  }
}

// Initialize theme system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
  window.effectsManager = new EffectsManager();
});

// Export for module systems
export { EffectsManager, ThemeAudioManager, ThemeManager };
