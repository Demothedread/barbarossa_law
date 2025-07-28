/**
 * Quiz Show Mode - 1970s Game Show Experience
 * Provides TV show intro, enhanced timer, game show scoring, and themed interface
 */

import { quizShowHighScores } from './lq-quiz-show-highscores.js';

export class QuizShowMode {
  constructor(questions, options, onComplete) {
    this.questions = questions;
    this.options = options;
    this.onComplete = onComplete;
    this.currentQuestion = 0;
    this.answers = new Array(questions.length).fill(null);
    this.eliminated = {};
    this.startTime = Date.now();
    this.questionStartTimes = [];
    this.gameShowScore = 0;
    this.traditionalScore = 0;
    this.timerWarningPlayed = false;
    this.questionTimers = [];
    
    // High score key
    this.highScoreKey = 'lawquizzer-quiz-show-highscores';
    
    // Game show phrases
    this.encouragementPhrases = [
      "Let's play!",
      "Survey says...",
      "Final answer?",
      "Come on down!",
      "Big money, big money!",
      "You're in the hot seat!",
      "Going for the gold!",
      "Time to spin the wheel!",
      "And the answer is..."
    ];
    
    this.correctPhrases = [
      "Ding ding ding! That's correct!",
      "You got it! Fantastic!",
      "Right on the money!",
      "Jackpot! Well done!",
      "Bulls-eye! Outstanding!",
      "Perfect! You're on fire!",
      "Bingo! That's the answer!",
      "Home run! Excellent!"
    ];
    
    this.wrongPhrases = [
      "Ooh, sorry! That's not it.",
      "Close, but no cigar!",
      "Not quite! Better luck next time.",
      "Swing and a miss!",
      "So close! The correct answer is...",
      "Not this time, champ!",
      "Almost had it!",
      "Good try, but that's incorrect."
    ];
  }

  /**
   * Start the Quiz Show experience with TV intro
   */
  async start() {
    const container = document.createElement('div');
    container.className = 'quiz-show-container';
    
    // Show TV intro first
    await this.showTVIntro(container);
    
    // Initialize the main quiz interface
    this.initializeQuizInterface(container);
    
    return container;
  }

  /**
   * TV Show style intro sequence
   */
  async showTVIntro(container) {
    return new Promise((resolve) => {
      const intro = document.createElement('div');
      intro.className = 'tv-intro';
      intro.innerHTML = `
        <div class="intro-content">
          <div class="game-show-logo">
            <div class="logo-text">QUIZ SHOW</div>
            <div class="logo-subtitle">Legal Knowledge Challenge</div>
          </div>
          <div class="host-announcement">
            <p>Welcome to the most exciting legal quiz show on television!</p>
            <p>Today's contestant will face <strong>${this.questions.length} challenging questions</strong></p>
            <p>with <strong>${this.options.timer} minutes per question</strong>!</p>
          </div>
          <div class="intro-sparkles">
            ${Array.from({length: 12}, () => '<div class="sparkle"></div>').join('')}
          </div>
          <button class="start-show-btn">LET'S PLAY!</button>
          <div class="skip-intro">
            <small>Press SPACE to skip intro</small>
          </div>
        </div>
      `;
      
      container.appendChild(intro);
      
      // Add sparkle animations
      this.animateSparkles(intro);
      
      // Play intro music if available
      this.playIntroMusic();
      
      // Auto-advance or manual start
      const startBtn = intro.querySelector('.start-show-btn');
      let autoAdvanceTimer;
      
      const startShow = () => {
        clearTimeout(autoAdvanceTimer);
        intro.classList.add('fade-out');
        setTimeout(() => {
          container.removeChild(intro);
          resolve();
        }, 1000);
      };
      
      startBtn.addEventListener('click', startShow);
      
      // Skip with spacebar
      const skipHandler = (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          document.removeEventListener('keydown', skipHandler);
          startShow();
        }
      };
      document.addEventListener('keydown', skipHandler);
      
      // Auto-advance after 5 seconds
      autoAdvanceTimer = setTimeout(() => {
        document.removeEventListener('keydown', skipHandler);
        startShow();
      }, 5000);
    });
  }

  /**
   * Initialize the main quiz interface with game show styling
   */
  initializeQuizInterface(container) {
    container.innerHTML = ''; // Clear intro
    
    const quizInterface = document.createElement('div');
    quizInterface.className = 'quiz-show-interface';
    
    // Game show header
    const header = this.createGameShowHeader();
    quizInterface.appendChild(header);
    
    // Gameboard background
    const gameboard = this.createGameboard();
    quizInterface.appendChild(gameboard);
    
    // Main quiz area
    const quizArea = document.createElement('div');
    quizArea.className = 'quiz-area';
    
    // Question display
    const questionDisplay = this.createQuestionDisplay();
    quizArea.appendChild(questionDisplay);
    
    // Timer with game show styling
    const timer = this.createGameShowTimer();
    quizArea.appendChild(timer);
    
    // Navigation controls
    const navigation = this.createNavigation();
    quizArea.appendChild(navigation);
    
    gameboard.appendChild(quizArea);
    container.appendChild(quizInterface);
    
    // Start the first question
    this.startQuestion(0);
  }

  /**
   * Create game show header with scoring
   */
  createGameShowHeader() {
    const header = document.createElement('div');
    header.className = 'game-show-header';
    header.innerHTML = `
      <div class="score-board">
        <div class="score-item">
          <span class="score-label">Traditional</span>
          <span class="score-value traditional-score">0/0</span>
        </div>
        <div class="score-item primary">
          <span class="score-label">Game Show Score</span>
          <span class="score-value game-show-score">0</span>
        </div>
        <div class="question-counter">
          Question <span class="current-q">1</span> of <span class="total-q">${this.questions.length}</span>
        </div>
      </div>
      <div class="encouragement-text">
        ${this.getRandomPhrase(this.encouragementPhrases)}
      </div>
    `;
    return header;
  }

  /**
   * Create 1970s gameboard background with glowing squares
   */
  createGameboard() {
    const gameboard = document.createElement('div');
    gameboard.className = 'gameboard-background';
    
    // Create grid of colored squares
    const gridSize = 12; // 12x12 grid
    for (let i = 0; i < gridSize * gridSize; i++) {
      const square = document.createElement('div');
      square.className = 'gameboard-square';
      square.style.animationDelay = `${Math.random() * 2}s`;
      gameboard.appendChild(square);
    }
    
    return gameboard;
  }

  /**
   * Create question display with 1970s styling
   */
  createQuestionDisplay() {
    const display = document.createElement('div');
    display.className = 'question-display';
    display.innerHTML = `
      <div class="question-text"></div>
      <div class="answer-choices"></div>
      <div class="question-tools">
        <div class="elimination-tools">
          <strong>Elimination Tools:</strong> Click the ✖ to eliminate wrong answers
        </div>
      </div>
    `;
    return display;
  }

  /**
   * Create game show timer with dramatic styling
   */
  createGameShowTimer() {
    const timer = document.createElement('div');
    timer.className = 'game-show-timer';
    timer.innerHTML = `
      <div class="timer-ring">
        <div class="timer-display">
          <span class="timer-minutes">1</span>:<span class="timer-seconds">48</span>
        </div>
        <div class="timer-label">TIME REMAINING</div>
      </div>
      <div class="timer-controls">
        <button class="pause-btn">⏸️ PAUSE</button>
      </div>
      <div class="timer-warning" style="display: none;">
        <div class="warning-text">⚠️ 10 SECONDS LEFT! ⚠️</div>
      </div>
    `;
    return timer;
  }

  /**
   * Create navigation controls
   */
  createNavigation() {
    const nav = document.createElement('div');
    nav.className = 'quiz-navigation';
    nav.innerHTML = `
      <button class="nav-btn prev-btn" disabled>◀ PREVIOUS</button>
      <button class="nav-btn next-btn">NEXT ▶</button>
      <button class="nav-btn finish-btn" style="display: none;">🏆 FINISH QUIZ</button>
    `;
    
    // Add event listeners
    const prevBtn = nav.querySelector('.prev-btn');
    const nextBtn = nav.querySelector('.next-btn');
    const finishBtn = nav.querySelector('.finish-btn');
    
    prevBtn.addEventListener('click', () => this.previousQuestion());
    nextBtn.addEventListener('click', () => this.nextQuestion());
    finishBtn.addEventListener('click', () => this.finishQuiz());
    
    return nav;
  }

  /**
   * Start a specific question with timer
   */
  startQuestion(index) {
    this.currentQuestion = index;
    this.questionStartTimes[index] = Date.now();
    this.timerWarningPlayed = false;
    
    // Update question display
    this.renderQuestion(this.questions[index]);
    
    // Update navigation
    this.updateNavigation();
    
    // Start question timer (1.8 minutes = 108 seconds)
    const timeLimit = Math.ceil(this.options.timer * 60);
    this.startQuestionTimer(timeLimit);
    
    // Update counters
    this.updateDisplayCounters();
  }

  /**
   * Render current question
   */
  renderQuestion(question) {
    const questionText = document.querySelector('.question-text');
    const answerChoices = document.querySelector('.answer-choices');
    
    questionText.innerHTML = `
      <div class="question-number">Question ${this.currentQuestion + 1}</div>
      <div class="question-content">${question.question}</div>
    `;
    
    // Create answer choices
    answerChoices.innerHTML = '';
    question.choices.forEach((choice, index) => {
      const choiceElement = document.createElement('div');
      choiceElement.className = 'answer-choice';
      choiceElement.innerHTML = `
        <button class="choice-btn" data-choice="${index}">
          <span class="choice-letter">${String.fromCharCode(65 + index)}</span>
          <span class="choice-text">${choice}</span>
        </button>
        <button class="eliminate-btn" data-choice="${index}" title="Eliminate this answer">✖</button>
      `;
      
      // Add click handlers
      const choiceBtn = choiceElement.querySelector('.choice-btn');
      const eliminateBtn = choiceElement.querySelector('.eliminate-btn');
      
      choiceBtn.addEventListener('click', () => this.selectAnswer(index));
      eliminateBtn.addEventListener('click', () => this.eliminateChoice(index));
      
      answerChoices.appendChild(choiceElement);
    });
    
    // Restore previous state
    this.restoreQuestionState();
  }

  /**
   * Handle answer selection
   */
  selectAnswer(choiceIndex) {
    this.answers[this.currentQuestion] = choiceIndex;
    
    // Update visual selection
    document.querySelectorAll('.choice-btn').forEach((btn, index) => {
      btn.classList.toggle('selected', index === choiceIndex);
    });
    
    // Play selection sound
    this.playGameShowSound('click');
    
    // Calculate and update scores
    this.updateScores();
  }

  /**
   * Handle choice elimination
   */
  eliminateChoice(choiceIndex) {
    if (!this.eliminated[this.currentQuestion]) {
      this.eliminated[this.currentQuestion] = {};
    }
    
    const wasEliminated = this.eliminated[this.currentQuestion][choiceIndex];
    this.eliminated[this.currentQuestion][choiceIndex] = !wasEliminated;
    
    // Update visual state
    const choiceElement = document.querySelector(`[data-choice="${choiceIndex}"]`).parentElement;
    choiceElement.classList.toggle('eliminated', !wasEliminated);
    
    // Play elimination sound
    this.playGameShowSound('click');
  }

  /**
   * Start question timer with visual countdown
   */
  startQuestionTimer(timeLimit) {
    const timerDisplay = document.querySelector('.timer-display');
    const timerRing = document.querySelector('.timer-ring');
    const warningElement = document.querySelector('.timer-warning');
    
    let timeRemaining = timeLimit;
    
    const updateTimer = () => {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      
      document.querySelector('.timer-minutes').textContent = minutes;
      document.querySelector('.timer-seconds').textContent = seconds.toString().padStart(2, '0');
      
      // Update ring color based on time remaining
      const percentage = (timeRemaining / timeLimit) * 100;
      if (percentage <= 15) {
        timerRing.classList.add('critical');
      } else if (percentage <= 30) {
        timerRing.classList.add('warning');
      }
      
      // Show 10-second warning
      if (timeRemaining === 10 && !this.timerWarningPlayed) {
        this.show10SecondWarning();
        this.timerWarningPlayed = true;
      }
      
      // Continue in overtime if time runs out
      if (timeRemaining <= 0) {
        timerRing.classList.add('overtime');
        document.querySelector('.timer-minutes').textContent = '-' + Math.floor(Math.abs(timeRemaining) / 60);
        document.querySelector('.timer-seconds').textContent = (Math.abs(timeRemaining) % 60).toString().padStart(2, '0');
      }
      
      timeRemaining--;
    };
    
    // Start timer
    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);
    
    // Store interval for cleanup
    this.questionTimers[this.currentQuestion] = interval;
  }

  /**
   * Show 10-second warning with dramatic effect
   */
  show10SecondWarning() {
    const warningElement = document.querySelector('.timer-warning');
    warningElement.style.display = 'block';
    warningElement.classList.add('flash');
    
    // Play warning sound
    this.playGameShowSound('timer');
    
    // Hide after 3 seconds
    setTimeout(() => {
      warningElement.style.display = 'none';
      warningElement.classList.remove('flash');
    }, 3000);
  }

  /**
   * Update scores based on current answers
   */
  updateScores() {
    // Traditional score (simple correct/incorrect)
    let correct = 0;
    this.answers.forEach((answer, index) => {
      if (answer !== null && this.questions[index]) {
        const correctIndex = 'ABCD'.indexOf(this.questions[index].answer);
        if (answer === correctIndex) {
          correct++;
        }
      }
    });
    
    this.traditionalScore = correct;
    
    // Game show score (with time bonuses and random elements)
    this.calculateGameShowScore();
    
    // Update display
    document.querySelector('.traditional-score').textContent = `${correct}/${this.answers.filter(a => a !== null).length}`;
    document.querySelector('.game-show-score').textContent = this.gameShowScore.toLocaleString();
  }

  /**
   * Calculate elaborate game show scoring
   */
  calculateGameShowScore() {
    let score = 0;
    
    this.answers.forEach((answer, index) => {
      if (answer !== null && this.questions[index]) {
        const correctIndex = 'ABCD'.indexOf(this.questions[index].answer);
        if (answer === correctIndex) {
          // Base points for correct answer
          score += 1000;
          
          // Time bonus if question was answered quickly
          if (this.questionStartTimes[index]) {
            const timeUsed = (Date.now() - this.questionStartTimes[index]) / 1000;
            const timeLimit = this.options.timer * 60;
            const timeRemaining = Math.max(0, timeLimit - timeUsed);
            const timeBonus = Math.floor(timeRemaining * 10); // 10 points per second remaining
            score += timeBonus;
          }
          
          // Random bonus points for excitement (100-500 points)
          const randomBonus = Math.floor(Math.random() * 400) + 100;
          score += randomBonus;
        }
      }
    });
    
    this.gameShowScore = score;
  }

  /**
   * Navigate to previous question
   */
  previousQuestion() {
    if (this.currentQuestion > 0) {
      this.stopCurrentTimer();
      this.startQuestion(this.currentQuestion - 1);
    }
  }

  /**
   * Navigate to next question
   */
  nextQuestion() {
    if (this.currentQuestion < this.questions.length - 1) {
      this.stopCurrentTimer();
      this.startQuestion(this.currentQuestion + 1);
    }
  }

  /**
   * Stop current question timer
   */
  stopCurrentTimer() {
    if (this.questionTimers[this.currentQuestion]) {
      clearInterval(this.questionTimers[this.currentQuestion]);
    }
  }

  /**
   * Update navigation button states
   */
  updateNavigation() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const finishBtn = document.querySelector('.finish-btn');
    
    prevBtn.disabled = this.currentQuestion === 0;
    
    if (this.currentQuestion === this.questions.length - 1) {
      nextBtn.style.display = 'none';
      finishBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'inline-block';
      finishBtn.style.display = 'none';
    }
  }

  /**
   * Update display counters
   */
  updateDisplayCounters() {
    document.querySelector('.current-q').textContent = this.currentQuestion + 1;
    document.querySelector('.encouragement-text').textContent = this.getRandomPhrase(this.encouragementPhrases);
  }

  /**
   * Restore question state (selections, eliminations)
   */
  restoreQuestionState() {
    // Restore selected answer
    if (this.answers[this.currentQuestion] !== null) {
      const selectedIndex = this.answers[this.currentQuestion];
      document.querySelector(`[data-choice="${selectedIndex}"]`).classList.add('selected');
    }
    
    // Restore eliminations
    if (this.eliminated[this.currentQuestion]) {
      Object.entries(this.eliminated[this.currentQuestion]).forEach(([choiceIndex, isEliminated]) => {
        if (isEliminated) {
          const choiceElement = document.querySelector(`[data-choice="${choiceIndex}"]`).parentElement;
          choiceElement.classList.add('eliminated');
        }
      });
    }
  }

  /**
   * Finish the quiz and show results
   */
  finishQuiz() {
    // Stop all timers
    this.questionTimers.forEach(timer => {
      if (timer) clearInterval(timer);
    });
    
    // Calculate final scores
    this.updateScores();
    
    // Calculate duration
    const duration = Math.ceil((Date.now() - this.startTime) / 1000);
    
    // Save high score and check for achievements
    const highScoreRank = this.saveHighScore();
    
    // Play finish sound
    if (this.traditionalScore / this.questions.length >= 0.65) {
      this.playGameShowSound('correct');
    } else {
      this.playGameShowSound('wrong');
    }
    
    // Create quiz results
    const results = {
      correct: this.traditionalScore,
      total: this.questions.length,
      duration_s: duration,
      answers: this.answers,
      eliminated: this.eliminated,
      gameShowScore: this.gameShowScore,
      traditionalScore: this.traditionalScore,
      negative_time: false, // TODO: Track overtime
      timer: this.options.timer
    };
    
    // Call completion callback
    this.onComplete(this.questions, this.answers, results);
  }

  /**
   * Save high score and check for achievements
   */
  saveHighScore() {
    const scoreData = {
      score: this.gameShowScore,
      traditionalScore: `${this.traditionalScore}/${this.questions.length}`,
      percentage: Math.round((this.traditionalScore / this.questions.length) * 100),
      questions: this.questions.length
    };
    
    // Check if this is a high score
    if (quizShowHighScores.isHighScore(this.gameShowScore)) {
      const rank = quizShowHighScores.addScore(scoreData);
      
      if (rank) {
        // Show achievement notification
        setTimeout(() => {
          quizShowHighScores.showHighScoreAchievement(rank, this.gameShowScore);
        }, 2000);
        
        // Show high scores modal after a delay
        setTimeout(() => {
          quizShowHighScores.showHighScoresModal(scoreData);
        }, 6000);
        
        return rank;
      }
    }
    
    return null;
  }

  /**
   * Play game show sound effects
   */
  playGameShowSound(soundType) {
    if (window.themeManager && window.themeManager.audioManager) {
      window.themeManager.audioManager.playSound(soundType, 0.5);
    }
  }

  /**
   * Play intro music
   */
  playIntroMusic() {
    this.playGameShowSound('transition');
  }

  /**
   * Animate sparkles in intro
   */
  animateSparkles(intro) {
    const sparkles = intro.querySelectorAll('.sparkle');
    sparkles.forEach((sparkle, index) => {
      sparkle.style.animationDelay = `${index * 0.2}s`;
    });
  }

  /**
   * Get random phrase from array
   */
  getRandomPhrase(phrases) {
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}

/**
 * Create Quiz Show mode instance
 */
export function createQuizShowMode(questions, options, onComplete) {
  const quizShow = new QuizShowMode(questions, options, onComplete);
  return quizShow.start();
}