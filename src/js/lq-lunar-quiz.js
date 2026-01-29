/**
 * BARBAROSSA'S CRATER GOLF CLUB - QUIZ UI
 * "Hostis Humanis Generis"
 */

import { calculateScore } from "./lq-scorecard.js";
import { getIconString } from "./lunaire-icons.js";

/**
 * Creates the pirate quiz wrapper that transforms quiz interactions
 * into a space pirate raid experience
 */
export function createLunarQuizUI(container, options = {}) {
  const {
    questions = [],
    subject = "All Sectors",
    onAnswer = () => {},
    onComplete = () => {},
    onQuit = () => {},
  } = options;

  let currentTarget = 0;
  let answers = [];
  let eliminatedChoices = new Map();
  let questionStartTimes = [];
  let currentStartTime = null;

  const state = {
    selectedChoice: null,
    isAnswerLocked: false,
    activeHighlightColor: null, // Current highlight color: 'yellow', 'green', 'pink', or null
  };

  // Highlight colors - interstellar gradients
  const highlightColors = {
    yellow:
      "linear-gradient(135deg, rgba(255, 215, 0, 0.5) 0%, rgba(255, 165, 0, 0.4) 50%, rgba(255, 200, 50, 0.5) 100%)", // Solar flare
    green:
      "linear-gradient(135deg, rgba(0, 255, 200, 0.4) 0%, rgba(100, 255, 218, 0.5) 50%, rgba(0, 200, 150, 0.4) 100%)", // Nebula teal
    pink: "linear-gradient(135deg, rgba(255, 100, 255, 0.4) 0%, rgba(200, 150, 255, 0.5) 50%, rgba(255, 150, 200, 0.4) 100%)", // Cosmic purple
  };

  // Build the pirate environment
  function render() {
    container.innerHTML = "";
    container.className = "lunar-quiz pirate-theme";

    // Starfield background (handled by CSS, but we can add layer containers here)
    const stars = document.createElement("div");
    stars.className = "lunar-quiz__stars";
    container.appendChild(stars);

    // Planet/Target in distance
    const targetPlanet = document.createElement("div");
    targetPlanet.className = "lunar-quiz__target-planet";
    container.appendChild(targetPlanet);

    // Content area (HUD)
    const content = document.createElement("div");
    content.className = "lunar-quiz__content";
    container.appendChild(content);

    renderCurrentTarget(content);
  }

  function renderCurrentTarget(content) {
    content.innerHTML = "";
    const question = questions[currentTarget];

    if (!question) {
      finishRound();
      return;
    }

    // Start timing this target
    currentStartTime = Date.now();

    // Mission Status Header (Hole info for golf metaphor)
    const targetInfo = document.createElement("div");
    targetInfo.className = "lunar-quiz__hole-info"; // Keeping class for CSS compat
    targetInfo.innerHTML = `
      <div class="lunar-quiz__hole-number-wrap">
        <div class="lunar-quiz__hole-label">Hole</div>
        <div class="lunar-quiz__hole-number">${currentTarget + 1}</div>
        <div class="lunar-quiz__hole-label">of ${questions.length}</div>
      </div>
      <div class="lunar-quiz__par-info">
        <div class="lunar-quiz__par-value">Par 90s</div>
        <div class="lunar-quiz__par-label">Under 90s for Birdie</div>
      </div>
      <div class="lunar-quiz__timer">
        <div class="lunar-quiz__timer-display" id="hole-timer">00:00</div>
        <div class="lunar-quiz__hole-label">Time</div>
      </div>
    `;
    content.appendChild(targetInfo);

    // Start the timer
    startTimer();

    // Question card (The HUD)
    const card = document.createElement("div");
    card.className = "lunar-quiz__question-card";

    // Card header with highlight toolbar
    const header = document.createElement("div");
    header.className = "lunar-quiz__question-header";
    header.innerHTML = `
      <span>Priority Alert ${currentTarget + 1}</span>
      <div class="lunar-quiz__highlight-toolbar">
        <button class="lunar-quiz__highlight-btn${
          state.activeHighlightColor === "yellow" ? " active" : ""
        }" data-color="yellow" title="Yellow highlight">
          <span style="background: ${
            highlightColors.yellow
          }; width: 16px; height: 16px; border-radius: 3px; display: inline-block; border: 1px solid rgba(0,0,0,0.2);"></span>
        </button>
        <button class="lunar-quiz__highlight-btn${
          state.activeHighlightColor === "green" ? " active" : ""
        }" data-color="green" title="Green highlight">
          <span style="background: ${
            highlightColors.green
          }; width: 16px; height: 16px; border-radius: 3px; display: inline-block; border: 1px solid rgba(0,0,0,0.2);"></span>
        </button>
        <button class="lunar-quiz__highlight-btn${
          state.activeHighlightColor === "pink" ? " active" : ""
        }" data-color="pink" title="Pink highlight">
          <span style="background: ${
            highlightColors.pink
          }; width: 16px; height: 16px; border-radius: 3px; display: inline-block; border: 1px solid rgba(0,0,0,0.2);"></span>
        </button>
        <button class="lunar-quiz__highlight-btn lunar-quiz__highlight-clear" data-color="clear" title="Clear highlights">
          ${getIconString("wrong", 14)}
        </button>
      </div>
    `;
    card.appendChild(header);

    // Bind highlight toolbar events
    header.querySelectorAll(".lunar-quiz__highlight-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const color = btn.dataset.color;
        if (color === "clear") {
          clearHighlights(body);
          state.activeHighlightColor = null;
        } else {
          state.activeHighlightColor =
            state.activeHighlightColor === color ? null : color;
        }
        // Update active states
        header.querySelectorAll(".lunar-quiz__highlight-btn").forEach((b) => {
          b.classList.toggle(
            "active",
            b.dataset.color === state.activeHighlightColor,
          );
        });
      });
    });

    // Card body
    const body = document.createElement("div");
    body.className = "lunar-quiz__question-body";

    // Prompt/fact pattern if exists
    if (question.prompt || question.fact_pattern) {
      const prompt = document.createElement("div");
      prompt.className = "lunar-quiz__prompt highlightable";
      prompt.textContent = question.prompt || question.fact_pattern;
      body.appendChild(prompt);
    }

    // Question text
    const questionText = document.createElement("div");
    questionText.className = "lunar-quiz__question-text highlightable";
    questionText.textContent = question.question || question.text;
    body.appendChild(questionText);

    // Add mouseup listener for highlighting
    body.addEventListener("mouseup", () => {
      if (state.activeHighlightColor) {
        applyHighlight(state.activeHighlightColor);
      }
    });

    // Answer choices
    const choices = document.createElement("ul");
    choices.className = "lunar-quiz__choices";

    const choiceLetters = ["A", "B", "C", "D"];
    // Support both API formats: choice_a/b/c/d and option_a/b/c/d
    const choiceKeys =
      question.choice_a !== undefined
        ? ["choice_a", "choice_b", "choice_c", "choice_d"]
        : ["option_a", "option_b", "option_c", "option_d"];
    const questionEliminated =
      eliminatedChoices.get(currentTarget) || new Set();

    choiceKeys.forEach((key, idx) => {
      if (!question[key]) return;

      const choice = document.createElement("li");
      choice.className = "lunar-quiz__choice";

      const isEliminated = questionEliminated.has(choiceLetters[idx]);
      const isSelected = state.selectedChoice === choiceLetters[idx];

      // Main choice button
      const btn = document.createElement("button");
      btn.className = `lunar-quiz__choice-btn${isSelected ? " selected" : ""}${
        isEliminated ? " eliminated" : ""
      }`;
      btn.innerHTML = `
        <span class="lunar-quiz__choice-letter">${choiceLetters[idx]}</span>
        <span class="lunar-quiz__choice-text">${question[key]}</span>
      `;

      if (!state.isAnswerLocked && !isEliminated) {
        btn.addEventListener("click", () => selectChoice(choiceLetters[idx]));
      }

      choice.appendChild(btn);

      // Eliminate button (Jettison)
      if (!state.isAnswerLocked) {
        const eliminateBtn = document.createElement("button");
        eliminateBtn.className = "lunar-quiz__eliminate-btn";
        eliminateBtn.title = isEliminated
          ? "Restore this option"
          : "Jettison this option";
        eliminateBtn.innerHTML = isEliminated
          ? getIconString("check", 16)
          : getIconString("wrong", 14); // X icon for eliminate
        eliminateBtn.addEventListener("click", () =>
          toggleEliminate(choiceLetters[idx]),
        );
        choice.appendChild(eliminateBtn);
      }

      choices.appendChild(choice);
    });

    body.appendChild(choices);
    card.appendChild(body);
    content.appendChild(card);

    // Navigation Controls
    const nav = document.createElement("div");
    nav.className = "lunar-quiz__nav";

    // Previous button
    const prevBtn = document.createElement("button");
    prevBtn.className = "lunar-quiz__nav-btn";
    prevBtn.innerHTML = `${getIconString("arrowLeft", 18)} Aft`;
    prevBtn.disabled = currentTarget === 0;
    prevBtn.addEventListener("click", () => navigateTarget(-1));
    nav.appendChild(prevBtn);

    // Progress dots (Nav Computer)
    const progress = document.createElement("div");
    progress.className = "lunar-quiz__progress";
    questions.forEach((_, idx) => {
      const dot = document.createElement("div");
      dot.className = "lunar-quiz__progress-dot";
      if (idx === currentTarget) dot.classList.add("current");
      if (answers[idx] !== undefined) dot.classList.add("answered");
      dot.addEventListener("click", () => {
        if (idx !== currentTarget) {
          saveCurrentAnswer();
          currentTarget = idx;
          state.selectedChoice = answers[currentTarget] || null;
          state.isAnswerLocked = false;
          renderCurrentTarget(document.querySelector(".lunar-quiz__content"));
        }
      });
      progress.appendChild(dot);
    });
    nav.appendChild(progress);

    // Next/Submit button
    const nextBtn = document.createElement("button");
    nextBtn.className = "lunar-quiz__nav-btn lunar-quiz__nav-btn--primary";

    if (currentTarget === questions.length - 1) {
      nextBtn.innerHTML = `Complete Raid ${getIconString("flagPin", 18)}`;
      nextBtn.addEventListener("click", () => {
        saveCurrentAnswer();
        finishRound();
      });
    } else {
      nextBtn.innerHTML = `Next Target ${getIconString("arrowRight", 18)}`;
      nextBtn.addEventListener("click", () => navigateTarget(1));
    }

    nav.appendChild(nextBtn);
    content.appendChild(nav);

    // Quit link
    const quitLink = document.createElement("div");
    quitLink.style.cssText = "text-align: center; margin-top: var(--space-4);";
    quitLink.innerHTML = `
      <button class="btn-text" style="color: var(--lunaire-cream); opacity: 0.5;">
        ${getIconString("logout", 16)} Abort Mission
      </button>
    `;
    quitLink.querySelector("button").addEventListener("click", () => {
      if (confirm("Abort mission? The Captain won't be pleased.")) {
        onQuit();
      }
    });
    content.appendChild(quitLink);
  }

  function selectChoice(letter) {
    state.selectedChoice = letter;
    onAnswer(currentTarget, letter);
    renderCurrentTarget(document.querySelector(".lunar-quiz__content"));
  }

  /**
   * Apply highlight to selected text
   */
  function applyHighlight(color) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Check if selection is within highlightable areas
    const container = range.commonAncestorContainer;
    const highlightable =
      container.nodeType === Node.ELEMENT_NODE
        ? container.closest(".highlightable")
        : container.parentElement?.closest(".highlightable");

    if (!highlightable) return;

    // Create highlight span
    const highlight = document.createElement("span");
    highlight.className = "quiz-highlight";
    highlight.style.background = highlightColors[color];
    highlight.style.borderRadius = "3px";
    highlight.style.padding = "1px 3px";
    highlight.style.boxDecorationBreak = "clone";
    highlight.style.webkitBoxDecorationBreak = "clone";

    try {
      range.surroundContents(highlight);
    } catch (e) {
      // If selection spans multiple elements, wrap contents differently
      const fragment = range.extractContents();
      highlight.appendChild(fragment);
      range.insertNode(highlight);
    }

    selection.removeAllRanges();
  }

  /**
   * Clear all highlights from the question body
   */
  function clearHighlights(container) {
    const highlights = container.querySelectorAll(".quiz-highlight");
    highlights.forEach((h) => {
      const parent = h.parentNode;
      while (h.firstChild) {
        parent.insertBefore(h.firstChild, h);
      }
      parent.removeChild(h);
      parent.normalize(); // Merge adjacent text nodes
    });
  }

  function toggleEliminate(letter) {
    const questionEliminated =
      eliminatedChoices.get(currentTarget) || new Set();

    if (questionEliminated.has(letter)) {
      questionEliminated.delete(letter);
    } else {
      // Can only eliminate 2 choices
      if (questionEliminated.size >= 2) {
        return;
      }
      questionEliminated.add(letter);
      // Deselect if the eliminated choice was selected
      if (state.selectedChoice === letter) {
        state.selectedChoice = null;
      }
    }

    eliminatedChoices.set(currentTarget, questionEliminated);
    renderCurrentTarget(document.querySelector(".lunar-quiz__content"));
  }

  function navigateTarget(direction) {
    saveCurrentAnswer();
    currentTarget += direction;
    state.selectedChoice = answers[currentTarget] || null;
    state.isAnswerLocked = false;
    renderCurrentTarget(document.querySelector(".lunar-quiz__content"));
  }

  function saveCurrentAnswer() {
    if (state.selectedChoice) {
      answers[currentTarget] = state.selectedChoice;
      // Record time relative to when THIS specific question was shown
      // This allows precise tracking for the 'under 45s' Legend rank.
      const sessionTime = Date.now() - currentStartTime;
      questionStartTimes[currentTarget] =
        (questionStartTimes[currentTarget] || 0) + sessionTime;
      currentStartTime = Date.now(); // Reset start time so we don't double count if we stay on page
    }
  }

  function finishRound() {
    // Calculate scores for all targets
    const results = questions.map((q, idx) => {
      const userAnswer = answers[idx];
      const correctAnswer = q.correct_answer || q.answer;
      const isCorrect =
        userAnswer && userAnswer.toUpperCase() === correctAnswer.toUpperCase();
      const timeSpent = questionStartTimes[idx] || 120000; // Default 2 min if no time

      return {
        question: q,
        userAnswer,
        correctAnswer,
        isCorrect,
        timeSpent,
        score: calculateScore(q, answers[idx], timeSpent),
      };
    });

    onComplete(results);
  }

  // Timer functionality
  let timerInterval = null;

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    // We only care about the time spent THIS viewing of the question for the display
    const startTime = Date.now();
    const timerDisplay = document.getElementById("hole-timer");

    function updateTimer() {
      if (!timerDisplay) return;

      // Total accumulated time for this question
      const previouslyAccumulated = questionStartTimes[currentTarget] || 0;
      const currentSession = Date.now() - startTime;
      const totalElapsed = previouslyAccumulated + currentSession;

      const minutes = Math.floor(totalElapsed / 60000);
      const seconds = Math.floor((totalElapsed % 60000) / 1000);

      timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
        seconds,
      ).padStart(2, "0")}`;

      // Visual indicator if taking too long (45s speed target, 90s safety)
      if (totalElapsed > 90000) {
        timerDisplay.classList.add("overtime");
        timerDisplay.style.color = "var(--blood-orange)";
      } else if (totalElapsed > 45000) {
        timerDisplay.style.color = "var(--plunder-gold)";
      } else {
        timerDisplay.style.color = "var(--nebula-teal)";
      }
    }

    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
  }

  function getQuestionTypeLabel(question) {
    if (question.generated) return "AI Simulacrum";
    return "Archive Data";
  }

  // Initialize
  render();

  // Cleanup function
  return {
    destroy: () => {
      if (timerInterval) clearInterval(timerInterval);
    },
    getCurrentHole: () => currentTarget,
    getAnswers: () => [...answers],
  };
}

/**
 * Creates a pirate ship/station decoration
 */
export function createPirateDecoration(size = 48) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.innerHTML = `
    <defs>
      <linearGradient id="hullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#333"/>
        <stop offset="100%" stop-color="#111"/>
      </linearGradient>
    </defs>
    <!-- Sharp, aggressive hull shape -->
    <path d="M10 24 L24 10 L38 24 L24 38 Z" fill="url(#hullGrad)" stroke="var(--plunder-gold)" stroke-width="1.5"/>
    <circle cx="24" cy="24" r="6" fill="#000" stroke="var(--blood-orange)" stroke-width="1"/>
    <!-- Engine glow -->
    <path d="M8 24 L2 20 L2 28 Z" fill="var(--blood-orange)" opacity="0.8"/>
  `;
  return svg;
}

/**
 * Creates a target planet decoration
 */
export function createTargetDecoration(size = 100) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.innerHTML = `
    <defs>
      <radialGradient id="planetGrad" cx="30%" cy="30%">
        <stop offset="0%" stop-color="#4A90C4"/>
        <stop offset="100%" stop-color="#2D5A6B"/>
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="40" fill="url(#planetGrad)" opacity="0.8"/>
    <!-- Target reticle overlaid -->
    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--blood-orange)" stroke-width="1" stroke-dasharray="5,5"/>
    <line x1="50" y1="5" x2="50" y2="95" stroke="var(--blood-orange)" stroke-width="1" opacity="0.5"/>
    <line x1="5" y1="50" x2="95" y2="50" stroke="var(--blood-orange)" stroke-width="1" opacity="0.5"/>
  `;
  return svg;
}

/**
 * Crude pirate avatar illustration
 */
export function createPirateAvatar(size = 120) {
  // Keeping the crude style but making it a pirate
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 120 120");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.innerHTML = `
    <g stroke="var(--plunder-gold)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- Pirate Hat -->
      <path d="M30 40 Q60 5 90 40 L100 35 L110 45 L90 55 H30 L10 45 L20 35 L30 40" fill="var(--void-black)"/>
      <path d="M45 45 H75" stroke="var(--starlight-cream)"/>
      <!-- Skull on hat -->
      <circle cx="60" cy="30" r="4" fill="var(--starlight-cream)" stroke="none"/>
      
      <!-- Head -->
      <circle cx="60" cy="65" r="15" fill="var(--starlight-cream)"/>
      <!-- Eye patch -->
      <path d="M55 60 L65 70" stroke="black" stroke-width="3"/>
      <circle cx="58" cy="63" r="3" fill="black" stroke="none"/>
      
      <!-- Body -->
      <path d="M60 80 L60 110" stroke-width="3"/>
      <path d="M60 90 L40 100" stroke-width="3"/> <!-- Sword arm -->
      <path d="M60 90 L80 85" stroke-width="3"/> <!-- Hook arm -->
      
      <!-- Sword -->
      <path d="M35 105 L25 85 L20 115" stroke="silver"/>
      
      <!-- Legs -->
      <path d="M60 110 L50 120"/>
      <path d="M60 110 L70 120"/>
    </g>
  `;
  return svg;
}

export default {
  createLunarQuizUI,
  createPirateDecoration,
  createTargetDecoration,
  createPirateAvatar,
};
