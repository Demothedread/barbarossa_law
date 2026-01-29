/**
 * BARBAROSSA'S CRATER GOLF CLUB - SCORECARD
 * "Hostis Humanis Generis"
 *
 * Golf-style scoring:
 * - Birdie (-1): Correct + under 90 seconds
 * - Par (0): Correct answer (>= 90s)
 * - Bogey (+1): Best wrong answer
 * - Double Bogey (+2): Other wrong / Timeout
 */

import { getIconString } from "./lunaire-icons.js";

/**
 * Calculate the golf score type based on answer correctness and time
 * @param {Object} question - Question object with answer field
 * @param {number} userAnswerIndex - User's answer index (0-3) or letter "A"-"D"
 * @param {number} timeSpentMs - Time spent on question in milliseconds
 * @returns {Object} Score info with type, value, label, and description
 */
export function calculateScore(question, userAnswerIndex, timeSpentMs) {
  // Handle letter answers ("A", "B", "C", "D") or index
  let answerIdx = userAnswerIndex;
  if (typeof userAnswerIndex === "string") {
    answerIdx = "ABCD".indexOf(userAnswerIndex.toUpperCase());
  }

  const correctAnswerIndex = "ABCD".indexOf(question.answer);
  const isCorrect = answerIdx === correctAnswerIndex;
  // Fallback to 90s if time is missing/invalid (gives Par, not unearned birdie)
  const timeSpentSeconds = (timeSpentMs || 90000) / 1000;

  if (isCorrect) {
    if (timeSpentSeconds < 90) {
      return {
        type: "birdie",
        value: -1,
        label: "Birdie",
        description: "Under par! Correct in under 90s",
        cssClass: "rank--birdie",
      };
    } else {
      return {
        type: "par",
        value: 0,
        label: "Par",
        description: "On target. Correct answer.",
        cssClass: "rank--par",
      };
    }
  } else {
    // Determine how wrong the answer was
    // If user timed out or didn't answer, it's a double bogey
    if (
      answerIdx === -1 ||
      answerIdx === null ||
      userAnswerIndex === null ||
      userAnswerIndex === undefined
    ) {
      return {
        type: "double-bogey",
        value: 2,
        label: "Double Bogey",
        description: "No answer submitted",
        cssClass: "rank--double-bogey",
      };
    }

    // Best wrong answer check (if ranking data available)
    if (question.answerRanking && question.answerRanking[answerIdx] === 2) {
      return {
        type: "bogey",
        value: 1,
        label: "Bogey",
        description: "Close! Second-best answer",
        cssClass: "rank--bogey",
      };
    } else if (question.answerRanking) {
      // Ranking existed but they didn't pick the 'good' wrong answer
      return {
        type: "double-bogey",
        value: 2,
        label: "Double Bogey",
        description: "In the rough (Wrong answer)",
        cssClass: "rank--double-bogey",
      };
    }

    // Default without ranking data: treat first wrong as bogey (benefit of the doubt)
    return {
      type: "bogey",
      value: 1,
      label: "Bogey",
      description: "One over par",
      cssClass: "rank--bogey",
    };
  }
}

/**
 * Calculate overall round score (golf-style)
 * @param {Array} scores - Array of score objects
 * @returns {Object} Round summary with total, breakdown, and description
 */
export function calculateRoundScore(scores) {
  const total = scores.reduce((sum, s) => sum + s.value, 0);
  const birdies = scores.filter((s) => s.type === "birdie").length;
  const pars = scores.filter((s) => s.type === "par").length;
  const bogeys = scores.filter((s) => s.type === "bogey").length;
  const doubleBogeys = scores.filter((s) => s.type === "double-bogey").length;

  let rating = "";
  let description = "";

  // Golf scoring: Birdies are -1, Pars are 0, Bogeys are +1, Double bogeys are +2
  // Perfect birdie game would be -1 * N (under par)
  const parScore = 0; // Par is always 0 for the course

  if (total <= -scores.length * 0.5) {
    rating = "TOURNAMENT CHAMPION";
    description = "A truly spectacular round. You crushed it.";
  } else if (total < 0) {
    rating = "UNDER PAR";
    description = "Excellent play. Below par for the round.";
  } else if (total === 0) {
    rating = "EVEN PAR";
    description = "A solid round. Right on target.";
  } else if (total <= scores.length * 0.5) {
    rating = "OVER PAR";
    description = "A few rough patches, but respectable.";
  } else if (total <= scores.length) {
    rating = "STRUGGLING";
    description = "Time to hit the driving range.";
  } else {
    rating = "ROUGH DAY";
    description = "Everyone has off days. Come back stronger.";
  }

  return {
    totalScore: total,
    total, // Keep for backward compatibility
    rating,
    description,
    birdies,
    pars,
    bogeys,
    doubleBogeys,
    tripleBogeys: 0, // Not used in current system
    eagles: 0, // Not used in current system (eagles would be -2)
    breakdown: {
      birdies,
      pars,
      bogeys,
      doubleBogeys,
    },
    correctCount: birdies + pars,
    totalQuestions: scores.length,
    percentage: (((birdies + pars) / scores.length) * 100).toFixed(1),
  };
}

/**
 * Create the scorecard UI component
 * @param {Array} questions - Array of question objects
 * @param {Array} answers - Array of user answer indices
 * @param {Object} meta - Quiz metadata (times, duration, etc.)
 * @returns {HTMLElement} The scorecard DOM element
 */
export function createScorecard(questions, answers, meta) {
  const container = document.createElement("div");
  container.className = "scorecard-container lunaire-scorecard";

  // Calculate individual scores
  const questionTimes =
    meta.questionTimes ||
    new Array(questions.length).fill(
      (meta.duration_s * 1000) / questions.length,
    );

  const scores = questions.map((q, i) => ({
    ...calculateScore(q, answers[i], questionTimes[i]),
    questionNumber: i + 1,
    subject: q.subject || "Unknown Sector",
  }));

  // Calculate round summary
  const roundSummary = calculateRoundScore(scores);

  // Build the scorecard HTML
  container.innerHTML = `
    <div class="scorecard">
      <div class="scorecard__header">
        <div class="scorecard__club-logo">
          ${getIconString("pirateSkull", 48)}
        </div>
        <h2>Barbarossa's Crater</h2>
        <p class="scorecard__subtitle">Official Scorecard</p>
      </div>
      
      <div class="scorecard__summary">
        <div class="scorecard__total">
          <span class="scorecard__total-label">Score</span>
          <span class="scorecard__total-value ${
            roundSummary.total <= 0 ? "under-par" : "over-par"
          }">
            ${roundSummary.total > 0 ? "+" : ""}${roundSummary.total}
          </span>
        </div>
        
        <div class="scorecard__rating">
          <span class="scorecard__rating-badge">${roundSummary.rating}</span>
        </div>
        
        <div class="scorecard__stats-row">
          <div class="scorecard__stat">
            <span class="scorecard__stat-value">${
              roundSummary.percentage
            }%</span>
            <span class="scorecard__stat-label">Accuracy</span>
          </div>
          <div class="scorecard__stat">
            <span class="scorecard__stat-value">${roundSummary.correctCount}/${
    roundSummary.totalQuestions
  }</span>
            <span class="scorecard__stat-label">Correct</span>
          </div>
          <div class="scorecard__stat">
            <span class="scorecard__stat-value">${formatDuration(
              meta.duration_s,
            )}</span>
            <span class="scorecard__stat-label">Time</span>
          </div>
        </div>
      </div>
      
      <div class="scorecard__breakdown">
        <h3>Breakdown</h3>
        ${renderScoreBreakdown(roundSummary.breakdown)}
      </div>
      
      <div class="scorecard__table-wrapper">
        <table class="scorecard__table">
          <thead>
            <tr>
              <th>Target</th>
              ${renderHoleHeaders(scores, "front")}
              <th class="scorecard__subtotal">Sec 1</th>
            </tr>
          </thead>
          <tbody>
            <tr class="scorecard__par-row">
              <td>Std</td>
              ${renderParCells(scores, "front")}
              <td class="scorecard__subtotal">${
                Math.min(9, scores.length) * 0
              }</td>
            </tr>
            <tr class="scorecard__score-row">
              <td>Rank</td>
              ${renderScoreCells(scores, "front")}
              <td class="scorecard__subtotal">${calculateSubtotal(
                scores,
                "front",
              )}</td>
            </tr>
          </tbody>
        </table>
        
        ${scores.length > 9 ? renderBackNine(scores) : ""}
      </div>
      
      <div class="scorecard__footer">
        <div class="scorecard__legend">
          <span class="legend-item rank--birdie">Birdie -1</span>
          <span class="legend-item rank--par">Par 0</span>
          <span class="legend-item rank--bogey">Bogey +1</span>
          <span class="legend-item rank--double-bogey">Double +2</span>
        </div>
        
        <p class="club-fine-print">
            Barbarossa's Crater Golf Club. Under 90s for birdie.
        </p>
      </div>
    </div>
    
    <div class="scorecard__actions">
      <button class="btn-lunaire btn-lunaire--primary" id="reviewQuestionsBtn">
        ${getIconString("book", 20)}
        Review
      </button>
      <button class="btn-lunaire btn-lunaire--secondary" id="playAgainBtn">
        ${getIconString("play", 20)}
        Play Again
      </button>
      <button class="btn-lunaire btn-lunaire--tertiary" id="returnToClubhouseBtn">
        ${getIconString("clubhouse", 20)}
        Clubhouse
      </button>
    </div>
  `;

  // Store scores data for later access
  container.dataset.scores = JSON.stringify(scores);
  container.dataset.roundSummary = JSON.stringify(roundSummary);

  return container;
}

/**
 * Render the score breakdown badges (golf terminology)
 */
function renderScoreBreakdown(breakdown) {
  const items = [
    {
      label: "Birdie",
      value: breakdown.birdies,
      class: "rank--birdie",
      icon: "golfBall",
    },
    {
      label: "Par",
      value: breakdown.pars,
      class: "rank--par",
      icon: "check",
    },
    {
      label: "Bogey",
      value: breakdown.bogeys,
      class: "rank--bogey",
      icon: "warning",
    },
    {
      label: "Double Bogey",
      value: breakdown.doubleBogeys,
      class: "rank--double-bogey",
      icon: "wrong",
    },
  ];

  return `
    <div class="scorecard__breakdown-grid">
      ${items
        .filter((item) => item.value > 0)
        .map(
          (item) => `
        <div class="scorecard__breakdown-item ${item.class}">
          ${getIconString(item.icon, 16)}
          <span class="breakdown-value">${item.value}</span>
          <span class="breakdown-label">${item.label}</span>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

/**
 * Render hole number headers
 */
function renderHoleHeaders(scores, nine = "front") {
  const start = nine === "front" ? 0 : 9;
  const end =
    nine === "front" ? Math.min(9, scores.length) : Math.min(18, scores.length);

  return scores
    .slice(start, end)
    .map((s, i) => `<th>${start + i + 1}</th>`)
    .join("");
}

/**
 * Render par cells (always 0 for our scoring)
 */
function renderParCells(scores, nine = "front") {
  const start = nine === "front" ? 0 : 9;
  const end =
    nine === "front" ? Math.min(9, scores.length) : Math.min(18, scores.length);

  return scores
    .slice(start, end)
    .map(() => `<td>0</td>`)
    .join("");
}

/**
 * Render score cells with appropriate styling
 */
function renderScoreCells(scores, nine = "front") {
  const start = nine === "front" ? 0 : 9;
  const end =
    nine === "front" ? Math.min(9, scores.length) : Math.min(18, scores.length);

  return scores
    .slice(start, end)
    .map(
      (score) => `
    <td class="${score.cssClass}" title="${score.description}">
      ${score.value > 0 ? "+" : ""}${score.value}
    </td>
  `,
    )
    .join("");
}

/**
 * Calculate subtotal for a nine
 */
function calculateSubtotal(scores, nine = "front") {
  const start = nine === "front" ? 0 : 9;
  const end =
    nine === "front" ? Math.min(9, scores.length) : Math.min(18, scores.length);

  const subtotal = scores
    .slice(start, end)
    .reduce((sum, s) => sum + s.value, 0);
  return subtotal > 0 ? `+${subtotal}` : subtotal;
}

/**
 * Render back nine table if needed
 */
function renderBackNine(scores) {
  if (scores.length <= 9) return "";

  return `
    <table class="scorecard__table scorecard__table--back">
      <thead>
        <tr>
          <th>Target</th>
          ${renderHoleHeaders(scores, "back")}
          <th class="scorecard__subtotal">Sec 2</th>
          <th class="scorecard__total-col">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr class="scorecard__par-row">
          <td>Std</td>
          ${renderParCells(scores, "back")}
          <td class="scorecard__subtotal">${(scores.length - 9) * 0}</td>
          <td class="scorecard__total-col">${scores.length * 0}</td>
        </tr>
        <tr class="scorecard__score-row">
          <td>Rank</td>
          ${renderScoreCells(scores, "back")}
          <td class="scorecard__subtotal">${calculateSubtotal(
            scores,
            "back",
          )}</td>
          <td class="scorecard__total-col ${
            scores.reduce((s, sc) => s + sc.value, 0) <= 0
              ? "under-par"
              : "over-par"
          }">
            ${formatTotal(scores.reduce((s, sc) => s + sc.value, 0))}
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

/**
 * Format duration in mm:ss
 */
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format total score with +/- prefix
 */
function formatTotal(total) {
  if (total === 0) return "E"; // Even (Ensign level)
  return total > 0 ? `+${total}` : total;
}

/**
 * Create a mini scorecard for inline display
 */
export function createMiniScorecard(correctCount, totalCount, durationSeconds) {
  const score = totalCount - correctCount; // Basic approx

  return `
    <div class="mini-scorecard">
      <span class="mini-scorecard__score ${
        score <= 0 ? "under-par" : "over-par"
      }">
        ${score > 0 ? "+" : ""}${score}
      </span>
      <span class="mini-scorecard__stats">${correctCount}/${totalCount} • ${formatDuration(
    durationSeconds,
  )}</span>
    </div>
  `;
}

/**
 * Scorecard-specific CSS (should be imported alongside lunaire-design-system.css)
 */
// CSS moved to src/css/lunaire-design-system.css
export const scorecardStyles = ``;

// Export everything needed
export default {
  createScorecard,
  createMiniScorecard,
  calculateScore,
  calculateRoundScore,
  scorecardStyles,
};
