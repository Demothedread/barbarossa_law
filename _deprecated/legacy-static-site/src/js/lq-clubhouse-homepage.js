/**
 * BARBAROSSA'S CRATER GOLF CLUB - CLUBHOUSE
 * "Hostis Humanis Generis"
 *
 * An exclusive lunar resort for discerning space pirates.
 * Members Only. No Earthlings.
 */

import { fetchSubjects, fetchSubtopicStats, getQuizHistory } from "./lq-api.js";
import { authManager } from "./lq-auth.js";
import {
  AccessibilityManager,
  DataCacheManager,
  ErrorBoundary,
  LazyLoadManager,
  PerformanceMonitor,
  ResponsiveLayoutManager,
  ThemeOptimizer,
} from "./lq-homepage-utils.js";
import { getIconString } from "./lunaire-icons.js";

export class Homepage {
  constructor(onStartQuiz, onGenerateQuestions) {
    console.log(
      "[DEBUG] Clubhouse Homepage constructor - onStartQuiz type:",
      typeof onStartQuiz,
    );
    this.onStartQuiz = onStartQuiz;
    this.onGenerateQuestions = onGenerateQuestions;
    this.container = null;
    this.isAuthenticated = false;
    this.userData = null;
    this.statisticsData = null;
    this.subjects = [];

    // Quiz setup state (for Mission Briefing)
    this.selectedSubject = "";
    this.selectedQuestionType = "mix";
    this.selectedQuestionCount = 9;
    this.selectedQuizTheme = "pirate"; // pirate, quiz-show, or baseball

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
      "[DEBUG] Clubhouse Homepage init starting, onStartQuiz is:",
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
      await this.loadSubjects();

      console.log("[DEBUG] Creating clubhouse structure");
      this.createHomepageStructure();
      console.log("[DEBUG] Binding events");
      this.bindEvents();
      this.initializePerformanceOptimizations();

      console.log(
        "[DEBUG] Clubhouse Homepage init complete, onStartQuiz is:",
        typeof this.onStartQuiz,
      );

      this.performanceMonitor.markLoadComplete();

      return this.container;
    } catch (error) {
      console.error("Failed to initialize clubhouse homepage:", error);
      this.errorBoundary.handleError({
        error,
        context: "clubhouse_homepage_init",
      });
      throw error;
    }
  }

  /**
   * Load subjects for course map
   */
  async loadSubjects() {
    try {
      const response = await fetchSubjects();
      this.subjects = response.subjects || [];
    } catch (error) {
      console.warn("Failed to load subjects:", error);
      this.subjects = [];
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
        const historyData = await getQuizHistory(userId);

        let subtopicData = {};
        try {
          subtopicData = await fetchSubtopicStats(userId);
        } catch (subtopicError) {
          console.warn("Failed to load subtopic stats:", subtopicError);
        }

        this.statisticsData = {
          history: historyData.history || [],
          stats: historyData.stats || {},
          analytics: historyData.analytics || {},
          subtopics: subtopicData,
          userId: userId,
        };

        this.dataCache.set(cacheKey, this.statisticsData);
      }
    } catch (error) {
      console.warn("Failed to load user data:", error);
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
   */
  createHomepageStructure() {
    this.container = document.createElement("div");
    this.container.className =
      "homepage-container lunaire-clubhouse-homepage lunaire-theme";

    // Hero Section
    const hero = this.createClubhouseHero();
    this.container.appendChild(hero);

    // Trophy Case (Stats)
    const trophyCase = this.createTrophyCase();
    this.container.appendChild(trophyCase);

    // Tee Time Booking (Quiz Setup)
    const teeTime = this.createTeeTimeBooking();
    this.container.appendChild(teeTime);

    // Course Map (Subject Selection)
    const courseMap = this.createCourseMap();
    this.container.appendChild(courseMap);

    // Recent Rounds (History as Scorecards)
    const recentRounds = this.createRecentRounds();
    this.container.appendChild(recentRounds);

    // Club Announcements
    const announcements = this.createClubAnnouncements();
    this.container.appendChild(announcements);

    // Club Fine Print
    const finePrint = this.createClubFinePrint();
    this.container.appendChild(finePrint);
  }

  /**
   * Create the Mess Hall Hero Section
   */
  createClubhouseHero() {
    const section = document.createElement("section");
    section.className = "clubhouse-hero card-lunaire--space";
    section.id = "clubhouse-hero";

    const memberName =
      this.isAuthenticated && this.userData?.name
        ? this.userData.name
        : "Member";

    section.innerHTML = `
      <div class="hero-content">
        <div class="club-crest">
          ${getIconString("pirateSkull", 64)}
        </div>
        
        <h1 class="club-title lunaire-display">Barbarossa's Crater</h1>
        <p class="club-motto lunaire-hand">Hostis Humanis Generis</p>
        
        <div class="member-greeting">
          <span class="greeting-text">Welcome, ${memberName}</span>
        </div>
        
        <div class="hero-cta">
          <button class="btn-lunaire btn-lunaire--primary btn-lunaire--lg btn-tee-off" data-action="quick-start">
            ${getIconString("play", 24)}
            <span>Tee Off</span>
          </button>
          <button class="btn-lunaire btn-lunaire--tertiary btn-pro-shop" data-action="pro-shop">
            ${getIconString("treasure", 20)}
            <span>Pro Shop</span>
          </button>
        </div>
      </div>
    `;

    return section;
  }

  /**
   * Create The Captain's Log (Statistics Display)
   */
  createTrophyCase() {
    const section = document.createElement("section");
    section.className = "trophy-case-section";
    section.id = "trophy-case";

    const sectionHeader = document.createElement("div");
    sectionHeader.className = "section-header-lunaire";
    sectionHeader.innerHTML = `
      <div class="header-icon">${getIconString("chart", 32)}</div>
      <h2>Member Card</h2>
      <p class="header-subtitle">Your standing at the Club</p>
    `;

    const trophyContent = document.createElement("div");
    trophyContent.className = "trophy-content";

    if (this.statisticsData && this.statisticsData.history.length > 0) {
      trophyContent.appendChild(this.createTrophyStats());
    } else {
      trophyContent.appendChild(this.createEmptyTrophyCase());
    }

    section.appendChild(sectionHeader);
    section.appendChild(trophyContent);

    return section;
  }

  /**
   * Create trophy statistics display
   */
  createTrophyStats() {
    const statsDiv = document.createElement("div");
    statsDiv.className = "trophy-stats-grid";

    const { history } = this.statisticsData;

    const totalRounds = history.length;
    const totalCorrect = history.reduce((sum, quiz) => sum + quiz.correct, 0);
    const totalQuestions = history.reduce((sum, quiz) => sum + quiz.total, 0);
    const averageScore =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;
    const bestRound = history.reduce((best, quiz) => {
      const score = (quiz.correct / quiz.total) * 100;
      return score > best ? score : best;
    }, 0);

    // Calculate "infamy" (score mapped to rank)
    const handicap = Math.max(0, Math.round(36 - averageScore * 0.36));

    const trophyCards = [
      {
        label: "Rounds",
        value: totalRounds,
        icon: "play",
        color: "avocado",
        detail: "",
      },
      {
        label: "Handicap",
        value: handicap,
        icon: "flagPin",
        color: "gold",
        detail: "",
      },
      {
        label: "Accuracy",
        value: `${averageScore}%`,
        icon: "telescope",
        color: "sienna",
        detail: "",
      },
      {
        label: "Best",
        value: `${Math.round(bestRound)}%`,
        icon: "star",
        color: "teal",
        detail: "",
      },
    ];

    trophyCards.forEach((card) => {
      const cardElement = document.createElement("div");
      cardElement.className = `trophy-card card-lunaire trophy-card--${card.color}`;
      cardElement.innerHTML = `
        <div class="trophy-icon">${getIconString(card.icon, 36)}</div>
        <div class="trophy-value lunaire-mono">${card.value}</div>
        <div class="trophy-label">${card.label}</div>
        <div class="trophy-detail">${card.detail}</div>
      `;
      statsDiv.appendChild(cardElement);
    });

    // Performance trend
    const trendDiv = this.createPerformanceTrend(history.slice(0, 5));
    statsDiv.appendChild(trendDiv);

    return statsDiv;
  }

  /**
   * Get rank title based on score
   */
  getRankTitle(score) {
    if (score >= 90) return "Holo-Legend";
    if (score >= 80) return "Void Captain";
    if (score >= 70) return "Deck Officer";
    if (score >= 60) return "Ensign";
    if (score >= 50) return "Bilge Rat";
    return "Mutineer";
  }

  /**
   * Get handicap rating description
   */
  getHandicapRating(handicap) {
    // Deprecated for rank title, keeping for safety
    return "Fleet Status";
  }

  /**
   * Get score rating description
   */
  getScoreRating(score) {
    if (score >= 90) return "Legendary Status";
    if (score >= 80) return "Captain's Standard";
    if (score >= 70) return "Officer Material";
    if (score >= 60) return "Swabbing Decks";
    return "Walk the Plank";
  }

  /**
   * Create performance trend indicator
   */
  createPerformanceTrend(recentRounds) {
    const trendDiv = document.createElement("div");
    trendDiv.className =
      "performance-trend card-lunaire card-lunaire--houndstooth";

    if (recentRounds.length >= 2) {
      const latest = recentRounds[0];
      const previous = recentRounds[1];

      const latestScore = (latest.correct / latest.total) * 100;
      const previousScore = (previous.correct / previous.total) * 100;
      const improvement = latestScore - previousScore;

      const isImproving = improvement > 0;
      const trendIcon = isImproving ? "arrowRight" : "arrowLeft";
      const trendText = isImproving
        ? "Systems Upgraded"
        : improvement < 0
        ? "Systems Critical"
        : "Orbit Stable";
      const trendValue =
        improvement !== 0 ? `${Math.abs(improvement).toFixed(1)}%` : "";

      trendDiv.innerHTML = `
        <div class="trend-header">
          ${getIconString("chart", 24)}
          <span>Recent Form</span>
        </div>
        <div class="trend-indicator ${isImproving ? "trend-up" : "trend-down"}">
          <span class="trend-icon">${getIconString(trendIcon, 28)}</span>
          <span class="trend-text">${trendText}</span>
          ${
            trendValue
              ? `<span class="trend-value lunaire-mono">${trendValue}</span>`
              : ""
          }
        </div>
      `;
    } else {
      trendDiv.innerHTML = `
        <div class="trend-header">
          ${getIconString("chart", 24)}
          <span>Recent Form</span>
        </div>
        <div class="trend-placeholder">
          <p>Complete more rounds to track your form.</p>
        </div>
      `;
    }

    return trendDiv;
  }

  /**
   * Create empty log for new scoundrels
   */
  createEmptyTrophyCase() {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-trophy-case card-lunaire card-lunaire--argyle";

    emptyDiv.innerHTML = `
      <div class="empty-content">
        <div class="empty-icon">${getIconString("pirateSkull", 64)}</div>
        <h3>No Rounds Played</h3>
        <p class="lunaire-hand">Your first tee time awaits.</p>
        <button class="btn-lunaire btn-lunaire--gold btn-first-round" data-action="first-round">
          ${getIconString("play", 20)}
          <span>Tee Off</span>
        </button>
      </div>
    `;

    return emptyDiv;
  }

  /**
   * Create Mission Briefing (Quiz Setup)
   */
  createTeeTimeBooking() {
    const section = document.createElement("section");
    section.className = "tee-time-section";
    section.id = "tee-time";

    section.innerHTML = `
      <div class="section-header-lunaire">
        <div class="header-icon">${getIconString("compass", 32)}</div>
        <h2>Tee Time</h2>
        <p class="header-subtitle">Book your round</p>
      </div>
      
      <div class="tee-time-booking card-lunaire card-lunaire--plaid">
        <div class="booking-form">
          <div class="booking-row">
            <label class="booking-label">
              ${getIconString("telescope", 20)}
              <span>Subject</span>
            </label>
            <select class="select-lunaire input-lunaire" id="subject-select">
              <option value="">All Subjects</option>
              ${this.subjects
                .map(
                  (subject) => `<option value="${subject}">${subject}</option>`,
                )
                .join("")}
            </select>
          </div>
          
          <div class="booking-row">
            <label class="booking-label">
              ${getIconString("golfBall", 20)}
              <span>Question Type</span>
            </label>
            <div class="radio-group">
              <label class="radio-lunaire ${
                this.selectedQuestionType === "mix" ? "selected" : ""
              }">
                <input type="radio" name="questionType" value="mix" ${
                  this.selectedQuestionType === "mix" ? "checked" : ""
                }>
                <span class="radio-label">Mix</span>
                <span class="radio-hint">MBE + AI</span>
              </label>
              <label class="radio-lunaire ${
                this.selectedQuestionType === "mbe" ? "selected" : ""
              }">
                <input type="radio" name="questionType" value="mbe" ${
                  this.selectedQuestionType === "mbe" ? "checked" : ""
                }>
                <span class="radio-label">MBE</span>
                <span class="radio-hint">Real questions</span>
              </label>
              <label class="radio-lunaire ${
                this.selectedQuestionType === "generated" ? "selected" : ""
              }">
                <input type="radio" name="questionType" value="generated" ${
                  this.selectedQuestionType === "generated" ? "checked" : ""
                }>
                <span class="radio-label">AI</span>
                <span class="radio-hint">Generated</span>
              </label>
            </div>
          </div>
          
          <div class="booking-row">
            <label class="booking-label">
              ${getIconString("lightning", 20)}
              <span>Holes</span>
            </label>
            <div class="holes-selector">
              ${[9, 18]
                .map(
                  (n) => `
                <button class="hole-btn ${
                  this.selectedQuestionCount === n ? "selected" : ""
                }" data-count="${n}">
                  ${n}
                </button>
              `,
                )
                .join("")}
            </div>
            <div class="holes-hint lunaire-hand">
              ${this.getHolesHint(this.selectedQuestionCount)}
            </div>
          </div>
          
          <div class="booking-row">
            <label class="booking-label">
              ${getIconString("star", 20)}
              <span>Mode</span>
            </label>
            <div class="radio-group">
              <label class="radio-lunaire ${
                this.selectedQuizTheme === "pirate" ? "selected" : ""
              }">
                <input type="radio" name="quizTheme" value="pirate" ${
                  this.selectedQuizTheme === "pirate" ? "checked" : ""
                }>
                <span class="radio-label">Standard</span>
                <span class="radio-hint">Timed</span>
              </label>
              <label class="radio-lunaire ${
                this.selectedQuizTheme === "quiz-show" ? "selected" : ""
              }">
                <input type="radio" name="quizTheme" value="quiz-show" ${
                  this.selectedQuizTheme === "quiz-show" ? "checked" : ""
                }>
                <span class="radio-label">Quiz Show</span>
                <span class="radio-hint">Retro</span>
              </label>
              <label class="radio-lunaire ${
                this.selectedQuizTheme === "baseball" ? "selected" : ""
              }">
                <input type="radio" name="quizTheme" value="baseball" ${
                  this.selectedQuizTheme === "baseball" ? "checked" : ""
                }>
                <span class="radio-label">Practice</span>
                <span class="radio-hint">Untimed</span>
              </label>
            </div>
          </div>
          
          <div class="booking-actions">
            <button class="btn-lunaire btn-lunaire--primary btn-lunaire--lg btn-book-tee-time" data-action="book-tee-time">
              ${getIconString("play", 24)}
              <span>Tee Off</span>
            </button>
            <button class="btn-lunaire btn-lunaire--secondary btn-generate-course" data-action="generate-questions">
              ${getIconString("hal", 20)}
              <span>Custom</span>
            </button>
          </div>
        </div>
        
        <div class="booking-summary card-lunaire">
          <h4>Your Round</h4>
          <div class="summary-details">
            <div class="summary-row">
              <span>Subject:</span>
              <span class="summary-value" id="summary-course">${
                this.selectedSubject || "All"
              }</span>
            </div>
            <div class="summary-row">
              <span>Type:</span>
              <span class="summary-value" id="summary-ball">${this.getQuestionTypeLabel(
                this.selectedQuestionType,
              )}</span>
            </div>
            <div class="summary-row">
              <span>Holes:</span>
              <span class="summary-value" id="summary-holes">${
                this.selectedQuestionCount
              }</span>
            </div>
            <div class="summary-row">
              <span>Mode:</span>
              <span class="summary-value" id="summary-theme">${this.getQuizThemeLabel(
                this.selectedQuizTheme,
              )}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    return section;
  }

  /**
   * Get holes hint based on count
   */
  getHolesHint(count) {
    const hints = {
      9: "Front nine",
      18: "Full round",
    };
    return hints[count] || "";
  }

  /**
   * Get question type label
   */
  getQuestionTypeLabel(type) {
    const labels = {
      mix: "Mix",
      mbe: "MBE",
      generated: "AI",
    };
    return labels[type] || "Mix";
  }

  /**
   * Get quiz theme label
   */
  getQuizThemeLabel(theme) {
    const labels = {
      pirate: "Standard",
      "quiz-show": "Quiz Show",
      baseball: "Practice",
    };
    return labels[theme] || "Standard";
  }

  /**
   * Create Star Chart (Subject Breakdown)
   */
  createCourseMap() {
    const section = document.createElement("section");
    section.className = "course-map-section";
    section.id = "course-map";

    const sectionHeader = document.createElement("div");
    sectionHeader.className = "section-header-lunaire";
    sectionHeader.innerHTML = `
      <div class="header-icon">${getIconString("earth", 32)}</div>
      <h2>Course</h2>
      <p class="header-subtitle">Select a subject</p>
    `;

    const courseGrid = document.createElement("div");
    courseGrid.className = "course-grid";

    // Subject icons mapping
    const subjectIcons = {
      "Civil Procedure": "document",
      "Constitutional Law": "book",
      Contracts: "pencil",
      "Criminal Law": "pirateSkull",
      "Criminal Procedure": "pirateSkull",
      Evidence: "telescope",
      Property: "clubhouse",
      Torts: "warning",
      "Business Associations": "treasure",
      "Community Property": "user",
      "Professional Responsibility": "star",
      Remedies: "check",
      "Wills and Trusts": "document",
      default: "flagPin",
    };

    // Get performance data per subject
    const subjectPerformance = this.analyzeSubjectPerformance();

    this.subjects.forEach((subject) => {
      const iconName = subjectIcons[subject] || subjectIcons["default"];
      const perf = subjectPerformance[subject];
      const hasData = perf && perf.totalQuizzes > 0;
      const score = hasData ? Math.round(perf.averageScore) : null;
      const par = this.getSubjectPar(score);
      const rankTitle = this.getRankTitle(score || 0);

      const card = document.createElement("div");
      card.className = `course-card card-lunaire ${hasData ? "has-data" : ""}`;
      card.dataset.subject = subject;

      card.innerHTML = `
        <div class="course-icon">${getIconString(iconName, 28)}</div>
        <div class="course-name">${subject}</div>
        ${
          hasData
            ? `
          <div class="course-score">
            <span class="score-value lunaire-mono">${score}%</span>
            <span class="score-par ${par.class}">${rankTitle}</span>
          </div>
          <div class="course-rounds lunaire-hand">${perf.totalQuizzes} raid${
                perf.totalQuizzes !== 1 ? "s" : ""
              }</div>
        `
            : `
          <div class="course-unplayed">Unexplored Sector</div>
        `
        }
        <button class="btn-play-course btn-lunaire btn-lunaire--sm btn-lunaire--tertiary" data-subject="${subject}">
          ${getIconString("play", 16)} Play
        </button>
      `;

      courseGrid.appendChild(card);
    });

    section.appendChild(sectionHeader);
    section.appendChild(courseGrid);

    return section;
  }

  /**
   * Get par rating for a subject score
   */
  getSubjectPar(score) {
    if (score === null) return { label: "", class: "" };
    if (score >= 90) return { label: "Eagle", class: "score--eagle" };
    if (score >= 80) return { label: "Birdie", class: "score--birdie" };
    if (score >= 70) return { label: "Par", class: "score--par" };
    if (score >= 60) return { label: "Bogey", class: "score--bogey" };
    return { label: "Double", class: "score--double" };
  }

  /**
   * Analyze subject performance from quiz history
   */
  analyzeSubjectPerformance() {
    const subjectData = {};

    if (!this.statisticsData?.history) return subjectData;

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
   * Create Recent Rounds (History as Scorecards)
   */
  createRecentRounds() {
    const section = document.createElement("section");
    section.className = "recent-rounds-section";
    section.id = "recent-rounds";

    const sectionHeader = document.createElement("div");
    sectionHeader.className = "section-header-lunaire";
    sectionHeader.innerHTML = `
      <div class="header-icon">${getIconString("document", 32)}</div>
      <h2>Recent Rounds</h2>
      <p class="header-subtitle">Your scorecards</p>
    `;

    const roundsContent = document.createElement("div");
    roundsContent.className = "rounds-content";

    if (this.statisticsData && this.statisticsData.history.length > 0) {
      roundsContent.appendChild(this.createScorecardList());
    } else {
      roundsContent.appendChild(this.createEmptyRounds());
    }

    section.appendChild(sectionHeader);
    section.appendChild(roundsContent);

    return section;
  }

  /**
   * Create scorecard list for recent rounds
   */
  createScorecardList() {
    const listContainer = document.createElement("div");
    listContainer.className = "scorecard-list";

    const recentRounds = this.statisticsData.history.slice(0, 6);

    recentRounds.forEach((quiz, index) => {
      const score = Math.round((quiz.correct / quiz.total) * 100);
      const par = this.getSubjectPar(score);
      const date = new Date(quiz.created_at);
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== new Date().getFullYear()
            ? "numeric"
            : undefined,
      });

      const card = document.createElement("div");
      card.className = `scorecard-mini card-lunaire ${par.class}`;

      // Map par label to rank title
      const rankTitle = this.getRankTitle(score);

      card.innerHTML = `
        <div class="scorecard-header">
          <span class="scorecard-round">Round ${
            this.statisticsData.history.length - index
          }</span>
          <span class="scorecard-date lunaire-mono">${formattedDate}</span>
        </div>
        <div class="scorecard-body">
          <div class="scorecard-course">
            ${getIconString("flagPin", 20)}
            <span>${quiz.subject || "All"}</span>
          </div>
          <div class="scorecard-result">
            <span class="result-score lunaire-mono">${quiz.correct}/${
        quiz.total
      }</span>
            <span class="result-percent ${par.class}">${score}%</span>
          </div>
        </div>
        <div class="scorecard-footer">
          <button class="btn-replay btn-lunaire btn-lunaire--sm btn-lunaire--tertiary" data-subject="${
            quiz.subject || ""
          }">
            ${getIconString("play", 14)} Replay
          </button>
        </div>
      `;

      listContainer.appendChild(card);
    });

    // Archivist link
    if (this.statisticsData.history.length > 6) {
      const backNineLink = document.createElement("div");
      backNineLink.className = "back-nine-link";
      backNineLink.innerHTML = `
        <button class="btn-lunaire btn-lunaire--tertiary btn-back-nine" data-action="back-nine">
          ${getIconString("arrowRight", 16)}
          <span>View All (${this.statisticsData.history.length - 6} more)</span>
        </button>
      `;
      listContainer.appendChild(backNineLink);
    }

    return listContainer;
  }

  /**
   * Create empty rounds display
   */
  createEmptyRounds() {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-rounds card-lunaire card-lunaire--houndstooth";

    emptyDiv.innerHTML = `
      <div class="empty-content">
        <div class="empty-icon">${getIconString("document", 48)}</div>
        <h3>No Rounds Yet</h3>
        <button class="btn-lunaire btn-lunaire--secondary btn-first-round" data-action="first-round">
          ${getIconString("play", 18)}
          <span>Tee Off</span>
        </button>
      </div>
    `;

    return emptyDiv;
  }

  /**
   * Create Fleet Comms section
   */
  createClubAnnouncements() {
    const section = document.createElement("section");
    section.className = "announcements-section";
    section.id = "announcements";

    section.innerHTML = `
      <div class="section-header-lunaire">
        <div class="header-icon">${getIconString("lightning", 32)}</div>
        <h2>Club News</h2>
      </div>
      
      <div class="announcements-grid">
        <div class="announcement-card card-lunaire card-lunaire--argyle">
          <div class="announcement-icon">${getIconString("hal", 28)}</div>
          <h4>Custom Questions</h4>
          <p>AI-generated practice on your weak areas.</p>
          <button class="btn-lunaire btn-lunaire--tertiary btn-lunaire--sm btn-announcement" data-action="generate-questions">
            Generate
          </button>
        </div>
        
        <div class="announcement-card card-lunaire card-lunaire--plaid">
          <div class="announcement-icon">${getIconString("chart", 28)}</div>
          <h4>Statistics</h4>
          <p>Track your progress by subject.</p>
          <button class="btn-lunaire btn-lunaire--tertiary btn-lunaire--sm btn-announcement" data-action="pro-shop">
            View
          </button>
        </div>
      </div>
    `;

    return section;
  }

  /**
   * Create Warning Label (footer with pirate humor)
   */
  createClubFinePrint() {
    const section = document.createElement("section");
    section.className = "fine-print-section";

    section.innerHTML = `
      <div class="fine-print-content">
        <div class="club-seal">
          ${getIconString("pirateSkull", 40)}
        </div>
        <div class="fine-print-text">
          <p class="copyright lunaire-mono">
            Barbarossa's Crater Golf Club. Members Only. No Earthlings.
            Est. 1969. "Hostis Humanis Generis"
          </p>
        </div>
      </div>
    `;

    return section;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    console.log(
      "[DEBUG] Binding clubhouse homepage events, container:",
      !!this.container,
    );

    this.container.addEventListener("click", (e) => {
      const target = e.target.closest("button");
      if (!target) return;

      const action = target.dataset.action;
      const subject = target.dataset.subject;
      const count = target.dataset.count;

      // Tee Off / Quick Start
      if (
        action === "quick-start" ||
        action === "book-tee-time" ||
        target.classList.contains("btn-tee-off") ||
        target.classList.contains("btn-book-tee-time")
      ) {
        this.startQuiz();
      }

      // First Round
      if (
        action === "first-round" ||
        target.classList.contains("btn-first-round")
      ) {
        this.startFirstQuiz();
      }

      // Generate Questions / Pro Shop Generator
      if (
        action === "generate-questions" ||
        target.classList.contains("btn-generate-course")
      ) {
        this.showQuestionGenerator();
      }

      // Pro Shop (Statistics)
      if (action === "pro-shop" || target.classList.contains("btn-pro-shop")) {
        window.location.hash = "statistics";
      }

      // Play specific course/subject
      if (target.classList.contains("btn-play-course") && subject) {
        this.startPracticeQuiz(subject);
      }

      // Replay course
      if (target.classList.contains("btn-replay") && subject !== undefined) {
        this.startPracticeQuiz(subject);
      }

      // Back Nine (view more history)
      if (action === "back-nine") {
        window.location.hash = "history";
      }

      // Hole count selection
      if (count && target.classList.contains("hole-btn")) {
        this.updateHoleSelection(parseInt(count));
      }
    });

    // Subject select
    const subjectSelect = this.container.querySelector("#subject-select");
    if (subjectSelect) {
      subjectSelect.addEventListener("change", (e) => {
        this.selectedSubject = e.target.value;
        this.updateBookingSummary();
      });
    }

    // Question type radios
    const radioInputs = this.container.querySelectorAll(
      'input[name="questionType"]',
    );
    radioInputs.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.selectedQuestionType = e.target.value;
        // Update visual selection
        this.container
          .querySelectorAll('.radio-lunaire:has([name="questionType"])')
          .forEach((label) => {
            label.classList.remove("selected");
          });
        e.target.closest(".radio-lunaire").classList.add("selected");
        this.updateBookingSummary();
      });
    });

    // Quiz theme radios
    const themeRadios = this.container.querySelectorAll(
      'input[name="quizTheme"]',
    );
    themeRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.selectedQuizTheme = e.target.value;
        // Update visual selection
        this.container
          .querySelectorAll('.radio-lunaire:has([name="quizTheme"])')
          .forEach((label) => {
            label.classList.remove("selected");
          });
        e.target.closest(".radio-lunaire").classList.add("selected");
        this.updateBookingSummary();
      });
    });
  }

  /**
   * Update hole selection
   */
  updateHoleSelection(count) {
    this.selectedQuestionCount = count;

    // Update visual selection
    this.container.querySelectorAll(".hole-btn").forEach((btn) => {
      btn.classList.toggle("selected", parseInt(btn.dataset.count) === count);
    });

    // Update hint
    const hintEl = this.container.querySelector(".holes-hint");
    if (hintEl) {
      hintEl.textContent = this.getHolesHint(count);
    }

    this.updateBookingSummary();
  }

  /**
   * Update booking summary display
   */
  updateBookingSummary() {
    const courseEl = this.container.querySelector("#summary-course");
    const ballEl = this.container.querySelector("#summary-ball");
    const holesEl = this.container.querySelector("#summary-holes");
    const themeEl = this.container.querySelector("#summary-theme");

    if (courseEl) courseEl.textContent = this.selectedSubject || "Full Course";
    if (ballEl)
      ballEl.textContent = this.getQuestionTypeLabel(this.selectedQuestionType);
    if (holesEl) holesEl.textContent = this.selectedQuestionCount;
    if (themeEl)
      themeEl.textContent = this.getQuizThemeLabel(this.selectedQuizTheme);
  }

  /**
   * Start quiz with current settings
   */
  startQuiz() {
    console.log("[DEBUG] startQuiz called with settings:", {
      subject: this.selectedSubject,
      type: this.selectedQuestionType,
      count: this.selectedQuestionCount,
      theme: this.selectedQuizTheme,
    });

    const options = {
      n: this.selectedQuestionCount,
      subject: this.selectedSubject,
      questionType: this.selectedQuestionType,
      quizTheme: this.selectedQuizTheme,
      timer: 1.8,
    };

    if (typeof this.onStartQuiz !== "function") {
      console.error("[DEBUG] onStartQuiz is not a function!");
      return;
    }

    this.onStartQuiz(options);
  }

  /**
   * Start quiz with specific mode
   */
  startQuizWithMode(mode) {
    console.log("[DEBUG] startQuizWithMode called with mode:", mode);
    const options = {
      n: 5,
      subject: "",
      questionType: "mix",
      timer: 1.8,
      quizMode: mode,
    };

    if (typeof this.onStartQuiz !== "function") {
      console.error("[DEBUG] onStartQuiz is not a function!");
      return;
    }

    this.onStartQuiz(options);
  }

  /**
   * Start practice quiz for specific subject
   */
  startPracticeQuiz(subject) {
    const options = {
      n: 10,
      subject: subject && subject !== "Mixed" ? subject : "",
      questionType: "mix",
      timer: 1.8,
    };
    this.onStartQuiz(options);
  }

  /**
   * Start first quiz for new users
   */
  startFirstQuiz() {
    const options = {
      n: 5,
      subject: "",
      questionType: "mix",
      timer: 1.8,
    };
    this.onStartQuiz(options);
  }

  /**
   * Show question generator
   */
  showQuestionGenerator() {
    if (typeof this.onGenerateQuestions === "function") {
      this.onGenerateQuestions();
    } else {
      window.location.hash = "generator";
    }
  }

  /**
   * Continue with last subject
   */
  continueLastSubject() {
    if (this.statisticsData && this.statisticsData.history.length > 0) {
      const lastQuiz = this.statisticsData.history[0];
      const options = {
        n: 10,
        subject: lastQuiz.subject || "",
        questionType: "mix",
        timer: 1.8,
      };
      this.onStartQuiz(options);
    }
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
   * Start practice test
   */
  startPracticeTest() {
    const options = {
      n: 25,
      subject: "",
      questionType: "mix",
      timer: 1.8,
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
   * Calculate study streak from quiz history
   */
  calculateStudyStreak() {
    if (!this.statisticsData?.history?.length) return 0;

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
   * Initialize performance optimizations
   */
  initializePerformanceOptimizations() {
    const sections = this.container.querySelectorAll("section");
    sections.forEach((section, index) => {
      this.lazyLoader.observe(section, section.id || `section-${index}`);
    });

    this.layoutManager.addListener((breakpoint) => {
      this.handleBreakpointChange(breakpoint);
    });

    window.addEventListener("themeChanged", (event) => {
      this.themeOptimizer.switchTheme(event.detail.theme, sections);
    });

    requestAnimationFrame(() => {
      this.performanceMonitor.markRenderComplete();
    });

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
    this.container.classList.remove(
      "layout-mobile",
      "layout-tablet",
      "layout-desktop",
    );
    this.container.classList.add(`layout-${breakpoint}`);

    const grids = this.container.querySelectorAll(
      ".trophy-stats-grid, .course-grid, .scorecard-list, .announcements-grid",
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
      const userId = this.getUserId();
      this.dataCache.delete(`user_data_${userId}`);

      await this.loadUserData();
      await this.loadSubjects();
      this.container.innerHTML = "";
      this.createHomepageStructure();
      this.bindEvents();
      this.initializePerformanceOptimizations();
    } catch (error) {
      console.error("Failed to refresh clubhouse homepage:", error);
      this.errorBoundary.handleError({
        error,
        context: "clubhouse_homepage_refresh",
      });
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
  console.log("[DEBUG] createClubhouseHomepage called with callbacks:", {
    hasOnStartQuiz: typeof onStartQuiz === "function",
    hasOnGenerateQuestions: typeof onGenerateQuestions === "function",
  });

  const homepage = new Homepage(onStartQuiz, onGenerateQuestions);
  const initialized = await homepage.init();

  console.log("[DEBUG] Clubhouse Homepage initialization complete:", {
    hasContainer: !!homepage.container,
    hasOnStartQuiz: typeof homepage.onStartQuiz === "function",
  });

  return initialized;
}
