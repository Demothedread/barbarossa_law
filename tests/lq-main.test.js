import { jest } from '@jest/globals';

const buildDom = () => {
  document.body.innerHTML = `
    <div id="app"></div>
    <button id="homeBtn"></button>
    <button id="generatorBtn"></button>
    <button id="statisticsBtn"></button>
    <button id="aboutBtn"></button>
    <div id="aboutModal" class="modal">
      <button class="modal-close">Close</button>
    </div>
    <button id="retryBtn"></button>
  `;
};

const mockMainDependencies = ({
  createHomepageImpl,
  shouldShowWelcomeImpl
} = {}) => {
  const createHomepage = jest.fn(createHomepageImpl);
  const createStartMenu = jest.fn(() => {
    const el = document.createElement('div');
    el.id = 'start-menu';
    return el;
  });
  const createStatsWidget = jest.fn(async () => {
    const el = document.createElement('div');
    el.id = 'stats-widget';
    return el;
  });
  const shouldShowWelcome = jest.fn(shouldShowWelcomeImpl || (() => false));
  const createWelcomeScreen = jest.fn();

  jest.unstable_mockModule('../src/js/lq-api.js', () => ({
    fetchQuestionsByType: jest.fn(),
    logQuizAttempt: jest.fn(),
    saveEnhancedQuizHistory: jest.fn()
  }));
  jest.unstable_mockModule('../src/js/lq-auth.js', () => ({
    authManager: {
      isAuthenticated: jest.fn(() => false),
      getCurrentUser: jest.fn(() => null),
      subscribe: jest.fn(),
      logout: jest.fn()
    },
    showAuthModal: jest.fn()
  }));
  jest.unstable_mockModule('../src/js/lq-friendly-mode.js', () => ({
    createFriendlyMode: jest.fn().mockResolvedValue(document.createElement('div'))
  }));
  jest.unstable_mockModule('../src/js/lq-homepage.js', () => ({
    createHomepage
  }));
  jest.unstable_mockModule('../src/js/lq-question-generator.js', () => ({
    createQuestionGenerator: jest.fn(() => document.createElement('div'))
  }));
  jest.unstable_mockModule('../src/js/lq-quiz-show-mode.js', () => ({
    createQuizShowMode: jest.fn().mockResolvedValue(document.createElement('div'))
  }));
  jest.unstable_mockModule('../src/js/lq-quiz.js', () => ({
    createQuiz: jest.fn(() => document.createElement('div'))
  }));
  jest.unstable_mockModule('../src/js/lq-review.js', () => ({
    createReview: jest.fn(() => document.createElement('div'))
  }));
  jest.unstable_mockModule('../src/js/lq-setup.js', () => ({
    setupQuizWithSubtopics: jest.fn()
  }));
  jest.unstable_mockModule('../src/js/lq-start-menu.js', () => ({
    createStartMenu
  }));
  jest.unstable_mockModule('../src/js/lq-statistics.js', () => ({
    createStatisticsPage: jest.fn().mockResolvedValue(document.createElement('div'))
  }));
  jest.unstable_mockModule('../src/js/lq-stats-widget.js', () => ({
    createStatsWidget,
    showAchievementNotification: jest.fn(),
    updateStatsWidget: jest.fn()
  }));
  jest.unstable_mockModule('../src/js/lq-user-profile.js', () => ({
    userProfileManager: { init: jest.fn() }
  }));
  jest.unstable_mockModule('../src/js/lq-welcome.js', () => ({
    createWelcomeScreen,
    shouldShowWelcome
  }));
  jest.unstable_mockModule('../src/js/theme-manager.js', () => ({
    ThemeManager: class {
      constructor() {
        this.currentTheme = 'classic';
      }
      applyTheme(theme) {
        this.currentTheme = theme;
      }
      createThemeSelectorIntegrated() {}
      createMobileThemeSelector() {}
    }
  }));
  jest.unstable_mockModule('../src/js/lq-loading.js', () => ({
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    showError: jest.fn(),
    hideError: jest.fn()
  }));

  return {
    createHomepage,
    createStartMenu,
    createStatsWidget,
    createWelcomeScreen,
    shouldShowWelcome
  };
};

describe('lq-main init', () => {
  beforeEach(() => {
    buildDom();
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('initializes homepage when welcome is not shown', async () => {
    const createHomepageImpl = async () => {
      const el = document.createElement('div');
      el.id = 'homepage';
      return el;
    };
    const mocks = mockMainDependencies({
      createHomepageImpl,
      shouldShowWelcomeImpl: () => false
    });

    await import('../src/js/lq-main.js');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mocks.createHomepage).toHaveBeenCalled();
    expect(document.getElementById('homepage')).not.toBeNull();
  });

  test('falls back to legacy start menu when homepage fails', async () => {
    const mocks = mockMainDependencies({
      createHomepageImpl: async () => {
        throw new Error('homepage failure');
      },
      shouldShowWelcomeImpl: () => false
    });

    await import('../src/js/lq-main.js');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mocks.createStartMenu).toHaveBeenCalled();
    expect(document.getElementById('start-menu')).not.toBeNull();
  });
});
