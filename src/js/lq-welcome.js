/**
 * Welcome Screen Manager for Law Quizzer
 * Provides an artistic introduction with Dorothy Draper styling and audio integration
 */

class WelcomeScreen {
  constructor() {
    this.audioManager = null;
    this.introAudio = null;
    this.isAudioEnabled = localStorage.getItem('welcomeAudioEnabled') !== 'false';
    this.hasShownWelcome = localStorage.getItem('hasShownWelcome') === 'true';
    this.onComplete = null;
    this.animationDuration = 4000; // 4 seconds for intro animation
    this.audioLoadTimeout = 3000; // 3 seconds max to load audio
  }

  /**
   * Initialize the welcome screen
   * @param {Function} onComplete - Callback when welcome is complete
   */
  init(onComplete) {
    this.onComplete = onComplete;
    
    // Check if user has chosen to skip welcome screen
    if (this.hasShownWelcome && !this.shouldForceShow()) {
      this.onComplete && this.onComplete();
      return;
    }

    this.createWelcomeHTML();
    this.initAudio();
    this.startIntroSequence();
  }

  /**
   * Check if welcome should be forced (e.g., first visit, special events)
   */
  shouldForceShow() {
    // Force show on first visit or if no user preference exists
    return !localStorage.getItem('welcomePreference');
  }

  /**
   * Create the welcome screen HTML structure
   */
  createWelcomeHTML() {
    const welcomeContainer = document.createElement('div');
    welcomeContainer.id = 'welcomeScreen';
    welcomeContainer.className = 'welcome-screen';
    
    welcomeContainer.innerHTML = `
      <div class="welcome-overlay"></div>
      <div class="welcome-content">
        <div class="welcome-logo-area">
          <div class="welcome-patterns"></div>
          <h1 class="welcome-title">
            <span class="welcome-title-line">HICK'S</span>
            <span class="welcome-title-line">LAW QUIZZER</span>
          </h1>
          <div class="welcome-subtitle">
            An Artistic Journey Through Legal Knowledge
          </div>
          <div class="welcome-artist-credit">
            Inspired by Dorothy Draper's Maximalist Vision
          </div>
        </div>
        
        <div class="welcome-loading-area">
          <div class="welcome-spinner">
            <div class="spinner-gel-overlay"></div>
            <div class="spinner-patterns"></div>
          </div>
          <div class="welcome-loading-text">
            Preparing your artistic experience...
          </div>
        </div>
        
        <div class="welcome-controls">
          <button id="welcomeSkip" class="welcome-btn welcome-btn-skip">
            Skip Introduction
          </button>
          <button id="welcomeAudioToggle" class="welcome-btn welcome-btn-audio">
            ${this.isAudioEnabled ? '🔊 Audio On' : '🔇 Audio Off'}
          </button>
        </div>
        
        <div class="welcome-footer">
          <label class="welcome-checkbox">
            <input type="checkbox" id="welcomeDontShow" />
            Don't show this again
          </label>
        </div>
      </div>
      
      <!-- Floating decorative elements -->
      <div class="welcome-floating-elements">
        <div class="floating-pattern floating-pattern-1"></div>
        <div class="floating-pattern floating-pattern-2"></div>
        <div class="floating-pattern floating-pattern-3"></div>
        <div class="floating-gel floating-gel-1"></div>
        <div class="floating-gel floating-gel-2"></div>
      </div>
    `;

    // Hide existing content
    const app = document.getElementById('app');
    const header = document.querySelector('header');
    if (app) app.style.display = 'none';
    if (header) header.style.display = 'none';

    document.body.appendChild(welcomeContainer);
    this.bindEvents();
  }

  /**
   * Initialize audio system
   */
  initAudio() {
    if (!this.isAudioEnabled) return;

    try {
      // Try to load the intro audio
      this.introAudio = new Audio('assets/audio/music/intro_buildup.mp3');
      this.introAudio.volume = 0.6;
      this.introAudio.loop = false;
      
      // Preload with timeout
      const loadPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Audio load timeout'));
        }, this.audioLoadTimeout);

        this.introAudio.addEventListener('canplaythrough', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });

        this.introAudio.addEventListener('error', () => {
          clearTimeout(timeout);
          reject(new Error('Audio load failed'));
        }, { once: true });

        this.introAudio.load();
      });

      loadPromise.catch(() => {
        console.log('Welcome audio failed to load, continuing without audio');
        this.introAudio = null;
      });

    } catch (error) {
      console.log('Audio initialization failed:', error);
      this.introAudio = null;
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const skipBtn = document.getElementById('welcomeSkip');
    const audioToggle = document.getElementById('welcomeAudioToggle');
    const dontShowCheckbox = document.getElementById('welcomeDontShow');

    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipWelcome());
    }

    if (audioToggle) {
      audioToggle.addEventListener('click', () => this.toggleAudio());
    }

    if (dontShowCheckbox) {
      dontShowCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          localStorage.setItem('welcomePreference', 'skip');
        } else {
          localStorage.removeItem('welcomePreference');
        }
      });
    }

    // Allow escape key to skip
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.skipWelcome();
      }
    });
  }

  /**
   * Start the intro sequence
   */
  async startIntroSequence() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (!welcomeScreen) return;

    // Add intro class to start animations
    welcomeScreen.classList.add('welcome-intro-active');

    // Start audio if available
    if (this.introAudio && this.isAudioEnabled) {
      try {
        // Modern browsers require user interaction for audio
        await this.introAudio.play();
      } catch (error) {
        console.log('Audio autoplay blocked, will play on user interaction');
      }
    }

    // Auto-complete after animation duration
    setTimeout(() => {
      if (document.getElementById('welcomeScreen')) {
        this.completeWelcome();
      }
    }, this.animationDuration);
  }

  /**
   * Toggle audio on/off
   */
  toggleAudio() {
    this.isAudioEnabled = !this.isAudioEnabled;
    localStorage.setItem('welcomeAudioEnabled', this.isAudioEnabled.toString());

    const audioToggle = document.getElementById('welcomeAudioToggle');
    if (audioToggle) {
      audioToggle.textContent = this.isAudioEnabled ? '🔊 Audio On' : '🔇 Audio Off';
    }

    if (this.isAudioEnabled) {
      // Try to start audio if it wasn't playing
      if (this.introAudio && this.introAudio.paused) {
        this.introAudio.play().catch(() => {
          console.log('Audio play failed');
        });
      }
    } else {
      // Stop audio
      if (this.introAudio && !this.introAudio.paused) {
        this.introAudio.pause();
      }
    }
  }

  /**
   * Skip the welcome screen immediately
   */
  skipWelcome() {
    this.stopAudio();
    this.completeWelcome();
  }

  /**
   * Stop any playing audio
   */
  stopAudio() {
    if (this.introAudio && !this.introAudio.paused) {
      this.introAudio.pause();
      this.introAudio.currentTime = 0;
    }
  }

  /**
   * Complete the welcome sequence and transition to main app
   */
  completeWelcome() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    
    if (welcomeScreen) {
      // Add exit animation
      welcomeScreen.classList.add('welcome-exit');
      
      // Clean up after animation
      setTimeout(() => {
        this.cleanup();
        this.transitionToMainApp();
      }, 500);
    } else {
      this.transitionToMainApp();
    }
  }

  /**
   * Clean up welcome screen elements
   */
  cleanup() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
      welcomeScreen.remove();
    }

    this.stopAudio();
    
    // Mark as shown
    localStorage.setItem('hasShownWelcome', 'true');
    
    // Remove event listeners
    document.removeEventListener('keydown', this.handleEscape);
  }

  /**
   * Transition to the main application
   */
  transitionToMainApp() {
    // Show hidden elements
    const app = document.getElementById('app');
    const header = document.querySelector('header');
    
    if (app) app.style.display = '';
    if (header) header.style.display = '';

    // Call completion callback
    if (this.onComplete) {
      this.onComplete();
    }
  }

  /**
   * Reset welcome screen preferences (for testing/admin)
   */
/**
   * Reset welcome screen preferences (for testing/admin)
   */
  static resetPreferences() {
    localStorage.removeItem('hasShownWelcome');
    localStorage.removeItem('welcomePreference');
    localStorage.removeItem('welcomeAudioEnabled');
  }
}

/**
 * Create and initialize welcome screen
 * @param {Function} onComplete - Callback when welcome is complete
 */
export function createWelcomeScreen(onComplete) {
  const welcomeScreen = new WelcomeScreen();
  welcomeScreen.init(onComplete);
  return welcomeScreen;
}

/**
 * Utility function to check if welcome should be shown
 */
export function shouldShowWelcome() {
  const hasShown = localStorage.getItem('hasShownWelcome') === 'true';
  const userPreference = localStorage.getItem('welcomePreference');
  return !hasShown || userPreference !== 'skip';
}

export { WelcomeScreen };
/**
 * Force show welcome screen (useful for testing)
 */
export function forceShowWelcome() {
  WelcomeScreen.resetPreferences();
  return shouldShowWelcome();
}