/**
 * Homepage Utilities for Law Quizzer
 * Performance optimizations and helper functions for the homepage
 */

/**
 * Lazy load manager for homepage sections
 */
export class LazyLoadManager {
  constructor() {
    this.observers = new Map();
    this.loadedSections = new Set();
  }

  /**
   * Initialize intersection observer for lazy loading
   */
  init() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadSection(entry.target);
          }
        });
      }, {
        rootMargin: '100px',
        threshold: 0.1
      });

      this.observers.set('main', observer);
    }
  }

  /**
   * Observe a section for lazy loading
   */
  observe(element, sectionId) {
    if (this.observers.has('main')) {
      element.dataset.sectionId = sectionId;
      this.observers.get('main').observe(element);
    }
  }

  /**
   * Load section data when it becomes visible
   */
  async loadSection(element) {
    const sectionId = element.dataset.sectionId;
    
    if (this.loadedSections.has(sectionId)) {
      return;
    }

    this.loadedSections.add(sectionId);
    
    try {
      switch (sectionId) {
        case 'statistics-hero':
          await this.loadStatisticsData(element);
          break;
        case 'recent-activity':
          await this.loadActivityData(element);
          break;
        case 'study-recommendations':
          await this.loadRecommendationsData(element);
          break;
      }
    } catch (error) {
      console.error(`Failed to load section ${sectionId}:`, error);
    }
  }

  /**
   * Load statistics data
   */
  async loadStatisticsData(element) {
    const statsWidget = element.querySelector('.enhanced-stats-widget');
    if (statsWidget && !statsWidget.dataset.loaded) {
      // Add loading indicator
      const loader = document.createElement('div');
      loader.className = 'section-loader';
      loader.innerHTML = '<div class="loader-spinner"></div><p>Loading statistics...</p>';
      statsWidget.appendChild(loader);

      // Simulate data loading with timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove loader
      loader.remove();
      statsWidget.dataset.loaded = 'true';
    }
  }

  /**
   * Load activity data
   */
  async loadActivityData(element) {
    const activityContent = element.querySelector('.activity-content');
    if (activityContent && !activityContent.dataset.loaded) {
      // Add shimmer effect while loading
      activityContent.classList.add('loading-shimmer');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      activityContent.classList.remove('loading-shimmer');
      activityContent.dataset.loaded = 'true';
    }
  }

  /**
   * Load recommendations data
   */
  async loadRecommendationsData(element) {
    const recommendationsContent = element.querySelector('.recommendations-content');
    if (recommendationsContent && !recommendationsContent.dataset.loaded) {
      // Add subtle loading animation
      recommendationsContent.style.opacity = '0.6';
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      recommendationsContent.style.opacity = '1';
      recommendationsContent.dataset.loaded = 'true';
    }
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.loadedSections.clear();
  }
}

/**
 * Performance monitor for homepage
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0
    };
    this.startTime = performance.now();
  }

  /**
   * Mark homepage load complete
   */
  markLoadComplete() {
    this.metrics.loadTime = performance.now() - this.startTime;
    console.log(`Homepage load time: ${this.metrics.loadTime.toFixed(2)}ms`);
  }

  /**
   * Mark render complete
   */
  markRenderComplete() {
    this.metrics.renderTime = performance.now() - this.startTime;
    console.log(`Homepage render time: ${this.metrics.renderTime.toFixed(2)}ms`);
  }

  /**
   * Mark first interaction
   */
  markFirstInteraction() {
    if (this.metrics.interactionTime === 0) {
      this.metrics.interactionTime = performance.now() - this.startTime;
      console.log(`Time to first interaction: ${this.metrics.interactionTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
}

/**
 * Theme performance optimizer
 */
export class ThemeOptimizer {
  constructor() {
    this.themeCache = new Map();
    this.transitionQueue = [];
    this.isTransitioning = false;
  }

  /**
   * Optimize theme switching
   */
  async switchTheme(themeName, elements) {
    if (this.isTransitioning) {
      this.transitionQueue.push({ themeName, elements });
      return;
    }

    this.isTransitioning = true;

    try {
      // Pre-cache theme styles if not already cached
      if (!this.themeCache.has(themeName)) {
        await this.cacheThemeStyles(themeName);
      }

      // Apply theme with optimized transitions
      await this.applyThemeOptimized(themeName, elements);
    } finally {
      this.isTransitioning = false;
      
      // Process queued transitions
      if (this.transitionQueue.length > 0) {
        const next = this.transitionQueue.shift();
        this.switchTheme(next.themeName, next.elements);
      }
    }
  }

  /**
   * Cache theme styles for faster switching
   */
  async cacheThemeStyles(themeName) {
    const themeStyles = {
      variables: this.extractThemeVariables(themeName),
      animations: this.getThemeAnimations(themeName)
    };
    
    this.themeCache.set(themeName, themeStyles);
  }

  /**
   * Extract theme CSS variables
   */
  extractThemeVariables(themeName) {
    const themeVars = {};
    const computedStyle = getComputedStyle(document.documentElement);
    
    // Get theme-specific variables
    const themeVarNames = [
      '--theme-primary',
      '--theme-secondary',
      '--theme-accent',
      '--theme-bg-primary',
      '--theme-bg-secondary',
      '--theme-text-primary',
      '--theme-text-secondary'
    ];
    
    themeVarNames.forEach(varName => {
      themeVars[varName] = computedStyle.getPropertyValue(varName);
    });
    
    return themeVars;
  }

  /**
   * Get theme-specific animations
   */
  getThemeAnimations(themeName) {
    const animations = {
      'classic': ['sparkle', 'slideInUp'],
      'quiz-show': ['neonFlicker', 'gameShowSpin'],
      'friendly': ['bounce', 'teamCheer']
    };
    
    return animations[themeName] || [];
  }

  /**
   * Apply theme with optimizations
   */
  async applyThemeOptimized(themeName, elements) {
    // Use requestAnimationFrame for smoother transitions
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        // Batch DOM updates
        document.documentElement.setAttribute('data-theme', themeName);
        
        if (elements) {
          elements.forEach(element => {
            element.classList.add(`theme-${themeName}`);
          });
        }
        
        // Trigger repaint
        document.documentElement.offsetHeight;
        
        resolve();
      });
    });
  }
}

/**
 * Data cache manager for homepage
 */
export class DataCacheManager {
  constructor() {
    this.cache = new Map();
    this.expiry = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Set cached data with TTL
   */
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, data);
    this.expiry.set(key, Date.now() + ttl);
  }

  /**
   * Get cached data if not expired
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const expireTime = this.expiry.get(key);
    if (expireTime && Date.now() > expireTime) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Delete cached data
   */
  delete(key) {
    this.cache.delete(key);
    this.expiry.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear() {
    this.cache.clear();
    this.expiry.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Responsive layout manager
 */
export class ResponsiveLayoutManager {
  constructor() {
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    };
    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.listeners = [];
  }

  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    
    if (width < this.breakpoints.mobile) {
      return 'mobile';
    } else if (width < this.breakpoints.tablet) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Add breakpoint change listener
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove breakpoint change listener
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Initialize responsive behavior
   */
  init() {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.handleResize(); // Initial check
  }

  /**
   * Handle resize events
   */
  handleResize() {
    const newBreakpoint = this.getCurrentBreakpoint();
    
    if (newBreakpoint !== this.currentBreakpoint) {
      const oldBreakpoint = this.currentBreakpoint;
      this.currentBreakpoint = newBreakpoint;
      
      // Notify listeners
      this.listeners.forEach(callback => {
        callback(newBreakpoint, oldBreakpoint);
      });
      
      // Update layout
      this.updateLayout(newBreakpoint);
    }
  }

  /**
   * Update layout for breakpoint
   */
  updateLayout(breakpoint) {
    document.body.classList.remove('layout-mobile', 'layout-tablet', 'layout-desktop');
    document.body.classList.add(`layout-${breakpoint}`);
    
    // Trigger custom event
    window.dispatchEvent(new CustomEvent('breakpointChange', {
      detail: { 
        breakpoint, 
        width: window.innerWidth 
      }
    }));
  }

  /**
   * Cleanup
   */
  cleanup() {
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.listeners = [];
  }
}

/**
 * Accessibility manager for homepage
 */
export class AccessibilityManager {
  constructor() {
    this.focusableElements = [
      'button',
      'a[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])'
    ];
  }

  /**
   * Initialize accessibility features
   */
  init() {
    this.setupKeyboardNavigation();
    this.setupAriaLabels();
    this.setupFocusManagement();
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // ESC key to close modals
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="block"]');
        if (openModal) {
          openModal.style.display = 'none';
        }
      }
      
      // Arrow keys for section navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        this.navigateSections(e.key === 'ArrowDown');
      }
    });
  }

  /**
   * Navigate between sections with keyboard
   */
  navigateSections(isDown) {
    const sections = document.querySelectorAll('.homepage-container section');
    const currentFocus = document.activeElement;
    
    let currentIndex = -1;
    sections.forEach((section, index) => {
      if (section.contains(currentFocus)) {
        currentIndex = index;
      }
    });
    
    let nextIndex;
    if (isDown) {
      nextIndex = (currentIndex + 1) % sections.length;
    } else {
      nextIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
    }
    
    const nextSection = sections[nextIndex];
    const focusableElement = nextSection.querySelector(this.focusableElements.join(','));
    if (focusableElement) {
      focusableElement.focus();
    }
  }

  /**
   * Setup ARIA labels
   */
  setupAriaLabels() {
    // Add aria-labels to sections
    const sections = document.querySelectorAll('.homepage-container section');
    sections.forEach((section, index) => {
      if (!section.getAttribute('aria-label')) {
        const heading = section.querySelector('h2');
        if (heading) {
          section.setAttribute('aria-label', heading.textContent);
        }
      }
    });
    
    // Add role attributes
    const navigation = document.querySelector('.homepage-navigation');
    if (navigation) {
      navigation.setAttribute('role', 'navigation');
      navigation.setAttribute('aria-label', 'Section navigation');
    }
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Focus trap for modals
    document.addEventListener('focusin', (e) => {
      const modal = e.target.closest('.modal[style*="block"]');
      if (modal) {
        this.trapFocus(e, modal);
      }
    });
  }

  /**
   * Trap focus within modal
   */
  trapFocus(e, modal) {
    const focusableElements = modal.querySelectorAll(this.focusableElements.join(','));
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  }
}

/**
 * Error boundary for homepage
 */
export class ErrorBoundary {
  constructor() {
    this.errors = [];
    this.maxErrors = 10;
  }

  /**
   * Initialize error handling
   */
  init() {
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
  }

  /**
   * Handle JavaScript errors
   */
  handleError(event) {
    const error = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: new Date().toISOString()
    };
    
    this.logError(error);
    this.showFallbackUI(error);
  }

  /**
   * Handle promise rejections
   */
  handlePromiseRejection(event) {
    const error = {
      message: 'Unhandled Promise Rejection',
      reason: event.reason,
      timestamp: new Date().toISOString()
    };
    
    this.logError(error);
    this.showFallbackUI(error);
  }

  /**
   * Log error for debugging
   */
  logError(error) {
    this.errors.push(error);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    console.error('Homepage Error:', error);
  }

  /**
   * Show fallback UI
   */
  showFallbackUI(error) {
    const container = document.getElementById('app');
    if (container && container.children.length === 0) {
      container.innerHTML = `
        <div class="error-fallback">
          <h2>Something went wrong</h2>
          <p>We're having trouble loading the homepage. Please try refreshing the page.</p>
          <button onclick="location.reload()" class="btn-primary">Refresh Page</button>
          <details style="margin-top: 1rem;">
            <summary>Error details</summary>
            <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto;">
${JSON.stringify(error, null, 2)}
            </pre>
          </details>
        </div>
      `;
    }
  }

  /**
   * Get error history
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Clear error history
   */
  clearErrors() {
    this.errors = [];
  }
}