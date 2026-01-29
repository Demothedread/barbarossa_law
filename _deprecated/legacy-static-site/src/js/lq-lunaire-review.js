/**
 * LUNAIRE COUNTRY CLUB - Scorecard Review Screen
 * "The 19th Hole" - Where rounds are reviewed and wisdom is gained
 *
 * Displays quiz results as a golf scorecard with:
 * - Eagle/Birdie/Par/Bogey scoring based on correctness and time
 * - Hole-by-hole breakdown with AI explanations
 * - Round summary and club statistics
 */

import { fetchAIExplanations, saveQuizHistory } from "./lq-api.js";
import {
  calculateRoundScore,
  calculateScore,
  createScorecard,
} from "./lq-scorecard.js";
import { getIconString } from "./lunaire-icons.js";

/**
 * Create the Lunaire-themed review screen with golf scorecard display
 */
export function createLunaireReview(questions, answers, meta) {
  const container = document.createElement("div");
  container.className = "lunaire-review";

  // State management
  const state = {
    currentHole: 0,
    aiExplanations: meta.aiExplanations || null,
    loadingExplanations: false,
    holeScores: [],
    roundStats: null,
  };

  // Calculate scores for each hole
  function calculateHoleScores() {
    state.holeScores = questions.map((q, idx) => {
      const userAnswer = answers[idx];
      const correctAnswer = q.answer;
      // Convert answer index to letter for comparison
      const userAnswerLetter = userAnswer !== null ? "ABCD"[userAnswer] : null;
      const isCorrect = userAnswerLetter === correctAnswer;

      // Estimate time spent (if not available, use default)
      const timeSpent =
        meta.questionTimes?.[idx] ||
        (meta.duration_s * 1000) / questions.length;

      // Use the calculateScore function with proper signature
      const scoreResult = calculateScore(q, userAnswerLetter, timeSpent);

      return {
        hole: idx + 1,
        isCorrect,
        timeSpent,
        score: {
          name: scoreResult.label,
          display:
            scoreResult.value > 0
              ? `+${scoreResult.value}`
              : scoreResult.value.toString(),
          class: scoreResult.cssClass,
          value: scoreResult.value,
          type: scoreResult.type,
        },
        userAnswer: userAnswerLetter,
        correctAnswer,
      };
    });

    state.roundStats = calculateRoundScore(
      state.holeScores.map((h) => h.score),
    );
  }

  // Build the review interface
  function render() {
    container.innerHTML = "";
    calculateHoleScores();

    // Add texture background
    container.style.backgroundImage = "var(--texture-paper)";

    // Header with round summary
    const header = createRoundSummaryHeader();
    container.appendChild(header);

    // Main scorecard display
    const scorecardSection = createScorecardSection();
    container.appendChild(scorecardSection);

    // Hole-by-hole review with navigation
    const holeReview = createHoleReviewSection();
    container.appendChild(holeReview);

    // Action buttons
    const actions = createActionButtons();
    container.appendChild(actions);

    // Load AI explanations in background
    loadAIExplanations();
  }

  function createRoundSummaryHeader() {
    const header = document.createElement("div");
    header.className = "lunaire-review__header";

    const stats = state.roundStats;
    const percentage = ((meta.correct / meta.total) * 100).toFixed(0);
    const mins = Math.floor(meta.duration_s / 60);
    const secs = meta.duration_s % 60;

    // Determine round verdict
    let verdict, verdictClass;
    if (percentage >= 80) {
      verdict = "Championship Round!";
      verdictClass = "eagle";
    } else if (percentage >= 70) {
      verdict = "Excellent Play";
      verdictClass = "birdie";
    } else if (percentage >= 60) {
      verdict = "Solid Round";
      verdictClass = "par";
    } else if (percentage >= 50) {
      verdict = "Room for Improvement";
      verdictClass = "bogey";
    } else {
      verdict = "Keep Practicing";
      verdictClass = "double";
    }

    header.innerHTML = `
      <div class="lunaire-review__verdict ${verdictClass}">
        ${getIconString("flagPin", 32)}
        <h2>${verdict}</h2>
        <p class="lunaire-review__course">${
          questions[0]?.subject || "Mixed Course"
        } - ${questions.length} Holes</p>
      </div>
      
      <div class="lunaire-review__stats-grid">
        <div class="lunaire-review__stat">
          <div class="lunaire-review__stat-value">${meta.correct}/${
      meta.total
    }</div>
          <div class="lunaire-review__stat-label">Score</div>
        </div>
        <div class="lunaire-review__stat">
          <div class="lunaire-review__stat-value ${
            stats.totalScore <= 0 ? "under-par" : "over-par"
          }">
            ${stats.totalScore <= 0 ? "" : "+"}${stats.totalScore}
          </div>
          <div class="lunaire-review__stat-label">To Par</div>
        </div>
        <div class="lunaire-review__stat">
          <div class="lunaire-review__stat-value">${percentage}%</div>
          <div class="lunaire-review__stat-label">Accuracy</div>
        </div>
        <div class="lunaire-review__stat">
          <div class="lunaire-review__stat-value">${mins}:${String(
      secs,
    ).padStart(2, "0")}</div>
          <div class="lunaire-review__stat-label">Time</div>
        </div>
      </div>
      
      <div class="lunaire-review__scoring-breakdown">
        <span class="score-count birdie">${getIconString("golfBall", 14)} ${
      stats.birdies
    } Birdies</span>
        <span class="score-count par">${getIconString("check", 14)} ${
      stats.pars
    } Pars</span>
        <span class="score-count bogey">${getIconString("wrong", 14)} ${
      stats.bogeys
    } Bogeys</span>
        <span class="score-count double">${
          stats.doubleBogeys
        } Double Bogeys</span>
      </div>
    `;

    // Play celebration or commiseration sound
    playCompletionSound(percentage >= 65);

    return header;
  }

  function createScorecardSection() {
    const section = document.createElement("div");
    section.className = "lunaire-review__scorecard-section";

    const title = document.createElement("h3");
    title.className = "clubhouse-section__title";
    title.innerHTML = `${getIconString("scorecard", 24)} Official Scorecard`;
    section.appendChild(title);

    // Use the scorecard component
    const scorecardEl = createScorecard(state.holeScores, {
      courseName: questions[0]?.subject || "Lunaire Championship Course",
      playerName: localStorage.getItem("userName") || "Club Member",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });

    section.appendChild(scorecardEl);

    return section;
  }

  function createHoleReviewSection() {
    const section = document.createElement("div");
    section.className = "lunaire-review__hole-section";

    // Navigation header
    const navHeader = document.createElement("div");
    navHeader.className = "lunaire-review__hole-nav";
    navHeader.innerHTML = `
      <button class="btn-lunaire btn-lunaire--outline" id="prev-hole-btn">
        ${getIconString("arrowLeft", 16)} Previous
      </button>
      <div class="lunaire-review__hole-counter">
        Hole <span id="current-hole-num">1</span> of ${questions.length}
      </div>
      <button class="btn-lunaire btn-lunaire--outline" id="next-hole-btn">
        Next ${getIconString("arrowRight", 16)}
      </button>
    `;
    section.appendChild(navHeader);

    // Hole content container
    const holeContent = document.createElement("div");
    holeContent.id = "hole-content";
    holeContent.className = "lunaire-review__hole-content";
    section.appendChild(holeContent);

    // Setup navigation
    setTimeout(() => {
      const prevBtn = document.getElementById("prev-hole-btn");
      const nextBtn = document.getElementById("next-hole-btn");

      prevBtn?.addEventListener("click", () => {
        if (state.currentHole > 0) {
          state.currentHole--;
          renderCurrentHole();
        }
      });

      nextBtn?.addEventListener("click", () => {
        if (state.currentHole < questions.length - 1) {
          state.currentHole++;
          renderCurrentHole();
        }
      });

      renderCurrentHole();
    }, 0);

    return section;
  }

  function renderCurrentHole() {
    const holeContent = document.getElementById("hole-content");
    const holeNumEl = document.getElementById("current-hole-num");
    const prevBtn = document.getElementById("prev-hole-btn");
    const nextBtn = document.getElementById("next-hole-btn");

    if (!holeContent) return;

    const idx = state.currentHole;
    const q = questions[idx];
    const holeScore = state.holeScores[idx];
    const userAnswer = answers[idx];
    const correctIdx = ["A", "B", "C", "D"].indexOf(q.answer);

    // Update navigation state
    if (holeNumEl) holeNumEl.textContent = idx + 1;
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === questions.length - 1;

    holeContent.innerHTML = "";

    // Hole card
    const holeCard = document.createElement("div");
    holeCard.className = "card-lunaire lunaire-review__hole-card";

    // Hole header with score
    const holeHeader = document.createElement("div");
    holeHeader.className = `lunaire-review__hole-header ${holeScore.score.class}`;
    holeHeader.innerHTML = `
      <div class="hole-info">
        <span class="hole-number">Hole ${idx + 1}</span>
        <span class="hole-subject">${q.subject || "Mixed"}</span>
      </div>
      <div class="hole-result">
        <span class="score-badge ${holeScore.score.class}">${
      holeScore.score.name
    }</span>
        <span class="score-value">${holeScore.score.display}</span>
      </div>
    `;
    holeCard.appendChild(holeHeader);

    // Question content
    const questionContent = document.createElement("div");
    questionContent.className = "lunaire-review__question-content";

    // Prompt if exists
    if (q.prompt && q.prompt.trim()) {
      const prompt = document.createElement("div");
      prompt.className = "lunaire-review__prompt";
      prompt.textContent = q.prompt;
      questionContent.appendChild(prompt);
    }

    // Question text
    const questionText = document.createElement("div");
    questionText.className = "lunaire-review__question-text";
    questionText.textContent = q.question;
    questionContent.appendChild(questionText);

    holeCard.appendChild(questionContent);

    // Answer choices
    const choices = document.createElement("div");
    choices.className = "lunaire-review__choices";

    const letters = ["A", "B", "C", "D"];
    const aiData = state.aiExplanations?.[q.idx] || null;

    q.choices.forEach((choice, i) => {
      const choiceEl = document.createElement("div");
      const isCorrect = i === correctIdx;
      const isUserAnswer = userAnswer === i;

      let choiceClass = "lunaire-review__choice";
      if (isCorrect) choiceClass += " correct";
      if (isUserAnswer && !isCorrect) choiceClass += " incorrect";
      if (isUserAnswer) choiceClass += " selected";

      choiceEl.className = choiceClass;

      // Choice header
      const choiceHeader = document.createElement("div");
      choiceHeader.className = "lunaire-review__choice-header";

      const letterBadge = document.createElement("span");
      letterBadge.className = "choice-letter";
      letterBadge.textContent = letters[i];

      const choiceText = document.createElement("span");
      choiceText.className = "choice-text";
      choiceText.textContent = choice;

      const indicator = document.createElement("span");
      indicator.className = "choice-indicator";
      if (isCorrect) {
        indicator.innerHTML = getIconString("check", 16) + " Correct";
        indicator.classList.add("correct");
      } else if (isUserAnswer) {
        indicator.innerHTML = getIconString("wrong", 16) + " Your Answer";
        indicator.classList.add("incorrect");
      }

      choiceHeader.appendChild(letterBadge);
      choiceHeader.appendChild(choiceText);
      choiceHeader.appendChild(indicator);
      choiceEl.appendChild(choiceHeader);

      // AI Explanation
      let explanation = null;
      if (aiData) {
        if (aiData.explanations?.[letters[i]]) {
          explanation = aiData.explanations[letters[i]];
        } else if (aiData[`choice_${letters[i].toLowerCase()}_explanation`]) {
          explanation =
            aiData[`choice_${letters[i].toLowerCase()}_explanation`];
        }
      }

      if (explanation) {
        const explanationEl = document.createElement("div");
        explanationEl.className = "lunaire-review__explanation";
        explanationEl.style.display = isCorrect ? "block" : "none";
        explanationEl.innerHTML = `
          <div class="explanation-header">
            ${getIconString("hal", 16)} HAL's Analysis
          </div>
          <div class="explanation-text">${explanation}</div>
        `;
        choiceEl.appendChild(explanationEl);

        // Toggle explanation on click (for non-correct answers)
        if (!isCorrect) {
          choiceHeader.style.cursor = "pointer";
          choiceHeader.addEventListener("click", () => {
            const isVisible = explanationEl.style.display === "block";
            explanationEl.style.display = isVisible ? "none" : "block";
          });
        }
      }

      choices.appendChild(choiceEl);
    });

    holeCard.appendChild(choices);

    // Gold passage / Rule of Law
    if (q.gold_passage && q.gold_passage.trim()) {
      const ruleSection = document.createElement("div");
      ruleSection.className = "lunaire-review__rule-section";
      ruleSection.innerHTML = `
        <h4 class="rule-title">${getIconString("book", 18)} Rule of Law</h4>
        <div class="rule-content">${q.gold_passage}</div>
      `;
      holeCard.appendChild(ruleSection);
    }

    // Subtopic badge
    if (aiData?.subtopic) {
      const subtopic = document.createElement("div");
      subtopic.className = "lunaire-review__subtopic";
      subtopic.innerHTML = `${getIconString(
        "compass",
        14,
      )} <strong>Subtopic:</strong> ${aiData.subtopic}`;
      holeCard.appendChild(subtopic);
    }

    // Loading indicator
    if (state.loadingExplanations) {
      const loading = document.createElement("div");
      loading.className = "lunaire-review__loading";
      loading.innerHTML = `${getIconString(
        "hal",
        20,
      )} <span>HAL is analyzing your round...</span>`;
      holeCard.appendChild(loading);
    }

    holeContent.appendChild(holeCard);

    // Hole quick nav (dots)
    const quickNav = document.createElement("div");
    quickNav.className = "lunaire-review__quick-nav";
    questions.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = `quick-nav-dot ${
        state.holeScores[i].isCorrect ? "correct" : "incorrect"
      }`;
      if (i === state.currentHole) dot.classList.add("current");
      dot.addEventListener("click", () => {
        state.currentHole = i;
        renderCurrentHole();
      });
      quickNav.appendChild(dot);
    });
    holeContent.appendChild(quickNav);
  }

  function createActionButtons() {
    const actions = document.createElement("div");
    actions.className = "lunaire-review__actions";

    actions.innerHTML = `
      <button class="btn-lunaire btn-lunaire--secondary" id="back-to-clubhouse">
        ${getIconString("clubhouse", 18)} Return to Clubhouse
      </button>
      <button class="btn-lunaire btn-lunaire--primary" id="play-again">
        ${getIconString("golfClub", 18)} Play Another Round
      </button>
    `;

    setTimeout(() => {
      document
        .getElementById("back-to-clubhouse")
        ?.addEventListener("click", () => {
          window.dispatchEvent(
            new CustomEvent("navigate", { detail: { page: "home" } }),
          );
        });

      document.getElementById("play-again")?.addEventListener("click", () => {
        window.dispatchEvent(
          new CustomEvent("navigate", { detail: { page: "setup" } }),
        );
      });
    }, 0);

    return actions;
  }

  // Load AI explanations
  async function loadAIExplanations() {
    if (state.aiExplanations && Object.keys(state.aiExplanations).length > 0) {
      console.log("Using pre-fetched AI explanations");
      saveHistory();
      return;
    }

    if (state.loadingExplanations) return;
    state.loadingExplanations = true;

    try {
      const questionIds = questions.map((q) => q.idx);
      state.aiExplanations = await fetchAIExplanations(questionIds);
    } catch (error) {
      console.error("Failed to load AI explanations:", error);
      state.aiExplanations = {};
    } finally {
      state.loadingExplanations = false;
      renderCurrentHole();
      saveHistory();
    }
  }

  async function saveHistory() {
    try {
      await saveQuizHistory({
        user_id: localStorage.getItem("userId") || "anonymous",
        subject: questions[0]?.subject || "",
        correct: meta.correct,
        total: meta.total,
        duration_seconds: meta.duration_s,
        questions: questions.map((q) => q.idx),
        answers: answers,
        negative_time:
          meta.duration_s > questions.length * 60 * (meta.timer || 1),
      });
    } catch (error) {
      console.error("Failed to save quiz history:", error);
    }
  }

  function playCompletionSound(isWinner) {
    const folder = isWinner ? "assets/winner/" : "assets/losers/";

    fetch(`${folder}files.json`)
      .then((res) => res.json())
      .then((songs) => {
        if (songs.length === 0) return;
        const randomSong = songs[Math.floor(Math.random() * songs.length)];
        const audio = new Audio(`${folder}${randomSong}`);
        audio.volume = 0.5;
        audio.play().catch((e) => console.log("Audio play prevented:", e));
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
        }, 10000);
      })
      .catch(() => {});
  }

  // Initialize
  render();

  return container;
}

// Additional styles for the Lunaire review (Moved to lunaire-design-system.css)
// Any specific overrides can be added here if absolutely necessary, but CSS is preferred

export default createLunaireReview;
