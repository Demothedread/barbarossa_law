<template>
  <div class="quiz-show-mode">
    <!-- TV Intro Overlay -->
    <Transition name="fade">
      <div v-if="showIntro" class="tv-intro" @click="skipIntro">
        <div class="intro-content">
          <div class="game-show-logo">
            <div class="logo-sparkles">
              <span
                v-for="i in 12"
                :key="i"
                class="sparkle"
                :style="{ animationDelay: `${Math.random() * 2}s` }"
              ></span>
            </div>
            <div class="logo-text">QUIZ SHOW</div>
            <div class="logo-subtitle">Legal Knowledge Challenge</div>
          </div>
          <div class="host-announcement">
            <p>Welcome to the most exciting legal quiz show!</p>
            <p>
              Today's contestant will face
              <strong>{{ questions.length }} challenging questions</strong>
            </p>
            <p>
              with <strong>{{ timerMinutes }} minutes per question</strong>!
            </p>
          </div>
          <button class="start-show-btn" @click.stop="startShow">
            🎬 LET'S PLAY!
          </button>
          <div class="skip-hint">Press SPACE to skip intro</div>
        </div>
      </div>
    </Transition>

    <!-- Main Game Interface -->
    <div v-if="!showIntro && !showResults" class="game-interface">
      <!-- Gameboard Background -->
      <div class="gameboard-background">
        <div
          v-for="i in 144"
          :key="i"
          class="gameboard-square"
          :style="{ animationDelay: `${Math.random() * 2}s` }"
        ></div>
      </div>

      <!-- Game Show Header -->
      <div class="game-show-header">
        <div class="score-board">
          <div class="score-item">
            <span class="score-label">Traditional</span>
            <span class="score-value"
              >{{ correctCount }}/{{ currentIndex + 1 }}</span
            >
          </div>
          <div class="score-item primary">
            <span class="score-label">Game Show Score</span>
            <span class="score-value game-score">{{
              gameShowScore.toLocaleString()
            }}</span>
          </div>
          <div class="question-counter">
            Question <span class="current-q">{{ currentIndex + 1 }}</span> of
            <span class="total-q">{{ questions.length }}</span>
          </div>
        </div>
        <div class="encouragement-text">{{ currentPhrase }}</div>
      </div>

      <!-- Question Display -->
      <div class="quiz-area">
        <div v-if="currentQuestion" class="question-display">
          <!-- Timer -->
          <div class="game-show-timer" :class="timerClass">
            <div class="timer-ring">
              <svg viewBox="0 0 100 100">
                <circle class="timer-bg" cx="50" cy="50" r="45" />
                <circle
                  class="timer-progress"
                  cx="50"
                  cy="50"
                  r="45"
                  :style="{ strokeDashoffset: timerDashOffset }"
                />
              </svg>
              <div class="timer-display">
                <span class="timer-minutes">{{ displayMinutes }}</span
                >:<span class="timer-seconds">{{ displaySeconds }}</span>
              </div>
            </div>
            <div v-if="showTimerWarning" class="timer-warning">
              ⚠️ 10 SECONDS LEFT! ⚠️
            </div>
          </div>

          <!-- Question Text -->
          <div class="question-card">
            <div v-if="currentQuestion.prompt" class="question-prompt">
              {{ currentQuestion.prompt }}
            </div>
            <div class="question-text">{{ currentQuestion.question }}</div>
          </div>

          <!-- Answer Choices -->
          <div class="answer-choices">
            <button
              v-for="(choice, idx) in choices"
              :key="choice.letter"
              class="choice-btn"
              :class="{
                selected: selectedAnswer === choice.letter,
                eliminated: eliminated.has(choice.letter),
                correct: showAnswer && choice.letter === currentQuestion.answer,
                wrong:
                  showAnswer &&
                  selectedAnswer === choice.letter &&
                  choice.letter !== currentQuestion.answer,
              }"
              :disabled="eliminated.has(choice.letter) || showAnswer"
              @click="selectAnswer(choice.letter)"
            >
              <span class="choice-letter">{{ choice.letter }}</span>
              <span class="choice-text">{{ choice.text }}</span>
              <button
                v-if="!showAnswer"
                class="eliminate-btn"
                :class="{ restored: eliminated.has(choice.letter) }"
                @click.stop="toggleEliminate(choice.letter)"
                :title="eliminated.has(choice.letter) ? 'Restore' : 'Eliminate'"
              >
                {{ eliminated.has(choice.letter) ? "↩️" : "❌" }}
              </button>
            </button>
          </div>

          <!-- Feedback Display -->
          <Transition name="slide-up">
            <div
              v-if="showAnswer"
              class="answer-feedback"
              :class="isCorrect ? 'correct' : 'wrong'"
            >
              <div class="feedback-icon">{{ isCorrect ? "🎉" : "😔" }}</div>
              <div class="feedback-text">{{ feedbackPhrase }}</div>
              <div v-if="!isCorrect" class="correct-answer">
                The correct answer was:
                <strong>{{ currentQuestion.answer }}</strong>
              </div>
              <div class="points-earned">
                <span v-if="isCorrect"
                  >+{{ pointsEarned.toLocaleString() }} points!</span
                >
                <span v-else>Better luck next time!</span>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Navigation -->
        <div class="quiz-navigation">
          <button
            class="nav-btn"
            :disabled="currentIndex === 0"
            @click="prevQuestion"
          >
            ← Previous
          </button>
          <div class="progress-dots">
            <span
              v-for="(_, idx) in questions"
              :key="idx"
              class="dot"
              :class="{
                current: idx === currentIndex,
                answered: answers[idx] !== null,
                correct: answers[idx] === questions[idx].answer,
              }"
              @click="goToQuestion(idx)"
            ></span>
          </div>
          <button
            v-if="currentIndex < questions.length - 1"
            class="nav-btn primary"
            @click="nextQuestion"
          >
            Next →
          </button>
          <button v-else class="nav-btn primary finish" @click="finishQuiz">
            🏆 Finish Quiz
          </button>
        </div>
      </div>
    </div>

    <!-- Results Screen -->
    <div v-if="showResults" class="results-screen">
      <div class="results-content">
        <div class="results-header">
          <div class="trophy">🏆</div>
          <h2>GAME OVER!</h2>
          <div class="final-score">
            {{ gameShowScore.toLocaleString() }} points
          </div>
        </div>

        <div class="results-stats">
          <div class="stat-row">
            <span class="stat-label">Traditional Score:</span>
            <span class="stat-value"
              >{{ correctCount }}/{{ questions.length }} ({{
                percentage
              }}%)</span
            >
          </div>
          <div class="stat-row">
            <span class="stat-label">Time Bonuses:</span>
            <span class="stat-value"
              >+{{ totalTimeBonus.toLocaleString() }}</span
            >
          </div>
          <div class="stat-row">
            <span class="stat-label">Perfect Answers:</span>
            <span class="stat-value">{{ perfectAnswers }}</span>
          </div>
        </div>

        <div class="results-message">
          <p v-if="percentage >= 65">
            🎊 Congratulations! You passed the bar! 🎊
          </p>
          <p v-else>Keep practicing! You need 65% to pass.</p>
        </div>

        <div class="results-actions">
          <button
            class="btn btn--primary"
            @click="$emit('complete', quizResult)"
          >
            View Detailed Results
          </button>
          <button class="btn btn--secondary" @click="$emit('restart')">
            Play Again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameAudio } from "~/composables/useGameAudio";
import type { Question } from "~/stores/quiz";

const props = defineProps<{
  questions: Question[];
  timerMinutes?: number;
}>();

const emit = defineEmits<{
  complete: [result: any];
  restart: [];
}>();

const { playSound, setTheme } = useGameAudio();

// Game state
const showIntro = ref(true);
const showResults = ref(false);
const currentIndex = ref(0);
const selectedAnswer = ref<string | null>(null);
const showAnswer = ref(false);
const answers = ref<(string | null)[]>(
  new Array(props.questions.length).fill(null),
);
const eliminated = ref<Set<string>>(new Set());
const questionStartTime = ref<number>(0);
const questionTimes = ref<number[]>([]);

// Scoring
const gameShowScore = ref(0);
const pointsEarned = ref(0);
const totalTimeBonus = ref(0);
const perfectAnswers = ref(0);

// Timer
const timerSeconds = ref((props.timerMinutes || 2) * 60);
const timerInterval = ref<NodeJS.Timeout | null>(null);
const showTimerWarning = ref(false);

// Phrases
const encouragementPhrases = [
  "Let's play!",
  "Survey says...",
  "Final answer?",
  "Come on down!",
  "Big money, big money!",
  "You're in the hot seat!",
  "Going for the gold!",
];

const correctPhrases = [
  "Ding ding ding! That's correct!",
  "You got it! Fantastic!",
  "Right on the money!",
  "Jackpot! Well done!",
  "Bulls-eye! Outstanding!",
];

const wrongPhrases = [
  "Ooh, sorry! That's not it.",
  "Close, but no cigar!",
  "Not quite! Better luck next time.",
  "So close! The correct answer is...",
];

const currentPhrase = ref(encouragementPhrases[0] || "Let's play!");
const feedbackPhrase = ref("");

// Computed
const currentQuestion = computed(() => props.questions[currentIndex.value]);

const choices = computed(() => {
  const q = currentQuestion.value;
  if (!q) return [];
  return [
    { letter: "A", text: q.choice_a },
    { letter: "B", text: q.choice_b },
    { letter: "C", text: q.choice_c },
    { letter: "D", text: q.choice_d },
  ];
});

const displayMinutes = computed(() =>
  Math.floor(timerSeconds.value / 60)
    .toString()
    .padStart(1, "0"),
);
const displaySeconds = computed(() =>
  (timerSeconds.value % 60).toString().padStart(2, "0"),
);

const timerDashOffset = computed(() => {
  const totalSeconds = (props.timerMinutes || 2) * 60;
  const progress = timerSeconds.value / totalSeconds;
  return 283 * (1 - progress);
});

const timerClass = computed(() => {
  if (timerSeconds.value <= 10) return "critical";
  if (timerSeconds.value <= 30) return "warning";
  return "";
});

const isCorrect = computed(() => {
  const q = currentQuestion.value;
  if (!q) return false;
  return selectedAnswer.value === q.answer;
});

const correctCount = computed(
  () =>
    answers.value.filter((a, i) => {
      const q = props.questions[i];
      return q && a === q.answer;
    }).length,
);

const percentage = computed(() =>
  Math.round((correctCount.value / props.questions.length) * 100),
);

const quizResult = computed(() => ({
  score: correctCount.value,
  total: props.questions.length,
  gameShowScore: gameShowScore.value,
  answers: answers.value.map((a, i) => {
    const q = props.questions[i];
    return {
      questionId: q?.id || `unknown-${i}`,
      selected: a,
      correct: q ? a === q.answer : false,
    };
  }),
  questionTimes: questionTimes.value,
}));

// Methods
const skipIntro = () => {
  showIntro.value = false;
  startGame();
};

const startShow = () => {
  playSound("intro");
  setTimeout(() => {
    showIntro.value = false;
    startGame();
  }, 500);
};

const startGame = () => {
  setTheme("quizshow");
  startQuestion();
};

const startQuestion = () => {
  selectedAnswer.value = answers.value[currentIndex.value] ?? null;
  showAnswer.value = false;
  eliminated.value = new Set();
  timerSeconds.value = (props.timerMinutes || 2) * 60;
  questionStartTime.value = Date.now();
  showTimerWarning.value = false;
  currentPhrase.value =
    encouragementPhrases[
      Math.floor(Math.random() * encouragementPhrases.length)
    ] || "Let's play!";

  startTimer();
};

const startTimer = () => {
  stopTimer();
  timerInterval.value = setInterval(() => {
    timerSeconds.value--;

    if (timerSeconds.value === 10) {
      showTimerWarning.value = true;
      playSound("timerWarning");
    }

    if (timerSeconds.value <= 0) {
      stopTimer();
      if (!showAnswer.value && !selectedAnswer.value) {
        // Time's up, auto-submit
        submitAnswer();
      }
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }
};

const selectAnswer = (letter: string) => {
  if (showAnswer.value) return;
  playSound("click");
  selectedAnswer.value = letter;
};

const toggleEliminate = (letter: string) => {
  if (eliminated.value.has(letter)) {
    eliminated.value.delete(letter);
  } else if (eliminated.value.size < 2) {
    eliminated.value.add(letter);
    if (selectedAnswer.value === letter) {
      selectedAnswer.value = null;
    }
  }
  eliminated.value = new Set(eliminated.value); // Trigger reactivity
};

const submitAnswer = () => {
  stopTimer();
  const timeSpent = Date.now() - questionStartTime.value;
  questionTimes.value[currentIndex.value] = timeSpent;

  answers.value[currentIndex.value] = selectedAnswer.value;
  showAnswer.value = true;

  if (isCorrect.value) {
    playSound("correct");
    feedbackPhrase.value =
      correctPhrases[Math.floor(Math.random() * correctPhrases.length)] ||
      "Correct!";

    // Calculate points: base + time bonus + random bonus
    const basePoints = 1000;
    const timeBonus = Math.max(0, timerSeconds.value) * 10;
    const randomBonus = Math.floor(Math.random() * 400) + 100;

    pointsEarned.value = basePoints + timeBonus + randomBonus;
    gameShowScore.value += pointsEarned.value;
    totalTimeBonus.value += timeBonus;

    if (timerSeconds.value > 60) {
      perfectAnswers.value++;
    }
  } else {
    playSound("wrong");
    feedbackPhrase.value =
      wrongPhrases[Math.floor(Math.random() * wrongPhrases.length)] ||
      "Not quite!";
    pointsEarned.value = 0;
  }
};

const nextQuestion = () => {
  if (!showAnswer.value && selectedAnswer.value) {
    submitAnswer();
    setTimeout(() => {
      if (currentIndex.value < props.questions.length - 1) {
        currentIndex.value++;
        startQuestion();
      }
    }, 1500);
  } else if (showAnswer.value) {
    if (currentIndex.value < props.questions.length - 1) {
      playSound("transition");
      currentIndex.value++;
      startQuestion();
    }
  } else if (selectedAnswer.value) {
    submitAnswer();
  }
};

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    startQuestion();
  }
};

const goToQuestion = (idx: number) => {
  if (idx !== currentIndex.value) {
    currentIndex.value = idx;
    startQuestion();
  }
};

const finishQuiz = () => {
  if (!showAnswer.value && selectedAnswer.value) {
    submitAnswer();
  }
  stopTimer();

  if (percentage.value >= 65) {
    playSound("winner");
  } else {
    playSound("loser");
  }

  showResults.value = true;
};

// Keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  if (showIntro.value && e.code === "Space") {
    e.preventDefault();
    skipIntro();
  }

  if (!showIntro.value && !showResults.value && !showAnswer.value) {
    const keyMap: Record<string, string> = {
      KeyA: "A",
      KeyB: "B",
      KeyC: "C",
      KeyD: "D",
    };
    const letter = keyMap[e.code];
    if (letter) {
      selectAnswer(letter);
    }
    if (e.code === "Enter" && selectedAnswer.value) {
      submitAnswer();
    }
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  stopTimer();
});
</script>

<style scoped>
.quiz-show-mode {
  min-height: 100vh;
  background: linear-gradient(135deg, #2a1810 0%, #1a0f0a 100%);
  color: #fff;
  font-family: var(--font-body);
}

/* TV Intro */
.tv-intro {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, #4a2c17 0%, #1a0f0a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.intro-content {
  text-align: center;
  animation: intro-zoom 1s ease-out;
}

@keyframes intro-zoom {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.game-show-logo {
  position: relative;
  margin-bottom: 2rem;
}

.logo-text {
  font-family: "Impact", "Arial Black", sans-serif;
  font-size: 5rem;
  background: linear-gradient(180deg, #ffd700 0%, #ff8c00 50%, #ffd700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.5);
  letter-spacing: 0.1em;
}

.logo-subtitle {
  font-size: 1.5rem;
  color: #ffd700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.logo-sparkles {
  position: absolute;
  inset: -20px;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #ffd700;
  border-radius: 50%;
  animation: sparkle 1.5s ease-in-out infinite;
}

.sparkle:nth-child(odd) {
  top: 0;
  left: calc(var(--i, 1) * 8%);
}

.sparkle:nth-child(even) {
  bottom: 0;
  right: calc(var(--i, 1) * 8%);
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.host-announcement {
  font-size: 1.25rem;
  color: #f5deb3;
  margin-bottom: 2rem;
  line-height: 1.8;
}

.host-announcement strong {
  color: #ffd700;
}

.start-show-btn {
  background: linear-gradient(45deg, #ffd700, #ff8c00);
  color: #2f1b14;
  border: 4px solid #8b4513;
  border-radius: 12px;
  padding: 1rem 3rem;
  font-family: "Arial Black", sans-serif;
  font-size: 1.5rem;
  font-weight: 900;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 6px 0 #8b4513;
  transition: all 0.2s;
}

.start-show-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 0 #8b4513;
}

.start-show-btn:active {
  transform: translateY(0);
  box-shadow: 0 3px 0 #8b4513;
}

.skip-hint {
  margin-top: 2rem;
  color: #8b7355;
  font-size: 0.875rem;
}

/* Gameboard Background */
.gameboard-background {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 2px;
  opacity: 0.15;
  pointer-events: none;
}

.gameboard-square {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.7;
  }
}

/* Game Interface */
.game-interface {
  position: relative;
  min-height: 100vh;
  padding: 1rem;
}

.game-show-header {
  background: linear-gradient(135deg, #8b4513, #5c2e0a);
  border: 3px solid #ffd700;
  border-radius: 12px;
  padding: 1rem 2rem;
  margin-bottom: 1rem;
}

.score-board {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.score-item {
  text-align: center;
}

.score-item.primary {
  flex: 1;
}

.score-label {
  display: block;
  font-size: 0.75rem;
  color: #f5deb3;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.score-value {
  font-family: "Arial Black", sans-serif;
  font-size: 1.5rem;
  color: #ffd700;
}

.score-value.game-score {
  font-size: 2.5rem;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.question-counter {
  font-size: 0.875rem;
  color: #f5deb3;
}

.current-q,
.total-q {
  color: #ffd700;
  font-weight: bold;
}

.encouragement-text {
  text-align: center;
  font-style: italic;
  color: #ffd700;
  margin-top: 0.5rem;
}

/* Quiz Area */
.quiz-area {
  position: relative;
  max-width: 900px;
  margin: 0 auto;
}

.question-display {
  background: rgba(255, 248, 220, 0.95);
  border: 4px solid #8b4513;
  border-radius: 16px;
  padding: 2rem;
  color: #2f1b14;
}

/* Timer */
.game-show-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
}

.timer-ring {
  position: relative;
  width: 100px;
  height: 100px;
}

.timer-ring svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.timer-bg {
  fill: none;
  stroke: #e0d5c0;
  stroke-width: 8;
}

.timer-progress {
  fill: none;
  stroke: #4caf50;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 283;
  transition:
    stroke-dashoffset 1s linear,
    stroke 0.3s;
}

.game-show-timer.warning .timer-progress {
  stroke: #ff9800;
}

.game-show-timer.critical .timer-progress {
  stroke: #f44336;
  animation: pulse-timer 0.5s infinite;
}

@keyframes pulse-timer {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.timer-display {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Arial Black", sans-serif;
  font-size: 1.5rem;
  color: #2f1b14;
}

.timer-warning {
  background: #f44336;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

/* Question Card */
.question-card {
  margin-bottom: 1.5rem;
}

.question-prompt {
  background: #f5f0e0;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-style: italic;
  border-left: 4px solid #8b4513;
}

.question-text {
  font-size: 1.25rem;
  line-height: 1.6;
  font-weight: 500;
}

/* Answer Choices */
.answer-choices {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.choice-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
  background: #fff8dc;
  border: 3px solid #d4c4a8;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.choice-btn:hover:not(:disabled) {
  background: #ffd700;
  border-color: #8b4513;
  transform: translateX(5px);
}

.choice-btn.selected {
  background: #ffd700;
  border-color: #8b4513;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.choice-btn.eliminated {
  opacity: 0.4;
  text-decoration: line-through;
}

.choice-btn.correct {
  background: #4caf50 !important;
  border-color: #2e7d32 !important;
  color: white;
}

.choice-btn.wrong {
  background: #f44336 !important;
  border-color: #c62828 !important;
  color: white;
}

.choice-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #8b4513;
  color: #ffd700;
  border-radius: 50%;
  font-weight: bold;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.choice-text {
  flex: 1;
}

.eliminate-btn {
  position: absolute;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.choice-btn:hover .eliminate-btn {
  opacity: 1;
}

/* Answer Feedback */
.answer-feedback {
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
}

.answer-feedback.correct {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: white;
}

.answer-feedback.wrong {
  background: linear-gradient(135deg, #f44336, #c62828);
  color: white;
}

.feedback-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.feedback-text {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.correct-answer {
  font-size: 1rem;
  opacity: 0.9;
}

.points-earned {
  font-size: 1.25rem;
  margin-top: 0.5rem;
  font-weight: bold;
}

/* Navigation */
.quiz-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.5rem;
  gap: 1rem;
}

.nav-btn {
  padding: 0.75rem 1.5rem;
  background: #8b4513;
  color: #ffd700;
  border: 2px solid #ffd700;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #ffd700;
  color: #8b4513;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn.primary {
  background: linear-gradient(45deg, #ffd700, #ff8c00);
  color: #2f1b14;
  border-color: #8b4513;
}

.nav-btn.finish {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px 5px rgba(255, 215, 0, 0.5);
  }
}

.progress-dots {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d4c4a8;
  cursor: pointer;
  transition: all 0.2s;
}

.dot.current {
  background: #ffd700;
  transform: scale(1.3);
}

.dot.answered {
  background: #8b4513;
}

.dot.correct {
  background: #4caf50;
}

/* Results Screen */
.results-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.results-content {
  background: linear-gradient(135deg, #fff8dc, #f5deb3);
  border: 4px solid #8b4513;
  border-radius: 20px;
  padding: 3rem;
  max-width: 500px;
  text-align: center;
  color: #2f1b14;
}

.results-header .trophy {
  font-size: 5rem;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.results-header h2 {
  font-family: "Impact", sans-serif;
  font-size: 2.5rem;
  color: #8b4513;
  margin: 1rem 0;
}

.final-score {
  font-size: 3rem;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 2px 2px 0 #8b4513;
}

.results-stats {
  margin: 2rem 0;
  text-align: left;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #d4c4a8;
}

.stat-label {
  color: #5c4033;
}

.stat-value {
  font-weight: bold;
  color: #8b4513;
}

.results-message {
  font-size: 1.25rem;
  margin: 1.5rem 0;
}

.results-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.3s ease-out;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
</style>
