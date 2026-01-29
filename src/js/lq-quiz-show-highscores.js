/**
 * Quiz Show High Scores Display
 * Shows leaderboard and manages high score data
 */

export class QuizShowHighScores {
  constructor() {
    this.highScoreKey = "lawquizzer-quiz-show-highscores";
    this.maxScores = 10;
  }

  /**
   * Get all high scores
   */
  getHighScores() {
    const scores = localStorage.getItem(this.highScoreKey);
    return scores ? JSON.parse(scores) : [];
  }

  /**
   * Add a new high score
   */
  addScore(scoreData) {
    const scores = this.getHighScores();
    scores.push({
      ...scoreData,
      id: Date.now().toString(),
      timestamp: Date.now(),
    });

    // Sort by game show score (descending)
    scores.sort((a, b) => b.score - a.score);

    // Keep only top scores
    const topScores = scores.slice(0, this.maxScores);

    localStorage.setItem(this.highScoreKey, JSON.stringify(topScores));

    // Return rank (1-based)
    const rank = topScores.findIndex((s) => s.id === scoreData.id) + 1;
    return rank <= this.maxScores ? rank : null;
  }

  /**
   * Check if score qualifies for high score list
   */
  isHighScore(score) {
    const scores = this.getHighScores();
    if (scores.length < this.maxScores) return true;
    return score > scores[scores.length - 1].score;
  }

  /**
   * Clear all high scores
   */
  clearHighScores() {
    localStorage.removeItem(this.highScoreKey);
  }

  /**
   * Create high scores display element
   */
  createHighScoresDisplay(currentScore = null) {
    const container = document.createElement("div");
    container.className = "high-scores-display";

    const scores = this.getHighScores();

    container.innerHTML = `
      <div class="high-scores-header">
        <h2>${getIconString(
          "trophy",
          32,
        )} QUIZ SHOW HALL OF FAME ${getIconString("trophy", 32)}</h2>
        <p>Top 10 Game Show Champions</p>
      </div>
      <div class="high-scores-list">
        ${
          scores.length === 0
            ? '<div class="no-scores">No high scores yet! Be the first champion!</div>'
            : scores
                .map((score, index) =>
                  this.createScoreRow(score, index + 1, currentScore),
                )
                .join("")
        }
      </div>
      <div class="high-scores-footer">
        <button class="clear-scores-btn">Clear All Scores</button>
        <button class="close-scores-btn">Close</button>
      </div>
    `;

    // Add event listeners
    const clearBtn = container.querySelector(".clear-scores-btn");
    const closeBtn = container.querySelector(".close-scores-btn");

    clearBtn.addEventListener("click", () => {
      if (
        confirm(
          "Are you sure you want to clear all high scores? This cannot be undone.",
        )
      ) {
        this.clearHighScores();
        // Refresh display
        const newDisplay = this.createHighScoresDisplay();
        container.parentElement.replaceChild(newDisplay, container);
      }
    });

    closeBtn.addEventListener("click", () => {
      container.remove();
    });

    return container;
  }

  /**
   * Create individual score row
   */
  createScoreRow(score, rank, currentScore) {
    const isCurrentScore = currentScore && currentScore.id === score.id;
    const date = new Date(score.timestamp).toLocaleDateString();
    const time = new Date(score.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Determine rank styling
    let rankClass = "rank-normal";
    let rankIcon = getIconString("star", 20);
    if (rank === 1) {
      rankClass = "rank-gold";
      rankIcon = getIconString("trophy", 24);
    } else if (rank === 2) {
      rankClass = "rank-silver";
      rankIcon = getIconString("star", 24);
    } else if (rank === 3) {
      rankClass = "rank-bronze";
      rankIcon = getIconString("star", 24);
    }

    return `
      <div class="score-row ${rankClass} ${
      isCurrentScore ? "current-score" : ""
    }" data-rank="${rank}">
        <div class="score-rank">
          <span class="rank-icon">${rankIcon}</span>
          <span class="rank-number">#${rank}</span>
        </div>
        <div class="score-details">
          <div class="score-main">
            <span class="game-show-score">${score.score.toLocaleString()}</span>
            <span class="traditional-score">(${score.traditionalScore} - ${
      score.percentage
    }%)</span>
          </div>
          <div class="score-meta">
            <span class="score-questions">${score.questions} questions</span>
            <span class="score-date">${date} ${time}</span>
          </div>
        </div>
        ${isCurrentScore ? '<div class="new-score-badge">NEW!</div>' : ""}
      </div>
    `;
  }

  /**
   * Show high scores modal
   */
  showHighScoresModal(currentScore = null) {
    // Remove any existing modal
    const existingModal = document.querySelector(".high-scores-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.className = "high-scores-modal";
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content high-scores-modal-content">
        <div class="modal-close">&times;</div>
      </div>
    `;

    const modalContent = modal.querySelector(".modal-content");
    const closeBtn = modal.querySelector(".modal-close");
    const backdrop = modal.querySelector(".modal-backdrop");

    // Add high scores display
    const highScoresDisplay = this.createHighScoresDisplay(currentScore);
    modalContent.appendChild(highScoresDisplay);

    // Close handlers
    const closeModal = () => modal.remove();
    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);

    // Escape key handler
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);

    document.body.appendChild(modal);

    return modal;
  }

  /**
   * Show high score achievement notification
   */
  showHighScoreAchievement(rank, score) {
    const notification = document.createElement("div");
    notification.className = "high-score-achievement";

    let message = "";
    let icon = getIconString("star", 32);

    if (rank === 1) {
      message = "NEW CHAMPION!";
      icon = getIconString("trophy", 48);
    } else if (rank === 2) {
      message = "RUNNER-UP!";
      icon = getIconString("star", 40);
    } else if (rank === 3) {
      message = "THIRD PLACE!";
      icon = getIconString("star", 36);
    } else {
      message = `TOP ${rank}!`;
      icon = getIconString("trophy", 32);
    }

    notification.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-icon">${icon}</div>
        <div class="achievement-title">${message}</div>
        <div class="achievement-subtitle">High Score: ${score.toLocaleString()}</div>
        <div class="achievement-sparkles">
          ${Array.from({ length: 8 }, () => '<div class="sparkle"></div>').join(
            "",
          )}
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after animation
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => notification.remove(), 1000);
    }, 4000);

    return notification;
  }
}

/**
 * Singleton instance
 */
export const quizShowHighScores = new QuizShowHighScores();
