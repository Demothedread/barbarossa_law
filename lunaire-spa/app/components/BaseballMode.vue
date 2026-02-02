<template>
  <div class="baseball-mode">
    <!-- Stadium Intro -->
    <Transition name="fade">
      <div v-if="showIntro" class="stadium-intro" @click="skipIntro">
        <div class="intro-content">
          <div class="baseball-logo">
            <div class="logo-ball">⚾</div>
            <div class="logo-text">FRIENDLY MODE</div>
            <div class="logo-subtitle">Legal Knowledge Baseball</div>
          </div>

          <div class="baseball-field-visual">
            <div class="diamond">
              <div class="base home"></div>
              <div class="base first"></div>
              <div class="base second"></div>
              <div class="base third"></div>
              <div class="pitcher-mound"></div>
            </div>
          </div>

          <div class="stadium-announcement">
            <p>Welcome to the friendly ballpark!</p>
            <p>
              Take your time with
              <strong>{{ questions.length }} questions</strong>
            </p>
            <p>No timers, no pressure - just learning!</p>
          </div>

          <button class="play-ball-btn" @click.stop="startGame">
            ⚾ PLAY BALL!
          </button>
          <div class="skip-hint">Press SPACE to skip</div>
        </div>
      </div>
    </Transition>

    <!-- Main Game Interface -->
    <div
      v-if="!showIntro && !showResults"
      class="game-interface baseball-field-bg"
    >
      <!-- Scoreboard -->
      <div class="baseball-scoreboard">
        <div class="scoreboard-header">
          <div class="team-name visitor">LAW SCHOOL</div>
          <div class="scoreboard-title">⚾ SCOREBOARD</div>
          <div class="team-name home">YOU</div>
        </div>
        <div class="scoreboard-scores">
          <div class="score-display">
            <div class="visitor-score">{{ runsAgainst }}</div>
            <div class="score-divider">-</div>
            <div class="home-score">{{ runsFor }}</div>
          </div>
          <div class="inning-display">
            Inning {{ currentIndex + 1 }} / {{ questions.length }}
          </div>
        </div>
        <div class="scoreboard-stats">
          <div class="stat">
            <span class="stat-label">Batting Avg</span>
            <span class="stat-value">.{{ battingAverage }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">On Base</span>
            <span class="stat-value">{{ onBasePercentage }}%</span>
          </div>
        </div>
      </div>

      <!-- Question Area -->
      <div class="playing-field">
        <div v-if="currentQuestion" class="question-card">
          <!-- Question Header -->
          <div class="card-header">
            <div class="inning-badge">
              <span class="inning-icon">⚾</span>
              <span>Inning {{ currentIndex + 1 }}</span>
            </div>
            <div class="subject-badge">
              {{ currentQuestion.subject || "General" }}
            </div>
          </div>

          <!-- Question Text -->
          <div class="question-content">
            <div v-if="currentQuestion.prompt" class="question-prompt">
              {{ currentQuestion.prompt }}
            </div>
            <div class="question-text">
              {{ currentQuestion.question }}
            </div>
          </div>

          <!-- Answer Choices -->
          <div class="answer-choices">
            <button
              v-for="choice in choices"
              :key="choice.letter"
              class="choice-btn"
              :class="{
                selected: selectedAnswer === choice.letter,
                correct: showAnswer && choice.letter === currentQuestion.answer,
                wrong:
                  showAnswer &&
                  selectedAnswer === choice.letter &&
                  choice.letter !== currentQuestion.answer,
                revealed: showAnswer,
              }"
              :disabled="showAnswer"
              @click="selectAnswer(choice.letter)"
            >
              <span class="choice-letter">{{ choice.letter }}</span>
              <span class="choice-text">{{ choice.text }}</span>
              <span
                v-if="showAnswer && choice.letter === currentQuestion.answer"
                class="choice-indicator"
                >✓</span
              >
              <span
                v-if="
                  showAnswer &&
                  selectedAnswer === choice.letter &&
                  choice.letter !== currentQuestion.answer
                "
                class="choice-indicator"
                >✗</span
              >
            </button>
          </div>

          <!-- Answer Feedback -->
          <Transition name="slide-up">
            <div
              v-if="showAnswer"
              class="answer-feedback"
              :class="isCorrect ? 'home-run' : 'strikeout'"
            >
              <div class="feedback-icon">{{ isCorrect ? "⚾" : "💨" }}</div>
              <div class="feedback-phrase">{{ feedbackPhrase }}</div>
              <div v-if="currentQuestion.explanation" class="explanation">
                <strong>Explanation:</strong> {{ currentQuestion.explanation }}
              </div>
            </div>
          </Transition>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button
              v-if="!showAnswer && selectedAnswer"
              class="submit-btn"
              @click="submitAnswer"
            >
              🏏 Swing!
            </button>
            <button
              v-if="showAnswer && currentIndex < questions.length - 1"
              class="next-btn"
              @click="nextQuestion"
            >
              Next Inning →
            </button>
            <button
              v-if="showAnswer && currentIndex === questions.length - 1"
              class="finish-btn"
              @click="finishGame"
            >
              🏆 End Game
            </button>
          </div>
        </div>

        <!-- Topic Selector (On Deck) -->
        <div v-if="subjects.length > 0" class="topic-selector">
          <div class="dugout on-deck">
            <div class="dugout-label">🏏 On Deck</div>
            <select v-model="onDeckTopic" class="topic-select">
              <option value="">Random Topic</option>
              <option
                v-for="subject in subjects"
                :key="subject"
                :value="subject"
              >
                {{ subject }}
              </option>
            </select>
          </div>
          <div class="dugout in-the-hole">
            <div class="dugout-label">⚾ In the Hole</div>
            <select v-model="inTheHoleTopic" class="topic-select">
              <option value="">Random Topic</option>
              <option
                v-for="subject in subjects"
                :key="subject"
                :value="subject"
              >
                {{ subject }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="game-navigation">
        <button
          class="nav-btn"
          :disabled="currentIndex === 0"
          @click="prevQuestion"
        >
          ← Previous Inning
        </button>
        <div class="progress-innings">
          <span
            v-for="(_, idx) in questions"
            :key="idx"
            class="inning-dot"
            :class="{
              current: idx === currentIndex,
              hit: answers[idx] === questions[idx].answer,
              out: answers[idx] && answers[idx] !== questions[idx].answer,
            }"
            @click="goToQuestion(idx)"
          ></span>
        </div>
        <button
          class="nav-btn"
          @click="showAnswer ? nextQuestion() : null"
          :disabled="!showAnswer || currentIndex === questions.length - 1"
        >
          Next Inning →
        </button>
      </div>
    </div>

    <!-- Results Screen -->
    <div v-if="showResults" class="results-screen">
      <div class="results-content">
        <div class="final-scoreboard">
          <div class="team-result">
            <div class="team-name">LAW SCHOOL</div>
            <div class="team-score">{{ runsAgainst }}</div>
          </div>
          <div class="vs">VS</div>
          <div class="team-result winner">
            <div class="team-name">YOU</div>
            <div class="team-score">{{ runsFor }}</div>
          </div>
        </div>

        <div class="game-summary">
          <h2>{{ gameResult }}</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ runsFor }}</span>
              <span class="stat-label">Hits (Correct)</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ runsAgainst }}</span>
              <span class="stat-label">Outs (Wrong)</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">.{{ battingAverage }}</span>
              <span class="stat-label">Batting Avg</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ questions.length }}</span>
              <span class="stat-label">Innings Played</span>
            </div>
          </div>
        </div>

        <div class="results-message">
          <p v-if="percentage >= 65">⚾ You won the game! Great batting! ⚾</p>
          <p v-else>Keep practicing your swing. You'll get 'em next time!</p>
        </div>

        <div class="results-actions">
          <button
            class="btn btn--primary"
            @click="$emit('complete', quizResult)"
          >
            View Box Score
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
import { useApi } from "~/composables/useApi";
import { useGameAudio } from "~/composables/useGameAudio";
import type { Question } from "~/stores/quiz";

const props = defineProps<{
  questions: Question[];
}>();

const emit = defineEmits<{
  complete: [result: any];
  restart: [];
}>();

const { playSound, setTheme } = useGameAudio();
const { fetchSubjects } = useApi();

// Game state
const showIntro = ref(true);
const showResults = ref(false);
const currentIndex = ref(0);
const selectedAnswer = ref<string | null>(null);
const showAnswer = ref(false);
const answers = ref<(string | null)[]>(
  new Array(props.questions.length).fill(null),
);

// Baseball stats
const runsFor = ref(0);
const runsAgainst = ref(0);

// Topic selection
const subjects = ref<string[]>([]);
const onDeckTopic = ref("");
const inTheHoleTopic = ref("");

// Phrases
const hitPhrases = [
  "Home run! Outstanding!",
  "Grand slam! Perfect answer!",
  "Safe at home! Well done!",
  "You knocked it out of the park!",
  "Triple play! Excellent!",
  "RBI single! Nice work!",
];

const outPhrases = [
  "Strike out! Better luck next time.",
  "Caught looking! The correct answer is...",
  "Swing and a miss! Here's the right call...",
  "Foul ball! Close, but the answer is...",
  "Pop fly out! The correct answer is...",
];

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

const isCorrect = computed(() => {
  const q = currentQuestion.value;
  if (!q) return false;
  return selectedAnswer.value === q.answer;
});

const battingAverage = computed(() => {
  const atBats = runsFor.value + runsAgainst.value;
  if (atBats === 0) return "000";
  const avg = (runsFor.value / atBats) * 1000;
  return Math.round(avg).toString().padStart(3, "0");
});

const onBasePercentage = computed(() => {
  const atBats = runsFor.value + runsAgainst.value;
  if (atBats === 0) return 0;
  return Math.round((runsFor.value / atBats) * 100);
});

const percentage = computed(() =>
  Math.round((runsFor.value / props.questions.length) * 100),
);

const gameResult = computed(() => {
  if (runsFor.value > runsAgainst.value) return "🎉 YOU WIN! 🎉";
  if (runsFor.value < runsAgainst.value) return "Game Over";
  return "It's a Tie!";
});

const quizResult = computed(() => ({
  score: runsFor.value,
  total: props.questions.length,
  runsFor: runsFor.value,
  runsAgainst: runsAgainst.value,
  battingAverage: battingAverage.value,
  answers: answers.value.map((a, i) => {
    const q = props.questions[i];
    return {
      questionId: q?.id || `unknown-${i}`,
      selected: a,
      correct: q ? a === q.answer : false,
    };
  }),
}));

// Methods
const loadSubjects = async () => {
  try {
    const response = await fetchSubjects();
    subjects.value = response || [];
  } catch (error) {
    console.warn("Could not load subjects:", error);
  }
};

const skipIntro = () => {
  showIntro.value = false;
};

const startGame = () => {
  setTheme("baseball");
  playSound("intro");
  setTimeout(() => {
    showIntro.value = false;
  }, 500);
};

const selectAnswer = (letter: string) => {
  if (showAnswer.value) return;
  playSound("click");
  selectedAnswer.value = letter;
};

const submitAnswer = () => {
  if (!selectedAnswer.value) return;

  answers.value[currentIndex.value] = selectedAnswer.value;
  showAnswer.value = true;

  if (isCorrect.value) {
    runsFor.value++;
    playSound("correct");
    feedbackPhrase.value =
      hitPhrases[Math.floor(Math.random() * hitPhrases.length)] || "Home run!";
  } else {
    runsAgainst.value++;
    playSound("wrong");
    feedbackPhrase.value =
      outPhrases[Math.floor(Math.random() * outPhrases.length)] ||
      "Strike out!";
  }
};

const nextQuestion = () => {
  if (currentIndex.value < props.questions.length - 1) {
    playSound("transition");
    currentIndex.value++;
    selectedAnswer.value = answers.value[currentIndex.value] ?? null;
    showAnswer.value = answers.value[currentIndex.value] !== null;
  }
};

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    selectedAnswer.value = answers.value[currentIndex.value] ?? null;
    showAnswer.value = answers.value[currentIndex.value] !== null;
  }
};

const goToQuestion = (idx: number) => {
  currentIndex.value = idx;
  selectedAnswer.value = answers.value[idx] ?? null;
  showAnswer.value = answers.value[idx] !== null;
};

const finishGame = () => {
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

  if (showAnswer.value && e.code === "Enter") {
    if (currentIndex.value < props.questions.length - 1) {
      nextQuestion();
    } else {
      finishGame();
    }
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  loadSubjects();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.baseball-mode {
  min-height: 100vh;
  background: linear-gradient(180deg, #1e3c1e 0%, #0d1f0d 100%);
  color: #fff;
  font-family: var(--font-body);
}

/* Stadium Intro */
.stadium-intro {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #1e5631 0%, #0d2818 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.intro-content {
  text-align: center;
  animation: intro-zoom 0.8s ease-out;
}

@keyframes intro-zoom {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.baseball-logo {
  margin-bottom: 1.5rem;
}

.logo-ball {
  font-size: 5rem;
  animation: spin-ball 2s ease-in-out infinite;
}

@keyframes spin-ball {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(360deg);
  }
}

.logo-text {
  font-family: "Impact", "Arial Black", sans-serif;
  font-size: 3.5rem;
  color: #fff;
  text-shadow: 3px 3px 0 #8b0000;
  letter-spacing: 0.05em;
}

.logo-subtitle {
  font-size: 1.25rem;
  color: #90ee90;
  letter-spacing: 0.2em;
}

/* Baseball Field Visual */
.baseball-field-visual {
  width: 200px;
  height: 200px;
  margin: 1.5rem auto;
  position: relative;
}

.diamond {
  width: 100%;
  height: 100%;
  position: relative;
  transform: rotate(45deg);
}

.base {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #fff;
  border: 2px solid #333;
}

.base.home {
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%) rotate(-45deg);
}
.base.first {
  right: -10px;
  top: 50%;
  transform: translateY(-50%) rotate(-45deg);
}
.base.second {
  top: -10px;
  left: 50%;
  transform: translateX(-50%) rotate(-45deg);
}
.base.third {
  left: -10px;
  top: 50%;
  transform: translateY(-50%) rotate(-45deg);
}

.pitcher-mound {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  background: #d4a574;
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
}

.stadium-announcement {
  font-size: 1.25rem;
  color: #90ee90;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.stadium-announcement strong {
  color: #fff;
}

.play-ball-btn {
  background: linear-gradient(180deg, #8b0000 0%, #5c0000 100%);
  color: #fff;
  border: 3px solid #fff;
  border-radius: 50px;
  padding: 1rem 3rem;
  font-family: "Arial Black", sans-serif;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  text-shadow: 2px 2px 0 #000;
}

.play-ball-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
}

.skip-hint {
  margin-top: 1.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

/* Game Interface */
.game-interface {
  min-height: 100vh;
  padding: 1rem;
}

.baseball-field-bg {
  background:
    radial-gradient(ellipse at bottom, #2d5a27 0%, #1e3c1e 50%, #0d1f0d 100%),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 50px,
      rgba(255, 255, 255, 0.02) 50px,
      rgba(255, 255, 255, 0.02) 100px
    );
}

/* Scoreboard */
.baseball-scoreboard {
  background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
  border: 4px solid #333;
  border-radius: 12px;
  padding: 1rem 2rem;
  max-width: 600px;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.scoreboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.team-name {
  font-family: "Impact", sans-serif;
  font-size: 1rem;
  color: #ffd700;
  letter-spacing: 0.1em;
}

.scoreboard-title {
  font-size: 0.875rem;
  color: #ff6b6b;
}

.scoreboard-scores {
  text-align: center;
  margin-bottom: 0.5rem;
}

.score-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  font-family: "Courier New", monospace;
  font-size: 3rem;
  font-weight: bold;
}

.visitor-score {
  color: #ff6b6b;
}

.home-score {
  color: #90ee90;
}

.score-divider {
  color: #666;
}

.inning-display {
  font-size: 0.875rem;
  color: #888;
}

.scoreboard-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding-top: 0.5rem;
  border-top: 1px solid #333;
}

.scoreboard-stats .stat {
  text-align: center;
}

.scoreboard-stats .stat-label {
  display: block;
  font-size: 0.625rem;
  color: #666;
  text-transform: uppercase;
}

.scoreboard-stats .stat-value {
  font-family: "Courier New", monospace;
  font-size: 1.25rem;
  color: #ffd700;
}

/* Playing Field / Question Card */
.playing-field {
  max-width: 800px;
  margin: 0 auto;
}

.question-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  color: #1a1a1a;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.inning-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #1e5631;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-weight: bold;
}

.subject-badge {
  background: #f0f0f0;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  color: #666;
}

.question-content {
  margin-bottom: 1.5rem;
}

.question-prompt {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-style: italic;
  border-left: 4px solid #1e5631;
}

.question-text {
  font-size: 1.25rem;
  line-height: 1.6;
}

/* Answer Choices */
.answer-choices {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.choice-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
  background: #fff;
  border: 2px solid #ddd;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.choice-btn:hover:not(:disabled) {
  border-color: #1e5631;
  background: #f0fff0;
}

.choice-btn.selected {
  border-color: #1e5631;
  background: #e8f5e9;
  box-shadow: 0 0 0 2px #1e5631;
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

.choice-btn.revealed:not(.correct):not(.wrong) {
  opacity: 0.6;
}

.choice-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #1e5631;
  color: #fff;
  border-radius: 50%;
  font-weight: bold;
  flex-shrink: 0;
}

.choice-text {
  flex: 1;
}

.choice-indicator {
  font-size: 1.5rem;
  margin-left: auto;
}

/* Answer Feedback */
.answer-feedback {
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 1.5rem;
}

.answer-feedback.home-run {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: white;
}

.answer-feedback.strikeout {
  background: linear-gradient(135deg, #f44336, #c62828);
  color: white;
}

.feedback-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.feedback-phrase {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.explanation {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  text-align: left;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.submit-btn,
.next-btn,
.finish-btn {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: bold;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn {
  background: linear-gradient(180deg, #8b0000, #5c0000);
  color: #fff;
}

.submit-btn:hover {
  transform: scale(1.05);
}

.next-btn {
  background: #1e5631;
  color: #fff;
}

.finish-btn {
  background: linear-gradient(180deg, #ffd700, #ffb700);
  color: #1a1a1a;
}

/* Topic Selector */
.topic-selector {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: center;
}

.dugout {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.dugout-label {
  font-size: 0.875rem;
  color: #90ee90;
  margin-bottom: 0.5rem;
}

.topic-select {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid #333;
  background: #1a1a1a;
  color: #fff;
}

/* Navigation */
.game-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding: 1rem;
}

.nav-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.progress-innings {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.inning-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s;
}

.inning-dot.current {
  background: #ffd700;
  transform: scale(1.3);
}

.inning-dot.hit {
  background: #4caf50;
}

.inning-dot.out {
  background: #f44336;
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
  background: linear-gradient(180deg, #1a1a1a, #0a0a0a);
  border: 4px solid #333;
  border-radius: 20px;
  padding: 3rem;
  max-width: 500px;
  text-align: center;
}

.final-scoreboard {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.team-result {
  text-align: center;
}

.team-result .team-name {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.team-result .team-score {
  font-family: "Courier New", monospace;
  font-size: 4rem;
  font-weight: bold;
  color: #ff6b6b;
}

.team-result.winner .team-score {
  color: #90ee90;
}

.vs {
  font-size: 1.5rem;
  color: #666;
}

.game-summary h2 {
  font-size: 2rem;
  color: #ffd700;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 8px;
}

.stat-item .stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #90ee90;
}

.stat-item .stat-label {
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
}

.results-message {
  font-size: 1.25rem;
  color: #90ee90;
  margin-bottom: 2rem;
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
