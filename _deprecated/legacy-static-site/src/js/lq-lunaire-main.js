/**
 * BARBAROSSA'S CRATER GOLF CLUB - Main Application
 * "Hostis Humanis Generis"
 */

import {
  fetchQuestionsByType,
  logQuizAttempt,
  saveEnhancedQuizHistory,
} from "./lq-api.js";
import { authManager } from "./lq-auth.js";
import { beachBoysTheme } from "./lq-beach-boys-theme.js";
import { Homepage } from "./lq-clubhouse-homepage.js";
import { FriendlyMode } from "./lq-friendly-mode.js";
import {
  hideError,
  hideLoading,
  showError,
  showLoading,
} from "./lq-loading.js";
import { createLunaireReview } from "./lq-lunaire-review.js";
import { createLunarQuizUI } from "./lq-lunar-quiz.js";
import { createProShopPage } from "./lq-pro-shop.js";
import { createQuestionGenerator } from "./lq-question-generator.js";
import { createQuizShowMode } from "./lq-quiz-show-mode.js";
import { setupQuizWithSubtopics } from "./lq-setup.js";
import { getLoadingMessage } from "./lunaire-copy.js";
import { initIcons, replaceEmojisWithIcons } from "./lunaire-icons.js";

// Expose beach boys theme globally for easter egg triggers
window.beachBoysTheme = beachBoysTheme;

// Application state
const state = {
  currentPage: "home",
  quizHistory: JSON.parse(localStorage.getItem("lawQuizHistory") || "[]"),
  homepage: null,
  isLunaireTheme: true,
};

// DOM elements
const app = document.getElementById("app");

/**
 * Initialize the Renegade Flotilla application
 */
export async function initLunaireApp() {
  console.log("[Barbarossa] Initializing Crater Golf Club...");

  // Initialize icon system
  initIcons();

  // Replace any emojis in existing content
  replaceEmojisWithIcons(document.body);

  // Setup navigation handlers
  setupNavigation();

  // Setup mobile menu
  setupMobileMenu();

  // Initialize homepage (Mess Hall)
  await navigateToClubhouse();

  console.log("[Barbarossa] Welcome to the Crater. Members Only.");
}

/**
 * Setup navigation event handlers
 */
function setupNavigation() {
  // Mess Hall (Home) button
  const homeBtn = document.getElementById("homeBtn");
  if (homeBtn) {
    homeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navigateToClubhouse();
    });
  }

  // Nav Computer (Generator) button
  const generatorBtn = document.getElementById("generatorBtn");
  if (generatorBtn) {
    generatorBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showCustomFairway();
    });
  }

  // The Hoard (Statistics) button
  const statisticsBtn = document.getElementById("statisticsBtn");
  if (statisticsBtn) {
    statisticsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showProShop();
    });
  }

  // Listen for custom navigation events
  window.addEventListener("navigate", (e) => {
    const { page } = e.detail || {};
    switch (page) {
      case "home":
        navigateToClubhouse();
        break;
      case "setup":
        showTeeTimeBooking();
        break;
      case "statistics":
        showProShop();
        break;
      case "generator":
        showCustomFairway();
        break;
    }
  });
}

/**
 * Setup mobile menu functionality
 */
function setupMobileMenu() {
  const toggle = document.getElementById("mobileMenuToggle");
  const overlay = document.getElementById("mobileNavOverlay");
  const close = document.getElementById("mobileNavClose");

  if (!toggle || !overlay) return;

  const closeMobileMenu = () => {
    toggle.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  };

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.style.overflow = overlay.classList.contains("active")
      ? "hidden"
      : "";
  });

  if (close) close.addEventListener("click", closeMobileMenu);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeMobileMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("active")) {
      closeMobileMenu();
    }
  });

  // Handle mobile nav button clicks
  document.querySelectorAll(".mobile-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      document.getElementById(targetId)?.click();
      closeMobileMenu();
    });
  });
}

/**
 * Navigate to the Mess Hall (Homepage)
 */
async function navigateToClubhouse() {
  state.currentPage = "home";
  updateNavActive();
  hideLoading();
  hideError();
  document.body.classList.remove("quiz-mode");

  app.innerHTML = "";

  // Create and initialize the homepage
  state.homepage = new Homepage(startRound, showCustomFairway);

  try {
    const homepageElement = await state.homepage.init();
    app.appendChild(homepageElement);

    // Replace any emojis that might have snuck through
    replaceEmojisWithIcons(app);
  } catch (error) {
    console.error("[Renegade] Failed to initialize Mess Hall:", error);
    showError(
      "Airlock malfunction. Mess Hall inaccessible. Rebooting systems...",
    );
  }
}

/**
 * Show the Mission Briefing (Quiz Setup)
 */
function showTeeTimeBooking() {
  state.currentPage = "setup";
  updateNavActive();
  hideError();
  document.body.classList.remove("quiz-mode");

  app.innerHTML = "";

  const setupElement = setupQuizWithSubtopics((opts) => {
    startRound(opts);
  });

  app.appendChild(setupElement);
  replaceEmojisWithIcons(app);
}

/**
 * Show the Navigation Computer (Question Generator)
 */
function showCustomFairway() {
  state.currentPage = "generator";
  updateNavActive();
  hideError();
  document.body.classList.remove("quiz-mode");

  app.innerHTML = "";

  const generatorPage = createQuestionGenerator(startRound);
  app.appendChild(generatorPage);
  replaceEmojisWithIcons(app);
}

/**
 * Show The Hoard (Statistics)
 */
async function showProShop() {
  state.currentPage = "statistics";
  updateNavActive();
  hideError();
  document.body.classList.remove("quiz-mode");

  app.innerHTML = "";
  showLoading(getLoadingMessage());

  try {
    const proShopPage = await createProShopPage();
    hideLoading();
    app.appendChild(proShopPage);
    replaceEmojisWithIcons(app);
  } catch (error) {
    console.error("[Renegade] Failed to open The Hoard:", error);
    hideLoading();
    showError("The Hoard is locked down. Security breach detected.");
  }
}

/**
 * Start a mission (quiz) with the given options
 */
async function startRound(opts) {
  console.log("[Renegade] Launching mission with options:", opts);
  showLoading(getLoadingMessage());

  try {
    const res = await fetchQuestionsByType(
      opts.n,
      opts.subject,
      opts.questionType,
      opts.subtopic,
    );
    const questions = res.questions;

    if (!questions || !questions.length) {
      hideLoading();
      showError(
        "No targets found in this sector. Try scanning a different system.",
      );
      return;
    }

    hideLoading();
    hideError();

    app.innerHTML = "";
    document.body.classList.add("quiz-mode");

    // Track timing for each question
    const questionTimes = [];
    let currentQuestionStart = Date.now();

    // Determine which quiz mode to use based on quizTheme option
    const quizTheme = opts.quizTheme || "pirate";

    if (quizTheme === "quiz-show") {
      // Quiz Show Mode (70s game show)
      const quizShowElement = await createQuizShowMode(
        questions,
        { ...opts, timer: opts.timer || 1.8 },
        async (qs, answers, meta) => {
          await handleQuizComplete(qs, answers, meta, opts);
        },
      );
      app.appendChild(quizShowElement);
    } else if (quizTheme === "baseball") {
      // Baseball / Friendly Mode (untimed)
      const friendlyMode = new FriendlyMode(
        questions,
        { ...opts, timer: 0 },
        async (qs, answers, meta) => {
          await handleQuizComplete(qs, answers, meta, opts);
        },
      );
      const friendlyElement = await friendlyMode.start();
      app.appendChild(friendlyElement);
    } else {
      // Default: Space Pirate / Lunar Golf Mode
      const container = document.createElement("div");
      app.appendChild(container);

      const lunarQuiz = createLunarQuizUI(container, {
        questions,
        subject: opts.subject || "Unknown Sector",
        onAnswer: (idx, answer) => {
          // Track timing
          questionTimes[idx] = Date.now() - currentQuestionStart;
          currentQuestionStart = Date.now();
        },
        onComplete: async (results) => {
          await handleRoundComplete(questions, results, opts, questionTimes);
        },
        onQuit: () => {
          navigateToClubhouse();
        },
      });
    }
  } catch (error) {
    console.error("[Lunaire] Error starting round:", error);
    hideLoading();
    showError(
      "Failed to load the course. Please check your connection and try again.",
    );
  }
}

/**
 * Handle lunar quiz completion
 */
async function handleRoundComplete(questions, results, opts, questionTimes) {
  document.body.classList.remove("quiz-mode");

  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const answers = results.map((r) =>
    r.userAnswer ? ["A", "B", "C", "D"].indexOf(r.userAnswer) : null,
  );

  // Calculate total duration
  const totalTime = questionTimes.reduce((sum, t) => sum + (t || 0), 0);
  const duration_s = Math.round(totalTime / 1000);

  const meta = {
    correct,
    total,
    duration_s,
    questionTimes,
    quizMode: "lunaire",
  };

  // Save to history
  const historyEntry = {
    datetime: new Date().toISOString(),
    userId: getCurrentUserId(),
    opts: { ...opts, quizMode: "lunaire" },
    answers,
    meta,
    questions,
  };

  state.quizHistory.unshift(historyEntry);
  state.quizHistory = state.quizHistory.slice(0, 50);
  localStorage.setItem("lawQuizHistory", JSON.stringify(state.quizHistory));

  try {
    await saveEnhancedQuizHistory({
      user_id: getCurrentUserId(),
      subject: opts.subject || "",
      subtopic: opts.subtopic || "",
      correct,
      total,
      duration_seconds: duration_s,
      questions: questions.map((q) => q.idx),
      answers,
      time_per_question: questionTimes,
      mode: "lunaire",
      negative_time: false,
    });

    await logQuizAttempt(historyEntry);
  } catch (error) {
    console.error("[Lunaire] Failed to save round history:", error);
  }

  // Show the Lunaire review (19th Hole)
  app.innerHTML = "";
  const reviewElement = createLunaireReview(questions, answers, meta);
  app.appendChild(reviewElement);
  replaceEmojisWithIcons(app);
}

/**
 * Handle standard quiz completion (for fallback modes)
 */
async function handleQuizComplete(questions, answers, meta, opts) {
  document.body.classList.remove("quiz-mode");

  const historyEntry = {
    datetime: new Date().toISOString(),
    userId: getCurrentUserId(),
    opts,
    answers,
    meta,
    questions,
  };

  state.quizHistory.unshift(historyEntry);
  state.quizHistory = state.quizHistory.slice(0, 50);
  localStorage.setItem("lawQuizHistory", JSON.stringify(state.quizHistory));

  try {
    await saveEnhancedQuizHistory({
      user_id: getCurrentUserId(),
      subject: opts.subject || "",
      subtopic: opts.subtopic || "",
      correct: meta.correct,
      total: meta.total,
      duration_seconds: meta.duration_s,
      questions: questions.map((q) => q.idx),
      answers,
      time_per_question: meta.time_per_question || [],
      mode: opts.quizMode || "classic",
      negative_time: meta.negative_time || false,
    });

    await logQuizAttempt(historyEntry);
  } catch (error) {
    console.error("[Lunaire] Failed to save quiz history:", error);
  }

  // Show review
  app.innerHTML = "";
  const reviewElement = createLunaireReview(questions, answers, meta);
  app.appendChild(reviewElement);
  replaceEmojisWithIcons(app);
}

/**
 * Update navigation active states
 */
function updateNavActive() {
  document
    .getElementById("homeBtn")
    ?.classList.toggle("active", state.currentPage === "home");
  document
    .getElementById("generatorBtn")
    ?.classList.toggle("active", state.currentPage === "generator");
  document
    .getElementById("statisticsBtn")
    ?.classList.toggle("active", state.currentPage === "statistics");
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
  if (authManager.isAuthenticated()) {
    const user = authManager.getCurrentUser();
    return user ? `user_${user.id}` : getAnonymousUserId();
  }
  return getAnonymousUserId();
}

/**
 * Get or generate anonymous user ID
 */
function getAnonymousUserId() {
  if (!localStorage.getItem("userId")) {
    const id = "anonymous_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("userId", id);
  }
  return localStorage.getItem("userId");
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLunaireApp);
} else {
  initLunaireApp();
}

export default {
  initLunaireApp,
  navigateToClubhouse,
  showTeeTimeBooking,
  showCustomFairway,
  showProShop,
  startRound,
};
