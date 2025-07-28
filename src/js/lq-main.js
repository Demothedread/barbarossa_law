import { fetchQuestionsByType, logQuizAttempt, saveEnhancedQuizHistory } from './lq-api.js';
import { authManager, showAuthModal } from './lq-auth.js';
import { createFriendlyMode } from './lq-friendly-mode.js';
import { createHomepage } from './lq-homepage.js';
import { createQuestionGenerator } from './lq-question-generator.js';
import { createQuizShowMode } from './lq-quiz-show-mode.js';
import { createQuiz } from './lq-quiz.js';
import { createReview } from './lq-review.js';
import { setupQuizWithSubtopics } from './lq-setup.js';
import { createStartMenu } from './lq-start-menu.js';
import { createStatisticsPage } from './lq-statistics.js';
import { createStatsWidget, showAchievementNotification, updateStatsWidget } from './lq-stats-widget.js';
import { userProfileManager } from './lq-user-profile.js';
import { createWelcomeScreen, shouldShowWelcome } from './lq-welcome.js';
import { ThemeManager } from './theme-manager.js';

const app = document.getElementById('app');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');

/**
 * Navigation and modal elements
 * Ensure Home and Start Quiz buttons provide reliable navigation and feedback.
 */
const homeBtn = document.getElementById('homeBtn');
const generatorBtn = document.getElementById('generatorBtn');
const statisticsBtn = document.getElementById('statisticsBtn');
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const retryBtn = document.getElementById('retryBtn');

// Home button navigation
if (homeBtn) {
  homeBtn.onclick = (e) => {
    e.preventDefault();
    // Always go to homepage by resetting state and calling homepage init
    if (typeof navigateToHome === 'function') {
      navigateToHome();
    } else if (typeof initHomepage === 'function') {
      initHomepage();
    } else if (typeof init === 'function') {
      init();
    } else {
      window.location.href = '/';
    }
  };
}

// Start Quiz button feedback (if present on homepage)
document.addEventListener('click', (e) => {
  const startQuizBtn = e.target.closest('#startQuiz');
  if (startQuizBtn) {
    e.preventDefault();
    // Optionally show loading feedback
    if (typeof showLoading === 'function') showLoading('Starting quiz...');
    // Simulate click on the actual quiz start logic if available
    if (typeof startQuiz === 'function') {
      // Gather options from the form or use defaults
      const opts = window.getQuizOptions ? window.getQuizOptions() : { n: 10, subject: '', questionType: 'MBE', quizMode: 'classic' };
      startQuiz(opts);
    }
  }
});

// State management
let currentPage = 'home';
let quizHistory = JSON.parse(localStorage.getItem('lawQuizHistory') || '[]');

// Function to get current user ID (authenticated or anonymous)
function getCurrentUserId() {
  if (authManager.isAuthenticated()) {
    const user = authManager.getCurrentUser();
    return user ? `user_${user.id}` : getAnonymousUserId();
  }
  return getAnonymousUserId();
}

// Generate and store a user ID if one doesn't exist yet (for anonymous users)
function getAnonymousUserId() {
  if (!localStorage.getItem('userId')) {
    const userId = 'anonymous_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('userId', userId);
  }
  return localStorage.getItem('userId');
}

async function startQuiz(opts) {
  console.log('[DEBUG] startQuiz called with options:', opts);
  showLoading('Loading questions...');
  try {
    console.log('[DEBUG] Fetching questions with params:', {
      count: opts.n,
      subject: opts.subject,
      type: opts.questionType,
      subtopic: opts.subtopic
    });
    
    let res;
    try {
      res = await fetchQuestionsByType(opts.n, opts.subject, opts.questionType, opts.subtopic);
      console.log('[DEBUG] Questions fetched successfully:', {
        count: res.questions?.length,
        hasQuestions: !!res.questions
      });
    } catch (fetchError) {
      console.error('[DEBUG] Error fetching questions:', fetchError);
      showError('Failed to fetch questions. Please try again.');
      return;
    }
    const questions = res.questions;
    if (!questions || !questions.length) {
      showError('No questions available. Try a different subject, question type, or number.');
      return;
    }
    hideLoading();
    hideError();
    app.innerHTML = '';
    document.body.classList.add('quiz-mode');
    let quizElement;
    // Standardize on opts.quizMode for all modes
    if (opts.quizMode === 'quiz-show') {
      if (window.themeManager && window.themeManager.currentTheme !== 'quiz-show') {
        window.themeManager.applyTheme('quiz-show');
      }
      quizElement = await createQuizShowMode(questions, opts, async (qs, answers, meta) => {
        try {
          document.body.classList.remove('quiz-mode');
          const result = {
            datetime: new Date().toISOString(),
            userId: getCurrentUserId(),
            opts: { ...opts, quizMode: 'quiz-show' },
            answers,
            meta: { ...meta, quizMode: 'quiz-show' },
            questions: qs
          };
          quizHistory.unshift(result);
          if (quizHistory.length > 100) quizHistory.splice(100);
          localStorage.setItem('lawQuizHistory', JSON.stringify(quizHistory));
          try {
            await logQuizAttempt(result);
          } catch (err) {
            console.error('Error logging quiz attempt:', err);
            showError('Error saving quiz results.');
          }
          const reviewElement = createReview(qs, answers, meta);
          app.innerHTML = '';
          app.appendChild(reviewElement);
        } catch (error) {
          console.error('Error handling quiz completion:', error);
          showError('Error saving quiz results.');
        }
      });
    } else if (opts.quizMode === 'friendly') {
      if (window.themeManager && window.themeManager.currentTheme !== 'friendly') {
        window.themeManager.applyTheme('friendly');
      }
      quizElement = await createFriendlyMode(questions, opts, async (qs, answers, meta) => {
        try {
          document.body.classList.remove('quiz-mode');
          const result = {
            datetime: new Date().toISOString(),
            userId: getCurrentUserId(),
            opts: { ...opts, quizMode: 'friendly' },
            answers,
            meta: { ...meta, quizMode: 'friendly' },
            questions: qs
          };
          quizHistory.unshift(result);
          if (quizHistory.length > 100) quizHistory.splice(100);
          localStorage.setItem('lawQuizHistory', JSON.stringify(quizHistory));
          try {
            await logQuizAttempt(result);
          } catch (err) {
            console.error('Error logging quiz attempt:', err);
            showError('Error saving quiz results.');
          }
          const reviewElement = createReview(qs, answers, meta);
          app.innerHTML = '';
          app.appendChild(reviewElement);
        } catch (error) {
          console.error('Error handling quiz completion:', error);
          showError('Error saving quiz results.');
        }
      });
    } else {
      quizElement = createQuiz(questions, opts, async (qs, answers, meta) => {
        try {
          document.body.classList.remove('quiz-mode');
          const result = {
            datetime: new Date().toISOString(),
            userId: getCurrentUserId(),
            opts: { ...opts, quizMode: opts.quizMode || 'classic' },
            answers,
            meta: { ...meta, quizMode: opts.quizMode || 'classic' },
            questions: qs
          };
          quizHistory.unshift(result);
          quizHistory = quizHistory.slice(0, 50);
          localStorage.setItem('lawQuizHistory', JSON.stringify(quizHistory));
          try {
            const enhancedData = {
              user_id: getCurrentUserId(),
              subject: opts.subject || '',
              subtopic: opts.subtopic || '',
              correct: meta.correct,
              total: meta.total,
              duration_seconds: meta.duration_s,
              questions: qs.map(q => q.idx),
              answers: answers,
              time_per_question: meta.time_per_question || [],
              question_difficulties: qs.map(() => 'normal'),
              mode: opts.quizMode || 'classic',
              negative_time: meta.negative_time || false
            };
            await saveEnhancedQuizHistory(enhancedData);
            checkAndShowAchievements(meta, opts);
            if (currentPage === 'home') {
              setTimeout(() => updateStatsWidget(), 1000);
            }
          } catch (error) {
            console.error('Failed to save enhanced quiz history:', error);
            showError('Failed to save enhanced quiz history.');
          }
          try {
            await logQuizAttempt(result);
          } catch (err) {
            console.error('Error logging quiz attempt:', err);
            showError('Error logging quiz attempt.');
          }
          app.innerHTML = '';
          const review = createReview(qs, answers, meta);
          app.appendChild(review);
        } catch (error) {
          console.error('Error logging quiz attempt:', error);
          app.innerHTML = '';
          const review = createReview(qs, answers, meta);
          app.appendChild(review);
        }
      });
    }
    app.appendChild(quizElement);
  } catch (error) {
    console.error('Error starting quiz:', error);
    showError('Failed to load questions. Please check your connection and try again.');
  }
}

function showLoading(message = 'Loading...') {
  loadingEl.querySelector('p').textContent = message;
  loadingEl.style.display = 'block';
  app.style.display = 'none';
  errorEl.style.display = 'none';
}

function hideLoading() {
  loadingEl.style.display = 'none';
  app.style.display = 'block';
}

function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  errorEl.style.display = 'block';
  app.style.display = 'none';
  loadingEl.style.display = 'none';
}

function hideError() {
  errorEl.style.display = 'none';
  app.style.display = 'block';
}

async function navigateToHome() {
  currentPage = 'home';
  updateNavigation();
  hideLoading();
  hideError();
  // Remove quiz-mode class when navigating home
  document.body.classList.remove('quiz-mode');
  await initHomepage();
}

async function showQuestionGenerator() {
  currentPage = 'generator';
  updateNavigation();
  hideLoading();
  hideError();
  document.body.classList.remove('quiz-mode');
  
  app.innerHTML = '';
  const generatorPage = createQuestionGenerator(startQuiz);
  app.appendChild(generatorPage);
}

function handleQuestionGeneration(_opts) {
  // Remove redundant advanced-mode branch; always show generator
  showQuestionGenerator();
}

async function showStatistics() {
  currentPage = 'statistics';
  updateNavigation();
  hideLoading();
  hideError();
  // Remove quiz-mode class when navigating away from quiz
  document.body.classList.remove('quiz-mode');
  
  app.innerHTML = '';
  showLoading('Loading statistics...');
  
  try {
    const statsPage = await createStatisticsPage();
    hideLoading();
    app.appendChild(statsPage);
  } catch (error) {
    console.error('Error loading statistics:', error);
    hideLoading();
    showError('Failed to load statistics. Please try again.');
  }
}

function updateNavigation() {
  homeBtn.classList.toggle('active', currentPage === 'home');
  generatorBtn.classList.toggle('active', currentPage === 'generator');
  statisticsBtn.classList.toggle('active', currentPage === 'statistics');
  aboutBtn.classList.remove('active');
  
  // Update mobile navigation if it exists
  updateMobileNavigation();
}

// Enhanced navigation functions for new header structure
function updateMobileNavigation() {
  const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn');
  mobileNavButtons.forEach(btn => {
    const targetId = btn.getAttribute('data-target');
    const isActive = (
      (targetId === 'homeBtn' && currentPage === 'home') ||
      (targetId === 'generatorBtn' && currentPage === 'generator') ||
      (targetId === 'statisticsBtn' && currentPage === 'statistics')
    );
    btn.classList.toggle('active', isActive);
  });
}

// Mobile menu functionality
function initializeMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');
  const mobileNavClose = document.getElementById('mobileNavClose');
  const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn');

  if (!mobileMenuToggle || !mobileNavOverlay) return;

  // Toggle mobile menu
  mobileMenuToggle.addEventListener('click', () => {
    mobileMenuToggle.classList.toggle('active');
    mobileNavOverlay.classList.toggle('active');
    document.body.style.overflow = mobileNavOverlay.classList.contains('active') ? 'hidden' : '';
  });

  // Close mobile menu
  const closeMobileMenu = () => {
    mobileMenuToggle.classList.remove('active');
    mobileNavOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (mobileNavClose) {
    mobileNavClose.addEventListener('click', closeMobileMenu);
  }

  // Close menu when clicking overlay
  mobileNavOverlay.addEventListener('click', (e) => {
    if (e.target === mobileNavOverlay) {
      closeMobileMenu();
    }
  });

  // Handle mobile navigation button clicks
  mobileNavButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetBtn = document.getElementById(targetId);
      if (targetBtn) {
        targetBtn.click();
        closeMobileMenu();
      }
    });
  });

  // Close mobile menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNavOverlay.classList.contains('active')) {
      closeMobileMenu();
    }
  });
}

// Enhanced theme integration
function initializeEnhancedThemeIntegration() {
  // Move theme selector to integrated location if enhanced header exists
  const themeSection = document.getElementById('themeSection');
  const mobileThemeSelector = document.getElementById('mobileThemeSelector');
  
  if (themeSection && window.themeManager) {
    // Remove any existing theme selector
    const existingSelector = document.querySelector('.theme-selector');
    if (existingSelector && existingSelector.parentNode !== themeSection) {
      existingSelector.remove();
    }
    
    // Create theme selector in integrated location
    window.themeManager.createThemeSelectorIntegrated(themeSection);
    
    // Create mobile theme selector if mobile section exists
    if (mobileThemeSelector) {
      window.themeManager.createMobileThemeSelector(mobileThemeSelector);
    }
  }
}

// Enhanced authentication integration
function initializeEnhancedAuthentication() {
  const authSection = document.getElementById('authSection');
  const mobileAuthSection = document.getElementById('mobileAuthSection');
  
  if (!authSection) return;

  // Initialize authentication UI components
  initializeAuthenticationUI(authSection, mobileAuthSection);
  
  // Subscribe to authentication state changes
  authManager.subscribe((user, isAuthenticated) => {
    updateAuthenticationUI(user, isAuthenticated, authSection, mobileAuthSection);
  });
  
  // Initial authentication state update
  const currentUser = authManager.getCurrentUser();
  const isAuthenticated = authManager.isAuthenticated();
  updateAuthenticationUI(currentUser, isAuthenticated, authSection, mobileAuthSection);
}

function initializeAuthenticationUI(_authSection, _mobileAuthSection) {
  // Setup login button handler
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      showAuthModal('login');
    });
  }

  // Setup user profile dropdown
  const userProfileBtn = document.getElementById('userProfileBtn');
  const userProfileDropdown = document.getElementById('userProfileDropdown');
  
  if (userProfileBtn && userProfileDropdown) {
    userProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userProfileDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      userProfileDropdown.classList.remove('active');
    });

    // Setup dropdown menu items
    const profileSettingsBtn = document.getElementById('profileSettingsBtn');
    const userStatsBtn = document.getElementById('userStatsBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (profileSettingsBtn) {
      profileSettingsBtn.addEventListener('click', () => {
        // Show profile settings modal or navigate to settings
        showAuthModal('profile');
        userProfileDropdown.classList.remove('active');
      });
    }

    if (userStatsBtn) {
      userStatsBtn.addEventListener('click', () => {
        showStatistics();
        userProfileDropdown.classList.remove('active');
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await authManager.logout();
          userProfileDropdown.classList.remove('active');
          // Optionally refresh the page or update UI
          window.location.reload();
        } catch (error) {
          console.error('Logout failed:', error);
        }
      });
    }
  }
}

function updateAuthenticationUI(user, isAuthenticated, _authSection, mobileAuthSection) {
  const loginBtn = document.getElementById('loginBtn');
  const userProfileDropdown = document.getElementById('userProfileDropdown');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');

  if (isAuthenticated && user) {
    // Show user profile, hide login button
    if (loginBtn) loginBtn.style.display = 'none';
    if (userProfileDropdown) {
      userProfileDropdown.style.display = 'block';
      if (userName) userName.textContent = user.username || user.name || 'User';
      if (userEmail) userEmail.textContent = user.email || '';
    }
  } else {
    // Show login button, hide user profile
    if (loginBtn) loginBtn.style.display = 'block';
    if (userProfileDropdown) userProfileDropdown.style.display = 'none';
  }

  // Update mobile auth section if it exists
  if (mobileAuthSection) {
    updateMobileAuthUI(user, isAuthenticated, mobileAuthSection);
  }
}

function updateMobileAuthUI(user, isAuthenticated, mobileAuthSection) {
  if (isAuthenticated && user) {
    mobileAuthSection.innerHTML = `
      <div class="mobile-user-info">
        <div class="mobile-user-avatar">👤</div>
        <div class="mobile-user-details">
          <div class="mobile-user-name">${user.username || user.name || 'User'}</div>
          <div class="mobile-user-email">${user.email || ''}</div>
        </div>
      </div>
      <div class="mobile-auth-actions">
        <button class="mobile-auth-btn" onclick="showAuthModal('profile')">
          <span class="mobile-auth-icon">⚙️</span>
          Settings
        </button>
        <button class="mobile-auth-btn" onclick="authManager.logout().then(() => window.location.reload())">
          <span class="mobile-auth-icon">🚪</span>
          Logout
        </button>
      </div>
    `;
  } else {
    mobileAuthSection.innerHTML = `
      <button class="mobile-auth-btn primary" onclick="showAuthModal('login')">
        <span class="mobile-auth-icon">👤</span>
        Login / Register
      </button>
    `;
  }
}


// Integrate subtopic selection into quiz setup
export async function setupQuizWithSubtopicsHandler() {
  try {
    await setupQuizWithSubtopics(startQuiz);
  } catch (error) {
    console.error('Failed to setup quiz with subtopics:', error);
    showError('Failed to load subtopics. Please try again.');
  }
}

// Event listeners
homeBtn.addEventListener('click', navigateToHome);
generatorBtn.addEventListener('click', showQuestionGenerator);
statisticsBtn.addEventListener('click', showStatistics);
aboutBtn.addEventListener('click', () => {
  aboutModal.style.display = 'flex';
});

retryBtn.addEventListener('click', navigateToHome);

// Modal close functionality
document.querySelectorAll('.modal-close').forEach(closeBtn => {
  closeBtn.addEventListener('click', (e) => {
    e.target.closest('.modal').style.display = 'none';
  });
});

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

export function init() {
  hideLoading();
  hideError();
  
  // Check if we should show the welcome screen
  if (shouldShowWelcome()) {
    showWelcomeScreen();
  } else {
    initializeMainApp();
  }
}

function showWelcomeScreen() {
  createWelcomeScreen(() => {
    // Welcome screen completed, now check authentication and show main app
    checkAuthenticationAndShowApp();
  });
}

function checkAuthenticationAndShowApp() {
  // For now, go directly to main app since authentication is optional
  // Users can login later using the login button in the header
  initializeMainApp();
  
  // Optional: Show a subtle prompt for registration for new users
  if (!authManager.isAuthenticated() && !localStorage.getItem('hasSeenAuthPrompt')) {
    setTimeout(() => {
      localStorage.setItem('hasSeenAuthPrompt', 'true');
      // Could show a non-blocking notification about the benefits of creating an account
    }, 2000);
  }
}

async function initializeMainApp() {
  app.innerHTML = '';
  console.log('[DEBUG] Initializing main app');
  
  try {
    // Create new comprehensive homepage with integrated sections
    console.log('[DEBUG] Creating homepage with startQuiz callback:', typeof startQuiz);
    const homepage = await createHomepage(startQuiz, handleQuestionGeneration);
    console.log('[DEBUG] Homepage created, appending to DOM');
    app.appendChild(homepage);
  } catch (error) {
    console.error('[DEBUG] Failed to initialize homepage:', error);
    // Fallback to original implementation
    const mainContainer = document.createElement('div');
    mainContainer.className = 'home-container';
    
    try {
      // Add stats widget at the top
      const widget = await createStatsWidget();
      mainContainer.appendChild(widget);
    } catch (widgetError) {
      console.error('Failed to load stats widget:', widgetError);
    }
    
    // Add start menu
    const menu = createStartMenu(startQuiz, handleQuestionGeneration);
    mainContainer.appendChild(menu);
    
    app.appendChild(mainContainer);
  }
}

// Initialize the theme manager
window.themeManager = new ThemeManager();

// Initialize enhanced navigation features
document.addEventListener('DOMContentLoaded', () => {
  // Initialize mobile menu functionality
  initializeMobileMenu();
  
  // Initialize enhanced theme integration
  initializeEnhancedThemeIntegration();
  
  // Initialize enhanced authentication
  initializeEnhancedAuthentication();
});

// Achievement checking function
function checkAndShowAchievements(meta, _opts) {
  const accuracy = (meta.correct / meta.total) * 100;
  
  // Perfect score achievement
  if (meta.correct === meta.total && meta.total >= 5) {
    showAchievementNotification('milestone', `Perfect Score! ${meta.total}/${meta.total} correct! 🌟`);
  }
  
  // High accuracy achievement
  else if (accuracy >= 90 && meta.total >= 10) {
    showAchievementNotification('goal', `Excellent! ${accuracy.toFixed(1)}% accuracy! 🎯`);
  }
  
  // Bar exam goal achievement
  else if (accuracy >= 65 && meta.total >= 10) {
    showAchievementNotification('goal', `Bar Exam Ready! ${accuracy.toFixed(1)}% accuracy! 📚`);
  }
  
  // Speed achievement (if answered quickly)
  if (meta.duration_s / meta.total < 30 && accuracy >= 70) {
    showAchievementNotification('improvement', 'Speed Demon! Fast and accurate! ⚡');
  }
  
  // First quiz achievement
  const currentHistory = JSON.parse(localStorage.getItem('lawQuizHistory') || '[]');
  if (currentHistory.length === 1) {
    showAchievementNotification('milestone', 'Welcome to Law Quizzer! First quiz completed! 🎉');
  }
  
  // Milestone achievements
  else if (currentHistory.length === 10) {
    showAchievementNotification('milestone', '10 Quizzes Completed! You\'re building momentum! 🚀');
  }
  else if (currentHistory.length === 50) {
    showAchievementNotification('milestone', '50 Quizzes Completed! Dedication pays off! 🏆');
  }
  else if (currentHistory.length === 100) {
    showAchievementNotification('milestone', '100 Quizzes Completed! True dedication! 👑');
  }
}

// Make statistics functions globally accessible
window.showStatistics = showStatistics;
window.navigateToHome = navigateToHome;
window.updateStatsWidget = updateStatsWidget;

// Initialize authentication UI
userProfileManager.init();

// Initialize the application
init();

// Setup authentication button handlers
document.addEventListener('DOMContentLoaded', () => {
  // Add login button to header if it doesn't exist
  const header = document.querySelector('header');
  if (header && !document.getElementById('loginBtn')) {
    const authContainer = document.createElement('div');
    authContainer.className = 'auth-container';
    authContainer.innerHTML = `
      <button id="loginBtn" class="btn btn-secondary">Login</button>
      <div id="userInfo" class="user-info" style="display: none;"></div>
    `;
    header.appendChild(authContainer);

    // Add event listener for login button
    document.getElementById('loginBtn').addEventListener('click', () => {
      showAuthModal('login');
    });
  }
});

// Low-contrast mode toggle logic
function setupLowContrastToggle() {
  const btn = document.getElementById('lowContrastToggle');
  if (!btn) return;
  // Restore state from localStorage
  if (localStorage.getItem('lowContrast') === '1') {
    document.body.classList.add('low-contrast');
  }
  btn.addEventListener('click', () => {
    document.body.classList.toggle('low-contrast');
    const isLow = document.body.classList.contains('low-contrast');
    localStorage.setItem('lowContrast', isLow ? '1' : '0');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // ...existing code...
  setupLowContrastToggle();
});
