/**
 * Homepage Container for Law Quizzer
 * Comprehensive restructured homepage with statistics hero, quiz modes, and integrated sections
 */

import { fetchSubtopicStats, getQuizHistory } from "./lq-api.js";
import { createBarbarossaHero } from "./lq-barbarossa-hero.js";
import { createBurnItDownSection } from "./lq-burn-it-down.js";
import { createEssayBankSection } from "./lq-essay-bank.js";
import { createEssayWriterSection } from "./lq-essay-writer.js";
import { createExamBankSection } from "./lq-exam-bank.js";
import { createFreeRangeSection } from "./lq-free-range.js";
import {
  AccessibilityManager,
  DataCacheManager,
  ErrorBoundary,
  LazyLoadManager,
  PerformanceMonitor,
  ResponsiveLayoutManager,
  ThemeOptimizer,
} from "./lq-homepage-utils.js";
import { createStudyDockSection } from "./lq-study-dock.js";
import { getIconString } from "./lunaire-icons.js";

export class Homepage {
  constructor(onStartQuiz, onGenerateQuestions) {
    console.log(
      "[DEBUG] Homepage constructor - onStartQuiz type:",
      typeof onStartQuiz,
    );
    this.onStartQuiz = onStartQuiz;
    this.onGenerateQuestions = onGenerateQuestions;
    this.container = null;
    this.isAuthenticated = false;
    this.userData = null;
    this.statisticsData = null;

    // Initialize performance utilities
    this.lazyLoader = new LazyLoadManager();
    this.performanceMonitor = new PerformanceMonitor();
    this.themeOptimizer = new ThemeOptimizer();
    this.dataCache = new DataCacheManager();
    this.layoutManager = new ResponsiveLayoutManager();
    this.accessibilityManager = new AccessibilityManager();
    this.errorBoundary = new ErrorBoundary();
  }

  /**
   * Initialize and create the homepage
   */
  async init() {
    console.log(
      "[DEBUG] Homepage init starting, onStartQuiz is:",
      typeof this.onStartQuiz,
    );
    try {
      // Initialize performance utilities
      this.errorBoundary.init();
      this.lazyLoader.init();
      this.layoutManager.init();
      this.accessibilityManager.init();

      this.isAuthenticated = authManager.isAuthenticated();
      this.userData = this.isAuthenticated
        ? authManager.getCurrentUser()
        : null;

      await this.loadUserData();
      console.log("[DEBUG] Creating homepage structure");
      this.createHomepageStructure();
      console.log("[DEBUG] Binding events");
      this.bindEvents();
      this.initializePerformanceOptimizations();

      // Verify callback is still valid after initialization
      console.log(
        "[DEBUG] Homepage init complete, onStartQuiz is:",
        typeof this.onStartQuiz,
      );

      this.performanceMonitor.markLoadComplete();

      return this.container;
    } catch (error) {
      console.error("Failed to initialize homepage:", error);
      this.errorBoundary.handleError({ error, context: "homepage_init" });
      throw error;
    }
  }

  /**
   * Load user statistics and data with caching
   */
  async loadUserData() {
    const userId = this.getUserId();
    const cacheKey = `user_data_${userId}`;

    // Try to get cached data first
    let cachedData = this.dataCache.get(cacheKey);
    if (cachedData) {
      this.statisticsData = cachedData;
      return;
    }

    try {
      if (userId) {
        // Load history data first
        const historyData = await getQuizHistory(userId);

        // Try to load subtopic stats, but continue if it fails
        let subtopicData = {};
        try {
          subtopicData = await fetchSubtopicStats(userId);
        } catch (subtopicError) {
          console.warn("Failed to load subtopic stats:", subtopicError);
          // Continue with empty subtopic data
        }

        this.statisticsData = {
          history: historyData,
          subtopics: subtopicData,
          userId: userId,
        };

        // Cache the data
        this.dataCache.set(cacheKey, this.statisticsData);
      }
    } catch (error) {
      console.warn("Failed to load user data:", error);
      // Initialize with empty data instead of null
      this.statisticsData = {
        history: [],
        subtopics: {},
        userId: userId,
      };
    }
  }

  /**
   * Get current user ID (authenticated or anonymous)
   */
  getUserId() {
    if (this.isAuthenticated && this.userData) {
      return `user_${this.userData.id}`;
    }
    return localStorage.getItem("userId") || this.generateAnonymousId();
  }

  /**
   * Generate anonymous user ID
   */
  generateAnonymousId() {
    const id = "anonymous_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("userId", id);
    return id;
  }

  /**
   * Create the main homepage structure
   * (Refactored for maximalist hero, headings, and module framing)
   */
  createHomepageStructure() {
    this.container = document.createElement("div");
    this.container.className = "homepage-container barbarossa-homepage";

    const hero = createBarbarossaHero();
    this.container.appendChild(hero);

    const statsSection = document.createElement("section");
    statsSection.className = "module-frame-alt stats-captains-log";
    statsSection.id = "captains-log";
    statsSection.innerHTML = `
      <div class="stats-header">
        <h2>${getIconString("document", 28)} Captain's Log</h2>
        <p>Track your accuracy, streaks, and improvements across the fleet.</p>
      </div>
      <div id="homepageStatsWidget"></div>
    `;
    this.container.appendChild(statsSection);

    const statsWidget = this.createEnhancedStatsWidget
      ? this.createEnhancedStatsWidget()
      : null;
    if (statsWidget) {
      statsSection
        .querySelector("#homepageStatsWidget")
        .appendChild(statsWidget);
    }

    const examBankSection = createExamBankSection(
      this.onStartQuiz,
      this.onGenerateQuestions,
    );
    this.container.appendChild(examBankSection);

    const freeRangeSection = createFreeRangeSection(this.onGenerateQuestions);
    this.container.appendChild(freeRangeSection);

    const essayBankSection = createEssayBankSection();
    const essayWriterSection = createEssayWriterSection();
    const essayDeck = document.createElement("section");
    essayDeck.className = "essay-deck-section";
    essayDeck.id = "essay-deck";
    essayDeck.appendChild(essayBankSection);
    essayDeck.appendChild(essayWriterSection);
    this.container.appendChild(essayDeck);

    const studyDockSection = createStudyDockSection();
    this.container.appendChild(studyDockSection);

    const burnItDownSection = createBurnItDownSection();
    this.container.appendChild(burnItDownSection);
  }

  /**
   * Create the statistics hero section with integrated welcome content
   */
  createStatisticsHeroSection() {
    const heroSection = document.createElement("section");
    heroSection.className = "homepage-hero-section";
    heroSection.id = "statistics-hero";

    // Hero container with Dorothy Draper styling
    const heroContainer = document.createElement("div");
    heroContainer.className = "hero-container";

    // Welcome content integration
    const welcomeContent = this.createWelcomeContent();
    heroContainer.appendChild(welcomeContent);

    // Statistics widget (prominent placement)
    const statsWidget = this.createEnhancedStatsWidget();
    heroContainer.appendChild(statsWidget);

    // Quick actions for authenticated users
    if (this.isAuthenticated) {
      const quickActions = this.createQuickActionsPanel();
      heroContainer.appendChild(quickActions);
    }

    heroSection.appendChild(heroContainer);
    this.container.appendChild(heroSection);
  }

  /**
   * Create integrated welcome content with Dorothy Draper styling
   */
  createWelcomeContent() {
    const welcomeDiv = document.createElement("div");
    welcomeDiv.className = "welcome-content-integrated";

    const title = document.createElement("h1");
    title.className = "welcome-title";
    title.textContent = this.isAuthenticated
      ? `Welcome back, ${this.userData?.name || "Student"}!`
      : "Welcome to Hick's Law Quizzer";

    const subtitle = document.createElement("p");
    subtitle.className = "welcome-subtitle";
    subtitle.textContent = this.isAuthenticated
      ? "Ready to continue your legal studies journey?"
      : "                                                                                                                legal concepts with our comprehensive quiz platform";

    // Dorothy Draper decorative elements
    const decoration = document.createElement("div");
    decoration.className = "draper-welcome-decoration";
    decoration.innerHTML = `${getIconString("star", 20)} ${getIconString(
      "moon",
      24,
    )} ${getIconString("star", 20)}`;

    welcomeDiv.appendChild(title);
    welcomeDiv.appendChild(subtitle);
    welcomeDiv.appendChild(decoration);

    return welcomeDiv;
  }

  /**
   * Create enhanced statistics widget
   */
  createEnhancedStatsWidget() {
    const statsContainer = document.createElement("div");
    statsContainer.className = "enhanced-stats-widget";

    if (this.statisticsData && this.statisticsData.history.length > 0) {
      // User has quiz history
      const statsWidget = this.createDetailedStatsDisplay();
      statsContainer.appendChild(statsWidget);
    } else {
      // No quiz history - show encouraging message
      const emptyStats = this.createEmptyStatsDisplay();
      statsContainer.appendChild(emptyStats);
    }

    return statsContainer;
  }

  /**
   * Create detailed statistics display for users with history
   */
  createDetailedStatsDisplay() {
    const statsDiv = document.createElement("div");
    statsDiv.className = "detailed-stats-display";

    const { history } = this.statisticsData;

    // Calculate key metrics
    const totalQuizzes = history.length;
    const totalCorrect = history.reduce((sum, quiz) => sum + quiz.correct, 0);
    const totalQuestions = history.reduce((sum, quiz) => sum + quiz.total, 0);
    const averageScore =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;
    const recentQuizzes = history.slice(0, 5);

    // Stats cards grid
    const statsGrid = document.createElement("div");
    statsGrid.className = "stats-grid";

    // Create stat cards
    const statCards = [
      {
        label: "Total Quizzes",
        value: totalQuizzes,
        icon: getIconString("chart", 32),
      },
      {
        label: "Average Score",
        value: `${averageScore}%`,
        icon: getIconString("flagPin", 32),
      },
      {
        label: "Questions Answered",
        value: totalQuestions,
        icon: getIconString("document", 32),
      },
      {
        label: "Correct Answers",
        value: totalCorrect,
        icon: getIconString("check", 32),
      },
    ];

    statCards.forEach((card) => {
      const cardElement = document.createElement("div");
      cardElement.className = "stat-card";
      cardElement.innerHTML = `
        <div class="stat-icon">${card.icon}</div>
        <div class="stat-value">${card.value}</div>
        <div class="stat-label">${card.label}</div>
      `;
      statsGrid.appendChild(cardElement);
    });

    // Performance trend indicator
    const trendIndicator = this.createPerformanceTrend(recentQuizzes);

    statsDiv.appendChild(statsGrid);
    statsDiv.appendChild(trendIndicator);

    return statsDiv;
  }

  /**
   * Create performance trend indicator
   */
  createPerformanceTrend(recentQuizzes) {
    const trendDiv = document.createElement("div");
    trendDiv.className = "performance-trend";

    if (recentQuizzes.length >= 2) {
      const latest = recentQuizzes[0];
      const previous = recentQuizzes[1];

      const latestScore = (latest.correct / latest.total) * 100;
      const previousScore = (previous.correct / previous.total) * 100;
      const improvement = latestScore - previousScore;

      const trendIcon =
        improvement > 0
          ? getIconString("chart", 16)
          : improvement < 0
          ? getIconString("chart", 16)
          : getIconString("arrowRight", 16);
      const trendText =
        improvement > 0
          ? "Improving"
          : improvement < 0
          ? "Needs Focus"
          : "Stable";
      const trendValue =
        improvement !== 0 ? `${Math.abs(improvement).toFixed(1)}%` : "";

      trendDiv.innerHTML = `
        <div class="trend-indicator">
          <span class="trend-icon" style="${
            improvement < 0 ? "transform: scaleY(-1);" : ""
          }">${trendIcon}</span>
          <span class="trend-text">${trendText}</span>
          <span class="trend-value">${trendValue}</span>
        </div>
      `;
    }

    return trendDiv;
  }

  /**
   * Create empty stats display for new users
   */
  createEmptyStatsDisplay() {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-stats-display";

    emptyDiv.innerHTML = `
      <div class="empty-stats-content">
        <div class="empty-stats-icon">${getIconString("chart", 48)}</div>
        <h3>Your Learning Journey Starts Here</h3>
        <p>Complete your first quiz to unlock detailed performance analytics!</p>
        <div class="stats-preview">
          <div class="preview-stat">
            <span class="preview-icon">${getIconString("flagPin", 16)}</span>
            <span class="preview-text">Track your accuracy</span>
          </div>
          <div class="preview-stat">
            <span class="preview-icon">${getIconString("chart", 16)}</span>
            <span class="preview-text">Monitor improvement</span>
          </div>
          <div class="preview-stat">
            <span class="preview-icon">${getIconString("trophy", 16)}</span>
            <span class="preview-text">Earn achievements</span>
          </div>
        </div>
      </div>
    `;

    return emptyDiv;
  }

  /**
   * Create quick actions panel for authenticated users
   */
  createQuickActionsPanel() {
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "quick-actions-panel";

    const actionsTitle = document.createElement("h4");
    actionsTitle.textContent = "Quick Actions";
    actionsTitle.className = "actions-title";

    const actionsGrid = document.createElement("div");
    actionsGrid.className = "actions-grid";

    const actions = [
      {
        text: "Continue Last Subject",
        icon: getIconString("play", 20),
        action: "continue-last",
      },
      {
        text: "Take Practice Test",
        icon: getIconString("pencil", 20),
        action: "practice-test",
      },
      {
        text: "Review Weak Areas",
        icon: getIconString("flagPin", 20),
        action: "review-weak",
      },
      {
        text: "Generate Questions",
        icon: getIconString("hal", 20),
        action: "generate",
      },
    ];

    actions.forEach((action) => {
      const actionBtn = document.createElement("button");
      actionBtn.className = "quick-action-btn";
      actionBtn.innerHTML = `
        <span class="action-icon">${action.icon}</span>
        <span class="action-text">${action.text}</span>
      `;
      actionBtn.dataset.action = action.action;
      actionsGrid.appendChild(actionBtn);
    });

    actionsDiv.appendChild(actionsTitle);
    actionsDiv.appendChild(actionsGrid);

    return actionsDiv;
  }

  /**
   * Create quiz mode selection showcase
   */
  createQuizModeSelectionSection() {
    const section = document.createElement("section");
    section.className = "quiz-mode-section";
    section.id = "quiz-modes";

    const sectionHeader = document.createElement("div");
    sectionHeader.className = "section-header";
    sectionHeader.innerHTML = `
      <h2>Choose Your Quiz Experience</h2>
      <p>Select the perfect mode for your learning style</p>
    `;

    const modesContainer = document.createElement("div");
    modesContainer.className = "quiz-modes-showcase";

    // Quiz mode cards
    const modes = [
      {
        id: "classic",
        name: "Classic Mode",
        icon: getIconString("book", 32),
        description: "maximal beau enchante",
        features: ["Elegant Design", "Classical Audio", "Refined Interface"],
        theme: "classic",
      },
      {
        id: "quiz-show",
        name: "Quiz Show Mode",
        icon: getIconString("trophy", 32),
        description: "Quiz Show Contestant",
        features: ["Retro Styling", "Game Show Sounds", "High Energy"],
        theme: "quiz-show",
      },
      {
        id: "friendly",
        name: "Friendly Mode",
        icon: getIconString("user", 32),
        description: "We serve em up one at a time",
        features: ["Sports Theme", "Friendly Interface", "Casual Vibes"],
        theme: "friendly",
      },
    ];

    modes.forEach((mode) => {
      const modeCard = this.createQuizModeCard(mode);
      modesContainer.appendChild(modeCard);
    });

    section.appendChild(sectionHeader);
    section.appendChild(modesContainer);
    this.container.appendChild(section);
  }

  /**
   * Create individual quiz mode card
   */
  createQuizModeCard(mode) {
    const card = document.createElement("div");
    card.className = `quiz-mode-card theme-${mode.theme}`;
    card.dataset.theme = mode.theme;

    card.innerHTML = `
      <div class="mode-header">
        <div class="mode-icon">${mode.icon}</div>
        <h3 class="mode-name">${mode.name}</h3>
      </div>
      <p class="mode-description">${mode.description}</p>
      <div class="mode-features">
        ${mode.features
          .map((feature) => `<span class="feature-tag">${feature}</span>`)
          .join("")}
      </div>
      <div class="mode-actions">
        <button class="btn-try-theme" data-theme="${
          mode.theme
        }">Try Theme</button>
        <button class="btn-start-quiz" data-mode="${
          mode.id
        }">Start Quiz</button>
      </div>
    `;

    return card;
  }

  /**
   * Create recent activity section
   */
  createRecentActivitySection() {
    const section = document.createElement("section");
    section.className = "recent-activity-section";
    section.id = "recent-activity";

    const sectionHeader = document.createElement("div");
    sectionHeader.className = "section-header";
    sectionHeader.innerHTML = `
      <h2>Recent Activity</h2>
      <p>Track your progress and quiz history</p>
    `;

    const activityContent = document.createElement("div");
    activityContent.className = "activity-content";

    if (this.statisticsData && this.statisticsData.history.length > 0) {
      const recentQuizzes = this.createRecentQuizzesList();
      const performanceChart = this.createMiniPerformanceChart();

      activityContent.appendChild(recentQuizzes);
      activityContent.appendChild(performanceChart);
    } else {
      const emptyActivity = this.createEmptyActivityDisplay();
      activityContent.appendChild(emptyActivity);
    }

    section.appendChild(sectionHeader);
    section.appendChild(activityContent);
    this.container.appendChild(section);
  }

  /**
   * Create recent quizzes list
   */
  createRecentQuizzesList() {
    const listContainer = document.createElement("div");
    listContainer.className = "recent-quizzes-list";

    const listHeader = document.createElement("h4");
    listHeader.textContent = "Recent Quizzes";

    const quizzesList = document.createElement("div");
    quizzesList.className = "quizzes-list";

    const recentQuizzes = this.statisticsData.history.slice(0, 5);

    recentQuizzes.forEach((quiz) => {
      const quizItem = document.createElement("div");
      quizItem.className = "quiz-item";

      const score = Math.round((quiz.correct / quiz.total) * 100);
      const scoreClass =
        score >= 70 ? "score-good" : score >= 50 ? "score-ok" : "score-poor";

      quizItem.innerHTML = `
        <div class="quiz-info">
          <div class="quiz-subject">${quiz.subject || "Mixed"}</div>
          <div class="quiz-date">${new Date(
            quiz.created_at,
          ).toLocaleDateString()}</div>
        </div>
        <div class="quiz-score ${scoreClass}">${score}%</div>
        <div class="quiz-details">${quiz.correct}/${quiz.total}</div>
      `;

      quizzesList.appendChild(quizItem);
    });

    listContainer.appendChild(listHeader);
    listContainer.appendChild(quizzesList);

    return listContainer;
  }

  /**
   * Create mini performance chart
   */
  createMiniPerformanceChart() {
    const chartContainer = document.createElement("div");
    chartContainer.className = "mini-performance-chart";

    const chartHeader = document.createElement("h4");
    chartHeader.textContent = "Performance Trend";

    const chartArea = document.createElement("div");
    chartArea.className = "chart-area";

    // Simple visualization using CSS
    const recentScores = this.statisticsData.history.slice(0, 10).reverse();
    const maxScore = 100;

    recentScores.forEach((quiz, index) => {
      const score = (quiz.correct / quiz.total) * 100;
      const bar = document.createElement("div");
      bar.className = "chart-bar";
      bar.style.height = `${(score / maxScore) * 100}%`;
      bar.title = `Quiz ${index + 1}: ${score.toFixed(1)}%`;
      chartArea.appendChild(bar);
    });

    chartContainer.appendChild(chartHeader);
    chartContainer.appendChild(chartArea);

    return chartContainer;
  }

  /**
   * Create empty activity display
   */
  createEmptyActivityDisplay() {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-activity-display";

    emptyDiv.innerHTML = `
      <div class="empty-activity-content">
        <div class="empty-activity-icon">${getIconString("chart", 48)}</div>
        <h3>No Activity Yet</h3>
        <p>Your quiz history and performance trends will appear here after completing quizzes.</p>
        <button class="btn-start-first-quiz">Take Your First Quiz</button>
      </div>
    `;

    return emptyDiv;
  }

  /**
   * Create study recommendations section
   */
  createStudyRecommendationsSection() {
    const section = document.createElement("section");
    section.className = "study-recommendations-section";
    section.id = "study-recommendations";

    const sectionHeader = document.createElement("div");
    sectionHeader.className = "section-header";
    sectionHeader.innerHTML = `
      <h2>Study Recommendations</h2>
      <p>Personalized suggestions based on your performance</p>
    `;

    const recommendationsContent = document.createElement("div");
    recommendationsContent.className = "recommendations-content";

    if (this.statisticsData && this.statisticsData.history.length > 0) {
      const recommendations = this.generateStudyRecommendations();
      recommendationsContent.appendChild(recommendations);
    } else {
      const emptyRecommendations = this.createEmptyRecommendationsDisplay();
      recommendationsContent.appendChild(emptyRecommendations);
    }

    section.appendChild(sectionHeader);
    section.appendChild(recommendationsContent);
    this.container.appendChild(section);
  }

  /**
   * Generate study recommendations based on user data
   */
  generateStudyRecommendations() {
    const recommendationsDiv = document.createElement("div");
    recommendationsDiv.className = "study-recommendations";

    // Analyze weak areas from quiz history
    const subjectPerformance = this.analyzeSubjectPerformance();
    const weakAreas = Object.entries(subjectPerformance)
      .filter(([subject, data]) => data.averageScore < 70)
      .sort((a, b) => a[1].averageScore - b[1].averageScore)
      .slice(0, 3);

    if (weakAreas.length > 0) {
      const weakAreasSection = this.createWeakAreasSection(weakAreas);
      recommendationsDiv.appendChild(weakAreasSection);
    }

    // Study streak recommendations
    const streakSection = this.createStudyStreakSection();
    recommendationsDiv.appendChild(streakSection);

    // Learning path suggestions
    const learningPathSection = this.createLearningPathSection();
    recommendationsDiv.appendChild(learningPathSection);

    return recommendationsDiv;
  }

  /**
   * Analyze subject performance from quiz history
   */
  analyzeSubjectPerformance() {
    const subjectData = {};

    this.statisticsData.history.forEach((quiz) => {
      const subject = quiz.subject || "Mixed";
      if (!subjectData[subject]) {
        subjectData[subject] = {
          totalQuizzes: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          averageScore: 0,
        };
      }

      subjectData[subject].totalQuizzes++;
      subjectData[subject].totalCorrect += quiz.correct;
      subjectData[subject].totalQuestions += quiz.total;
      subjectData[subject].averageScore =
        (subjectData[subject].totalCorrect /
          subjectData[subject].totalQuestions) *
        100;
    });

    return subjectData;
  }

  /**
   * Create weak areas section
   */
  createWeakAreasSection(weakAreas) {
    const section = document.createElement("div");
    section.className = "weak-areas-section";

    const header = document.createElement("h4");
    header.innerHTML = `${getIconString("flagPin", 20)} Areas for Improvement`;

    const areasList = document.createElement("div");
    areasList.className = "weak-areas-list";

    weakAreas.forEach(([subject, data]) => {
      const areaItem = document.createElement("div");
      areaItem.className = "weak-area-item";

      areaItem.innerHTML = `
        <div class="area-info">
          <div class="area-subject">${subject}</div>
          <div class="area-score">${data.averageScore.toFixed(1)}% average</div>
        </div>
        <button class="btn-practice-area" data-subject="${subject}">Practice</button>
      `;

      areasList.appendChild(areaItem);
    });

    section.appendChild(header);
    section.appendChild(areasList);

    return section;
  }

  /**
   * Create study streak section
   */
  createStudyStreakSection() {
    const section = document.createElement("div");
    section.className = "study-streak-section";

    const header = document.createElement("h4");
    header.innerHTML = `${getIconString("lightning", 20)} Study Streak`;

    const streakContent = document.createElement("div");
    streakContent.className = "streak-content";

    // Calculate current streak
    const currentStreak = this.calculateStudyStreak();

    streakContent.innerHTML = `
      <div class="streak-display">
        <div class="streak-number">${currentStreak}</div>
        <div class="streak-label">day${currentStreak !== 1 ? "s" : ""}</div>
      </div>
      <div class="streak-message">
        ${
          currentStreak === 0
            ? "Start your study streak today!"
            : currentStreak < 7
            ? "Keep it up! Consistency is key."
            : `Amazing streak! You're on fire! ${getIconString(
                "lightning",
                20,
              )}`
        }
      </div>
    `;

    section.appendChild(header);
    section.appendChild(streakContent);

    return section;
  }

  /**
   * Calculate study streak from quiz history
   */
  calculateStudyStreak() {
    if (!this.statisticsData.history.length) return 0;

    const today = new Date();
    const quizDates = this.statisticsData.history
      .map((quiz) => new Date(quiz.created_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let currentDate = new Date(today);

    for (const dateStr of quizDates) {
      const quizDate = new Date(dateStr);
      const diffDays = Math.floor(
        (currentDate - quizDate) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === streak) {
        streak++;
        currentDate = new Date(quizDate);
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  }

  /**
   * Create learning path section
   */
  createLearningPathSection() {
    const section = document.createElement("div");
    section.className = "learning-path-section";

    const header = document.createElement("h4");
    header.innerHTML = `${getIconString(
      "compass",
      20,
    )} Suggested Learning Path`;

    const pathContent = document.createElement("div");
    pathContent.className = "learning-path-content";

    const suggestions = [
      "Take a comprehensive practice exam",
      "Focus on constitutional law fundamentals",
      "Review contracts and torts integration",
      "Practice evidence and procedure questions",
    ];

    const pathList = document.createElement("ul");
    pathList.className = "learning-path-list";

    suggestions.forEach((suggestion) => {
      const listItem = document.createElement("li");
      listItem.className = "path-item";
      listItem.textContent = suggestion;
      pathList.appendChild(listItem);
    });

    pathContent.appendChild(pathList);
    section.appendChild(header);
    section.appendChild(pathContent);

    return section;
  }

  /**
   * Create empty recommendations display
   */
  createEmptyRecommendationsDisplay() {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-recommendations-display";

    emptyDiv.innerHTML = `
      <div class="empty-recommendations-content">
        <div class="empty-recommendations-icon">${getIconString(
          "flagPin",
          48,
        )}</div>
        <h3>Personalized Recommendations Coming Soon</h3>
        <p>Complete a few quizzes to unlock AI-powered study recommendations tailored to your performance.</p>
        <div class="recommendation-preview">
          <div class="preview-item">${getIconString(
            "chart",
            16,
          )} Performance Analysis</div>
          <div class="preview-item">${getIconString(
            "flagPin",
            16,
          )} Weak Area Identification</div>
          <div class="preview-item">${getIconString(
            "compass",
            16,
          )} Custom Learning Paths</div>
        </div>
      </div>
    `;

    return emptyDiv;
  }

  /**
   * Create question generator section
   */
  createQuestionGeneratorSection() {
    const section = document.createElement("section");
    section.className = "question-generator-section";
    section.id = "question-generator";

    const sectionHeader = document.createElement("div");
    sectionHeader.className = "section-header";
    sectionHeader.innerHTML = `
      <h2>AI Question Generator</h2>
      <p>Create custom questions with artificial intelligence</p>
    `;

    // Integrate existing question generator
    const generatorContainer = document.createElement("div");
    generatorContainer.className = "generator-container";

    // Create simplified version of question generator for homepage
    const generatorContent = this.createQuestionGeneratorContent();
    generatorContainer.appendChild(generatorContent);

    section.appendChild(sectionHeader);
    section.appendChild(generatorContainer);
    this.container.appendChild(section);
  }

  /**
   * Create question generator content
   */
  createQuestionGeneratorContent() {
    const content = document.createElement("div");
    content.className = "generator-content";

    content.innerHTML = `
      <div class="generator-intro">
        <div class="generator-icon">${getIconString("hal", 48)}</div>
        <h4>Generate Custom Questions</h4>
        <p>Use AI to create personalized law questions based on specific topics or your weak areas.</p>
      </div>
      
      <div class="generator-features">
        <div class="feature-item">
          <span class="feature-icon">${getIconString("lightning", 24)}</span>
          <span class="feature-text">Instant AI Generation</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">${getIconString("flagPin", 24)}</span>
          <span class="feature-text">Topic-Specific Questions</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">${getIconString("book", 24)}</span>
          <span class="feature-text">Comprehensive Explanations</span>
        </div>
      </div>
      
      <div class="generator-actions">
        <button class="btn-primary btn-generate-questions">Generate Questions</button>
        <button class="btn-secondary btn-view-generator">Advanced Generator</button>
      </div>
    `;

    return content;
  }

  /**
   * Add section navigation for smooth scrolling
   */
  addSectionNavigation() {
    const navigation = document.createElement("nav");
    navigation.className = "homepage-navigation";

    const navItems = [
      {
        id: "statistics-hero",
        label: "Statistics",
        icon: getIconString("chart", 16),
      },
      {
        id: "quiz-modes",
        label: "Quiz Modes",
        icon: getIconString("moon", 16),
      },
      {
        id: "recent-activity",
        label: "Activity",
        icon: getIconString("chart", 16),
      },
      {
        id: "study-recommendations",
        label: "Recommendations",
        icon: getIconString("flagPin", 16),
      },
      {
        id: "question-generator",
        label: "Generator",
        icon: getIconString("hal", 16),
      },
    ];

    const navList = document.createElement("ul");
    navList.className = "nav-list";

    navItems.forEach((item) => {
      const navItem = document.createElement("li");
      navItem.className = "nav-item";

      const navLink = document.createElement("a");
      navLink.href = `#${item.id}`;
      navLink.className = "nav-link";
      navLink.innerHTML = `
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      `;

      navItem.appendChild(navLink);
      navList.appendChild(navItem);
    });

    navigation.appendChild(navList);
    this.container.appendChild(navigation);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    console.log(
      "[DEBUG] Binding homepage events, container:",
      !!this.container,
    );

    // Quiz start buttons
    this.container.addEventListener("click", (e) => {
      if (e.target.matches(".btn-start-quiz")) {
        console.log("[DEBUG] Quiz start button clicked");
        const mode = e.target.dataset.mode;
        console.log("[DEBUG] Quiz mode:", mode);
        this.startQuizWithMode(mode);
      }
    });

    // Smooth scroll navigation
    this.container.addEventListener("click", (e) => {
      if (e.target.matches(".nav-link")) {
        e.preventDefault();
        const targetId = e.target.getAttribute("href").substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }

      // Theme switching
      if (e.target.matches(".btn-try-theme")) {
        const theme = e.target.dataset.theme;
        if (window.themeManager) {
          window.themeManager.applyTheme(theme);
        }
      }

      // Quiz starting
      if (e.target.matches(".btn-start-quiz")) {
        const mode = e.target.dataset.mode;
        this.startQuizWithMode(mode);
      }

      // Quick actions
      if (e.target.matches(".quick-action-btn")) {
        const action = e.target.dataset.action;
        this.handleQuickAction(action);
      }

      // Generator actions
      if (e.target.matches(".btn-generate-questions")) {
        this.showQuestionGenerator();
      }

      if (e.target.matches(".btn-view-generator")) {
        window.location.hash = "generator";
      }

      // Practice buttons
      if (e.target.matches(".btn-practice-area")) {
        const subject = e.target.dataset.subject;
        this.startPracticeQuiz(subject);
      }

      // First quiz button
      if (e.target.matches(".btn-start-first-quiz")) {
        this.startFirstQuiz();
      }
    });
  }

  /**
   * Start quiz with specific mode
   */
  startQuizWithMode(mode) {
    console.log("[DEBUG] startQuizWithMode called with mode:", mode);
    const defaultOptions = {
      n: 9,
      subject: "",
      questionType: "mix",
      timer: 1.8,
      quizMode: mode,
      hideAnswersUntilEnd: false,
    };

    console.log("[DEBUG] Calling onStartQuiz with options:", defaultOptions);
    console.log("[DEBUG] onStartQuiz is:", typeof this.onStartQuiz);

    if (typeof this.onStartQuiz !== "function") {
      console.error("[DEBUG] onStartQuiz is not a function!");
      return;
    }

    this.onStartQuiz(defaultOptions);
  }

  /**
   * Handle quick actions
   */
  handleQuickAction(action) {
    switch (action) {
      case "continue-last":
        this.continueLastSubject();
        break;
      case "practice-test":
        this.startPracticeTest();
        break;
      case "review-weak":
        this.reviewWeakAreas();
        break;
      case "generate":
        this.showQuestionGenerator();
        break;
    }
  }

  /**
   * Continue with last subject
   */
  continueLastSubject() {
    if (this.statisticsData && this.statisticsData.history.length > 0) {
      const lastQuiz = this.statisticsData.history[0];
      const options = {
        n: 9,
        subject: lastQuiz.subject || "",
        questionType: "mix",
        timer: 1.8,
        hideAnswersUntilEnd: false,
      };
      this.onStartQuiz(options);
    }
  }

  /**
   * Start practice test
   */
  startPracticeTest() {
    const options = {
      n: 25,
      subject: "",
      questionType: "mix",
      timer: 1.8,
      hideAnswersUntilEnd: false,
    };
    this.onStartQuiz(options);
  }

  /**
   * Review weak areas
   */
  reviewWeakAreas() {
    if (this.statisticsData && this.statisticsData.history.length > 0) {
      const subjectPerformance = this.analyzeSubjectPerformance();
      const weakestSubject = Object.entries(subjectPerformance).sort(
        (a, b) => a[1].averageScore - b[1].averageScore,
      )[0];

      if (weakestSubject) {
        this.startPracticeQuiz(weakestSubject[0]);
      }
    }
  }

  /**
   * Show question generator
   */
  showQuestionGenerator() {
    this.onGenerateQuestions();
  }

  /**
   * Start practice quiz for specific subject
   */
  startPracticeQuiz(subject) {
    const options = {
      n: 9,
      subject: subject !== "Mixed" ? subject : "",
      questionType: "mix",
      timer: 1.8,
      hideAnswersUntilEnd: false,
    };
    this.onStartQuiz(options);
  }

  /**
   * Start first quiz for new users
   */
  startFirstQuiz() {
    const options = {
      n: 9,
      subject: "",
      questionType: "mix",
      timer: 1.8,
      hideAnswersUntilEnd: false,
    };
    this.onStartQuiz(options);
  }

  /**
   * Refresh homepage data
   */
  async refresh() {
    await this.loadUserData();
    this.container.innerHTML = "";
    this.createHomepageStructure();
    this.bindEvents();
  }

  /**
   * Initialize performance optimizations
   */
  initializePerformanceOptimizations() {
    // Setup lazy loading for sections
    const sections = this.container.querySelectorAll("section");
    sections.forEach((section, index) => {
      this.lazyLoader.observe(section, section.id || `section-${index}`);
    });

    // Setup responsive layout changes
    this.layoutManager.addListener((breakpoint) => {
      this.handleBreakpointChange(breakpoint);
    });

    // Setup theme optimization
    window.addEventListener("themeChanged", (event) => {
      this.themeOptimizer.switchTheme(event.detail.theme, sections);
    });

    // Mark render complete
    requestAnimationFrame(() => {
      this.performanceMonitor.markRenderComplete();
    });

    // Setup first interaction tracking
    document.addEventListener(
      "click",
      () => {
        this.performanceMonitor.markFirstInteraction();
      },
      { once: true },
    );
  }

  /**
   * Handle breakpoint changes
   */
  handleBreakpointChange(breakpoint) {
    // Update layout classes
    this.container.classList.remove(
      "layout-mobile",
      "layout-tablet",
      "layout-desktop",
    );
    this.container.classList.add(`layout-${breakpoint}`);

    // Adjust navigation visibility
    const navigation = this.container.querySelector(".homepage-navigation");
    if (navigation) {
      navigation.style.display = breakpoint === "mobile" ? "none" : "block";
    }

    // Update grid layouts
    const grids = this.container.querySelectorAll(
      ".stats-grid, .actions-grid, .quiz-modes-showcase",
    );
    grids.forEach((grid) => {
      grid.classList.remove("grid-mobile", "grid-tablet", "grid-desktop");
      grid.classList.add(`grid-${breakpoint}`);
    });
  }

  /**
   * Refresh homepage data and update display
   */
  async refresh() {
    try {
      // Clear cache for fresh data
      const userId = this.getUserId();
      this.dataCache.delete(`user_data_${userId}`);

      await this.loadUserData();
      this.container.innerHTML = "";
      this.createHomepageStructure();
      this.bindEvents();
      this.initializePerformanceOptimizations();
    } catch (error) {
      console.error("Failed to refresh homepage:", error);
      this.errorBoundary.handleError({ error, context: "homepage_refresh" });
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.lazyLoader.cleanup();
    this.layoutManager.cleanup();
    this.dataCache.clear();
    this.performanceMonitor = null;
  }

  /**
   * Get the homepage container
   */
  getContainer() {
    return this.container;
  }
}

/**
 * Create homepage instance
 */
export async function createHomepage(onStartQuiz, onGenerateQuestions) {
  console.log("[DEBUG] createHomepage called with callbacks:", {
    hasOnStartQuiz: typeof onStartQuiz === "function",
    hasOnGenerateQuestions: typeof onGenerateQuestions === "function",
  });

  const homepage = new Homepage(onStartQuiz, onGenerateQuestions);
  const initialized = await homepage.init();

  console.log("[DEBUG] Homepage initialization complete:", {
    hasContainer: !!homepage.container,
    hasOnStartQuiz: typeof homepage.onStartQuiz === "function",
  });

  return initialized;
}
