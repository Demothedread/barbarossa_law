/**
 * Friendly Mode - Baseball Theme Educational Experience
 * Provides no-timer, immediate answer reveal, topic selection, and baseball-themed interface
 */

import { fetchSubjects } from "./lq-api.js";
import { getIconString } from "./lunaire-icons.js";

export class FriendlyMode {
  constructor(questions, options, onComplete) {
    this.questions = questions;
    this.options = options;
    this.onComplete = onComplete;
    this.currentQuestion = 0;
    this.answers = new Array(questions.length).fill(null);
    this.eliminated = {};
    this.startTime = Date.now();
    this.runsFor = 0; // Correct answers
    this.runsAgainst = 0; // Incorrect answers
    this.currentInning = 1;
    this.onDeckTopic = null;
    this.inTheHoleTopic = null;
    this.answerRevealed = false;
    this.subjects = [];

    // Hide answers until end option - when true, don't reveal answers immediately
    this.hideAnswersUntilEnd = options.hideAnswersUntilEnd || false;

    // Baseball terminology and phrases
    this.encouragementPhrases = [
      "Step up to the plate!",
      "Take your stance!",
      "Here comes the pitch!",
      "Batter up!",
      "Eye on the ball!",
      "Swing for the fences!",
      "Play ball!",
      "Top of the inning!",
    ];

    this.correctPhrases = [
      "Home run! Outstanding!",
      "Grand slam! Perfect answer!",
      "Safe at home! Well done!",
      "You knocked it out of the park!",
      "Triple play! Excellent!",
      "RBI single! Nice work!",
      "Walk-off winner! Amazing!",
      "Bases loaded success!",
    ];

    this.wrongPhrases = [
      "Strike out! Better luck next time.",
      "Caught looking! The correct answer is...",
      "Swing and a miss! Here's the right call...",
      "Foul ball! Close, but the answer is...",
      "Pop fly out! The correct answer is...",
      "Ground out to first! The answer is...",
      "Called strike three! The right answer is...",
      "Picked off! The correct answer is...",
    ];

    this.loadSubjects();
  }

  /**
   * Load available subjects for topic selection
   */
  async loadSubjects() {
    try {
      const response = await fetchSubjects();
      this.subjects = response || [];
    } catch (error) {
      console.warn("Could not load subjects for topic selection:", error);
      this.subjects = [];
    }
  }

  /**
   * Start the Friendly Mode experience with baseball intro
   */
  async start() {
    const container = document.createElement("div");
    container.className = "friendly-mode-container baseball-theme";

    // Show baseball intro first
    await this.showBaseballIntro(container);

    // Initialize the main quiz interface
    this.initializeQuizInterface(container);

    return container;
  }

  /**
   * Baseball stadium style intro sequence
   */
  async showBaseballIntro(container) {
    return new Promise((resolve) => {
      const intro = document.createElement("div");
      intro.className = "baseball-intro";
      intro.innerHTML = `
        <div class="stadium-intro">
          <div class="baseball-logo">
            <div class="logo-baseball">${getIconString("baseball", 64)}</div>
            <div class="logo-text">FRIENDLY MODE</div>
            <div class="logo-subtitle">Legal Knowledge Baseball</div>
          </div>
          <div class="stadium-announcement">
            <p>Welcome to the friendly ballpark!</p>
            <p>Take your time with <strong>${
              this.questions.length
            } questions</strong></p>
            <p>No timers, no pressure - just learning!</p>
            <p>Choose your topics and play at your own pace.</p>
          </div>
          <div class="baseball-field">
            <div class="diamond"></div>
            <div class="pitcher-mound"></div>
            <div class="home-plate"></div>
          </div>
          <button class="play-ball-btn">PLAY BALL!</button>
          <div class="skip-intro">
            <span>Skip intro (Space)</span>
          </div>
        </div>
      `;

      container.appendChild(intro);

      const startGame = () => {
        this.playBaseballSound("transition");
        intro.remove();
        resolve();
      };

      const skipHandler = (e) => {
        if (e.code === "Space") {
          e.preventDefault();
          startGame();
        }
      };

      intro
        .querySelector(".play-ball-btn")
        .addEventListener("click", startGame);
      intro.querySelector(".skip-intro").addEventListener("click", startGame);
      document.addEventListener("keydown", skipHandler);

      // Auto-start after 8 seconds if no interaction
      setTimeout(() => {
        if (container.contains(intro)) {
          document.removeEventListener("keydown", skipHandler);
          startGame();
        }
      }, 8000);
    });
  }

  /**
   * Initialize the main quiz interface with baseball theme
   */
  initializeQuizInterface(container) {
    container.innerHTML = "";

    // Add baseball field background
    container.classList.add("baseball-field-bg");

    // Create main structure
    const gameContainer = document.createElement("div");
    gameContainer.className = "baseball-game-container";

    // Create scoreboard
    const scoreboard = this.createScoreboard();
    gameContainer.appendChild(scoreboard);

    // Create main playing field
    const playingField = document.createElement("div");
    playingField.className = "playing-field";

    // Create question display area
    const questionArea = this.createQuestionArea();
    playingField.appendChild(questionArea);

    // Create topic selection area (on deck / in the hole)
    const topicSelector = this.createTopicSelector();
    playingField.appendChild(topicSelector);

    gameContainer.appendChild(playingField);

    // Create navigation
    const navigation = this.createNavigation();
    gameContainer.appendChild(navigation);

    container.appendChild(gameContainer);

    // Start the first question
    this.startQuestion(0);
  }

  /**
   * Create baseball scoreboard
   */
  createScoreboard() {
    const scoreboard = document.createElement("div");
    scoreboard.className = "baseball-scoreboard";
    scoreboard.innerHTML = `
      <div class="scoreboard-header">
        <div class="team-name visitor">LAW SCHOOL</div>
        <div class="scoreboard-title">SCOREBOARD</div>
        <div class="team-name home">YOU</div>
      </div>
      <div class="scoreboard-scores">
        <div class="score-section">
          <div class="score-label">RUNS</div>
          <div class="score-display">
            <div class="visitor-score">${this.runsAgainst}</div>
            <div class="home-score">${this.runsFor}</div>
          </div>
        </div>
        <div class="inning-section">
          <div class="inning-label">INNING</div>
          <div class="inning-display">${this.currentInning} / ${
      this.questions.length
    }</div>
        </div>
      </div>
      <div class="at-bat-info">
        <div class="batter-name">AT BAT: Question ${
          this.currentQuestion + 1
        }</div>
      </div>
    `;
    return scoreboard;
  }

  /**
   * Create question display area
   */
  createQuestionArea() {
    const questionArea = document.createElement("div");
    questionArea.className = "question-area pitcher-mound-area";
    questionArea.innerHTML = `
      <div class="question-header">
        <div class="encouragement-text">${this.getRandomPhrase(
          this.encouragementPhrases,
        )}</div>
        <div class="question-counter">Question ${this.currentQuestion + 1} of ${
      this.questions.length
    }</div>
      </div>
      <div class="question-container">
        <div class="question-text"></div>
        <div class="answer-choices"></div>
      </div>
      <div class="answer-reveal" style="display: none;">
        <div class="reveal-header"></div>
        <div class="reveal-explanation"></div>
        <div class="reveal-actions">
          <button class="continue-btn">Continue to Next</button>
        </div>
      </div>
    `;
    return questionArea;
  }

  /**
   * Create topic selector (on deck / in the hole)
   */
  createTopicSelector() {
    const selector = document.createElement("div");
    selector.className = "topic-selector dugout-area";
    selector.innerHTML = `
      <div class="selector-header">
        <h3>${getIconString("stadium", 24)} Choose Your Next Topics</h3>
      </div>
      <div class="lineup-card">
        <div class="batting-order">
          <div class="on-deck-section">
            <div class="position-label">ON DECK ${getIconString(
              "bat",
              20,
            )}</div>
            <select class="on-deck-selector">
              <option value="">Choose Next Topic...</option>
            </select>
          </div>
          <div class="in-hole-section">
            <div class="position-label">IN THE HOLE ${getIconString(
              "baseball",
              20,
            )}</div>
            <select class="in-hole-selector">
              <option value="">Choose Topic After Next...</option>
            </select>
          </div>
        </div>
      </div>
    `;

    // Populate subject options
    this.populateTopicSelectors(selector);

    return selector;
  }

  /**
   * Populate topic selectors with available subjects
   */
  populateTopicSelectors(selector) {
    const onDeckSelect = selector.querySelector(".on-deck-selector");
    const inHoleSelect = selector.querySelector(".in-hole-selector");

    // Add subject options
    this.subjects.forEach((subject) => {
      const onDeckOption = document.createElement("option");
      onDeckOption.value = subject;
      onDeckOption.textContent = subject;
      onDeckSelect.appendChild(onDeckOption);

      const inHoleOption = document.createElement("option");
      inHoleOption.value = subject;
      inHoleOption.textContent = subject;
      inHoleSelect.appendChild(inHoleOption);
    });

    // Add random option
    const randomOnDeck = document.createElement("option");
    randomOnDeck.value = "random";
    randomOnDeck.textContent = "Random Topic";
    onDeckSelect.appendChild(randomOnDeck);

    const randomInHole = document.createElement("option");
    randomInHole.value = "random";
    randomInHole.textContent = "Random Topic";
    inHoleSelect.appendChild(randomInHole);

    // Event listeners
    onDeckSelect.addEventListener("change", () => {
      this.onDeckTopic = onDeckSelect.value;
    });

    inHoleSelect.addEventListener("change", () => {
      this.inTheHoleTopic = inHoleSelect.value;
    });
  }

  /**
   * Create navigation controls
   */
  createNavigation() {
    const nav = document.createElement("div");
    nav.className = "baseball-navigation";
    nav.innerHTML = `
      <div class="nav-left">
        <button class="nav-btn prev-btn" disabled>${getIconString(
          "arrowLeft",
          16,
        )} Previous</button>
      </div>
      <div class="nav-center">
        <button class="nav-btn home-btn">${getIconString(
          "clubhouse",
          16,
        )} Home Plate</button>
      </div>
      <div class="nav-right">
        <button class="nav-btn next-btn">Next ${getIconString(
          "arrowRight",
          16,
        )}</button>
      </div>
    `;

    // Event listeners
    const prevBtn = nav.querySelector(".prev-btn");
    const nextBtn = nav.querySelector(".next-btn");
    const homeBtn = nav.querySelector(".home-btn");

    prevBtn.addEventListener("click", () => this.previousQuestion());
    nextBtn.addEventListener("click", () => this.nextQuestion());
    homeBtn.addEventListener("click", () => this.finishQuiz());

    return nav;
  }

  /**
   * Start a question
   */
  startQuestion(index) {
    this.currentQuestion = index;
    this.currentInning = index + 1;
    this.answerRevealed = false;

    const question = this.questions[index];
    this.renderQuestion(question);
    this.updateScoreboard();
    this.updateNavigation();

    // Play encouragement sound
    this.playBaseballSound("click");
  }

  /**
   * Render question content
   */
  renderQuestion(question) {
    const container = document.querySelector(".question-container");
    const questionText = container.querySelector(".question-text");
    const answerChoices = container.querySelector(".answer-choices");
    const answerReveal = document.querySelector(".answer-reveal");

    // Hide answer reveal initially
    answerReveal.style.display = "none";

    // Show question
    questionText.innerHTML = `
      <div class="question-prompt">
        <span class="question-number">Q${this.currentQuestion + 1}:</span>
        ${question.question}
      </div>
    `;

    // Create answer choices
    answerChoices.innerHTML = "";
    question.choices.forEach((choice, index) => {
      const choiceBtn = document.createElement("button");
      choiceBtn.className = "choice-btn";
      choiceBtn.innerHTML = `
        <span class="choice-letter">${String.fromCharCode(65 + index)}</span>
        <span class="choice-text">${choice}</span>
      `;

      // Check if this choice was previously selected or eliminated
      if (this.answers[this.currentQuestion] === index) {
        choiceBtn.classList.add("selected");
      }
      if (
        this.eliminated[this.currentQuestion] &&
        this.eliminated[this.currentQuestion][index]
      ) {
        choiceBtn.classList.add("eliminated");
      }

      choiceBtn.addEventListener("click", () => this.selectAnswer(index));

      // Add elimination button
      const eliminateBtn = document.createElement("button");
      eliminateBtn.className = "eliminate-btn";
      eliminateBtn.innerHTML = getIconString("close", 14);
      eliminateBtn.title = "Strike out this choice";
      eliminateBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.eliminateChoice(index);
      });

      const choiceContainer = document.createElement("div");
      choiceContainer.className = "choice-container";
      choiceContainer.appendChild(choiceBtn);
      choiceContainer.appendChild(eliminateBtn);

      answerChoices.appendChild(choiceContainer);
    });

    // Update encouragement text
    document.querySelector(".encouragement-text").textContent =
      this.getRandomPhrase(this.encouragementPhrases);

    // Update question counter
    document.querySelector(".question-counter").textContent = `Question ${
      this.currentQuestion + 1
    } of ${this.questions.length}`;
  }

  /**
   * Handle answer selection
   */
  selectAnswer(choiceIndex) {
    if (this.answerRevealed) return;

    this.answers[this.currentQuestion] = choiceIndex;

    // Update UI to show selection
    document.querySelectorAll(".choice-btn").forEach((btn, index) => {
      btn.classList.toggle("selected", index === choiceIndex);
    });

    // Only reveal answer immediately if hideAnswersUntilEnd is false
    if (!this.hideAnswersUntilEnd) {
      // Immediately reveal the answer (key feature of friendly mode when not hiding)
      this.revealAnswer();
    } else {
      // Show a "move to next" option without revealing the answer
      this.showContinueWithoutReveal();
    }
  }

  /**
   * Show continue button without revealing the answer
   */
  showContinueWithoutReveal() {
    const answerReveal = document.querySelector(".answer-reveal");
    if (!answerReveal) return;

    answerReveal.innerHTML = `
      <div class="answer-pending">
        <div class="pending-header">
          ${getIconString("lock", 24)}
          <span>Answer locked in!</span>
        </div>
        <p class="pending-text">Correct answer will be revealed at the end of the quiz.</p>
        <button class="continue-btn baseball-btn">
          ${getIconString("arrowRight", 18)} Next Question
        </button>
      </div>
    `;
    answerReveal.style.display = "block";

    const continueBtn = answerReveal.querySelector(".continue-btn");
    continueBtn.addEventListener("click", () => {
      if (this.currentQuestion < this.questions.length - 1) {
        this.nextQuestion();
      } else {
        this.finishQuiz();
      }
    });
  }

  /**
   * Eliminate a choice
   */
  eliminateChoice(choiceIndex) {
    if (this.answerRevealed) return;

    if (!this.eliminated[this.currentQuestion]) {
      this.eliminated[this.currentQuestion] = {};
    }

    this.eliminated[this.currentQuestion][choiceIndex] = true;

    // Update UI
    const choiceContainers = document.querySelectorAll(".choice-container");
    if (choiceContainers[choiceIndex]) {
      choiceContainers[choiceIndex]
        .querySelector(".choice-btn")
        .classList.add("eliminated");
    }

    this.playBaseballSound("click");
  }

  /**
   * Reveal the correct answer immediately
   */
  revealAnswer() {
    this.answerRevealed = true;
    const question = this.questions[this.currentQuestion];
    const userAnswer = this.answers[this.currentQuestion];
    const correctIndex = question.choices.findIndex(
      (choice) =>
        choice === question.answer ||
        String.fromCharCode(65 + question.choices.indexOf(choice)) ===
          question.answer,
    );

    const isCorrect = userAnswer === correctIndex;

    // Update scores
    if (isCorrect) {
      this.runsFor++;
      this.playBaseballSound("correct");
    } else {
      this.runsAgainst++;
      this.playBaseballSound("wrong");
    }

    // Show answer choices with correct/incorrect highlighting
    document.querySelectorAll(".choice-btn").forEach((btn, index) => {
      if (index === correctIndex) {
        btn.classList.add("correct");
      } else if (index === userAnswer) {
        btn.classList.add("incorrect");
      }
      btn.disabled = true;
    });

    // Show answer reveal section
    const answerReveal = document.querySelector(".answer-reveal");
    const revealHeader = answerReveal.querySelector(".reveal-header");
    const revealExplanation = answerReveal.querySelector(".reveal-explanation");

    if (isCorrect) {
      revealHeader.innerHTML = `
        <div class="result-correct">
          <span class="result-icon">${getIconString("trophy", 32)}</span>
          <span class="result-text">${this.getRandomPhrase(
            this.correctPhrases,
          )}</span>
        </div>
      `;
    } else {
      revealHeader.innerHTML = `
        <div class="result-incorrect">
          <span class="result-icon">${getIconString("baseball", 32)}</span>
          <span class="result-text">${this.getRandomPhrase(
            this.wrongPhrases,
          )}</span>
        </div>
        <div class="correct-answer">
          Correct answer: <strong>${String.fromCharCode(
            65 + correctIndex,
          )}</strong> - ${question.choices[correctIndex]}
        </div>
      `;
    }

    // Show explanation if available
    if (question.explanation) {
      revealExplanation.innerHTML = `
        <div class="explanation-content">
          <h4>${getIconString("book", 20)} Learning Corner</h4>
          <p>${question.explanation}</p>
        </div>
      `;
    }

    answerReveal.style.display = "block";

    // Set up continue button
    const continueBtn = answerReveal.querySelector(".continue-btn");
    continueBtn.addEventListener("click", () => {
      if (this.currentQuestion < this.questions.length - 1) {
        this.nextQuestion();
      } else {
        this.finishQuiz();
      }
    });

    this.updateScoreboard();
  }

  /**
   * Navigate to previous question
   */
  previousQuestion() {
    if (this.currentQuestion > 0) {
      this.startQuestion(this.currentQuestion - 1);
    }
  }

  /**
   * Navigate to next question
   */
  nextQuestion() {
    if (this.currentQuestion < this.questions.length - 1) {
      this.startQuestion(this.currentQuestion + 1);
    } else {
      this.finishQuiz();
    }
  }

  /**
   * Update scoreboard display
   */
  updateScoreboard() {
    const scoreboard = document.querySelector(".baseball-scoreboard");
    if (scoreboard) {
      scoreboard.querySelector(".visitor-score").textContent = this.runsAgainst;
      scoreboard.querySelector(".home-score").textContent = this.runsFor;
      scoreboard.querySelector(
        ".inning-display",
      ).textContent = `${this.currentInning} / ${this.questions.length}`;
      scoreboard.querySelector(
        ".batter-name",
      ).textContent = `AT BAT: Question ${this.currentQuestion + 1}`;
    }
  }

  /**
   * Update navigation buttons
   */
  updateNavigation() {
    const prevBtn = document.querySelector(".prev-btn");
    const nextBtn = document.querySelector(".next-btn");

    if (prevBtn) prevBtn.disabled = this.currentQuestion === 0;
    if (nextBtn) {
      nextBtn.innerHTML =
        this.currentQuestion === this.questions.length - 1
          ? "Final Score"
          : "Next " + getIconString("arrowRight", 16);
    }
  }

  /**
   * Finish the quiz and show results
   */
  finishQuiz() {
    const duration = Math.ceil((Date.now() - this.startTime) / 1000);

    // Calculate final score
    let correct = 0;
    this.questions.forEach((q, i) => {
      if (this.answers[i] !== null) {
        const correctIndex = q.choices.findIndex(
          (choice) =>
            choice === q.answer ||
            String.fromCharCode(65 + q.choices.indexOf(choice)) === q.answer,
        );
        if (this.answers[i] === correctIndex) correct++;
      }
    });

    // Prepare results
    const results = {
      correct,
      total: this.questions.length,
      duration_s: duration,
      eliminated: this.eliminated,
      negative_time: false, // No timer in friendly mode
      timer: 0, // No timer
      mode: "friendly",
      runsFor: this.runsFor,
      runsAgainst: this.runsAgainst,
      baseballScore: `${this.runsFor} - ${this.runsAgainst}`,
    };

    this.onComplete(this.questions, this.answers, results);
  }

  /**
   * Get random phrase from array
   */
  getRandomPhrase(phrases) {
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  /**
   * Play baseball-themed sounds
   */
  playBaseballSound(soundType) {
    if (window.themeManager && window.themeManager.audioManager) {
      window.themeManager.audioManager.playSound(soundType, 0.4);
    }
  }
}

/**
 * Create Friendly Mode instance
 */
export function createFriendlyMode(questions, options, onComplete) {
  const friendlyMode = new FriendlyMode(questions, options, onComplete);
  return friendlyMode.start();
}
