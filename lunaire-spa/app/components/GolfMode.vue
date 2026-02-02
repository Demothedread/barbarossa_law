<template>
  <div class="golf-mode">
    <!-- Space Golf Intro -->
    <Transition name="fade">
      <div v-if="showIntro" class="space-intro" @click="skipIntro">
        <div class="stars-bg"></div>
        <div class="intro-content">
          <div class="crater-logo">
            <div class="moon-surface">
              <div class="crater c1"></div>
              <div class="crater c2"></div>
              <div class="crater c3"></div>
              <div class="flag">🏴‍☠️</div>
            </div>
          </div>

          <h1 class="space-title">BARBAROSSA'S</h1>
          <h2 class="crater-title">CRATER GOLF CLUB</h2>
          <div class="latin-motto">"Hostis Humanis Generis"</div>
          <div class="motto-translation">Enemy of All Mankind</div>

          <div class="course-info">
            <div class="holes-badge">{{ questions.length }}-HOLE COURSE</div>
            <div class="par-info">Par {{ questions.length * 2 }}</div>
          </div>

          <button class="tee-off-btn" @click.stop="startGame">
            <span class="golf-emoji">⛳</span>
            TEE OFF
          </button>
          <div class="skip-hint">Press SPACE to skip</div>
        </div>
      </div>
    </Transition>

    <!-- Main Golf Interface -->
    <div v-if="!showIntro && !showResults" class="golf-interface lunar-surface">
      <!-- Scorecard Header -->
      <div class="scorecard-header">
        <div class="course-name">
          <span class="pirate-flag">🏴‍☠️</span>
          BARBAROSSA'S CRATER GOLF CLUB
        </div>
        <div class="round-info">
          Hole {{ currentIndex + 1 }} of {{ questions.length }}
        </div>
      </div>

      <!-- Live Scorecard -->
      <div class="mini-scorecard">
        <div class="scorecard-row header-row">
          <div class="hole-label">HOLE</div>
          <div
            v-for="(_, idx) in questions.slice(0, 9)"
            :key="idx"
            class="hole-cell"
            :class="{ current: idx === currentIndex }"
          >
            {{ idx + 1 }}
          </div>
          <div class="total-cell">OUT</div>
        </div>
        <div class="scorecard-row par-row">
          <div class="hole-label">PAR</div>
          <div
            v-for="(_, idx) in questions.slice(0, 9)"
            :key="idx"
            class="hole-cell"
          >
            2
          </div>
          <div class="total-cell">{{ Math.min(questions.length, 9) * 2 }}</div>
        </div>
        <div class="scorecard-row score-row">
          <div class="hole-label">SCORE</div>
          <div
            v-for="(score, idx) in holeScores.slice(0, 9)"
            :key="idx"
            class="hole-cell"
            :class="getScoreClass(score)"
          >
            {{ score !== null ? formatScore(score) : "-" }}
          </div>
          <div class="total-cell">{{ frontNineTotal }}</div>
        </div>

        <!-- Back 9 (if needed) -->
        <template v-if="questions.length > 9">
          <div class="scorecard-row header-row">
            <div class="hole-label">HOLE</div>
            <div
              v-for="(_, idx) in questions.slice(9, 18)"
              :key="idx + 9"
              class="hole-cell"
              :class="{ current: idx + 9 === currentIndex }"
            >
              {{ idx + 10 }}
            </div>
            <div class="total-cell">IN</div>
          </div>
          <div class="scorecard-row par-row">
            <div class="hole-label">PAR</div>
            <div
              v-for="(_, idx) in questions.slice(9, 18)"
              :key="idx"
              class="hole-cell"
            >
              2
            </div>
            <div class="total-cell">
              {{ Math.min(questions.length - 9, 9) * 2 }}
            </div>
          </div>
          <div class="scorecard-row score-row">
            <div class="hole-label">SCORE</div>
            <div
              v-for="(score, idx) in holeScores.slice(9, 18)"
              :key="idx"
              class="hole-cell"
              :class="getScoreClass(score)"
            >
              {{ score !== null ? formatScore(score) : "-" }}
            </div>
            <div class="total-cell">{{ backNineTotal }}</div>
          </div>
        </template>
      </div>

      <!-- Current Score Summary -->
      <div class="score-summary">
        <div class="summary-item">
          <span class="summary-label">Total</span>
          <span class="summary-value" :class="getTotalClass">{{
            totalScore
          }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">vs Par</span>
          <span class="summary-value" :class="getVsParClass">{{ vsPar }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">🦅 Birdies</span>
          <span class="summary-value birdie-count">{{ birdieCount }}</span>
        </div>
      </div>

      <!-- Hole/Question Area -->
      <div class="golf-hole">
        <div class="hole-marker">
          <div class="flag-container">
            <div class="flag-pole"></div>
            <div class="flag">{{ currentIndex + 1 }}</div>
          </div>
          <div class="hole-name">HOLE {{ currentIndex + 1 }}</div>
          <div class="par-indicator">Par 2</div>
        </div>

        <!-- Timer -->
        <div class="shot-clock" :class="{ warning: timeRemaining <= 30 }">
          <div class="clock-face">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" class="clock-bg" />
              <circle
                cx="50"
                cy="50"
                r="45"
                class="clock-progress"
                :style="{ strokeDashoffset: timerProgress }"
              />
            </svg>
            <div class="clock-time">{{ formatTime(timeRemaining) }}</div>
          </div>
          <div class="time-label">Shot Clock</div>
        </div>

        <!-- Question Card -->
        <div v-if="currentQuestion" class="question-card">
          <div class="card-header">
            <span class="subject-tag">{{
              currentQuestion.subject || "General Law"
            }}</span>
            <span class="difficulty-tag">Par 2</span>
          </div>

          <!-- Question Text with Highlighter -->
          <div class="question-content">
            <div v-if="currentQuestion.prompt" class="question-prompt">
              <div
                class="highlightable-text"
                v-html="highlightedPrompt"
                @mouseup="handleHighlight"
              ></div>
            </div>
            <div class="question-text">
              <div
                class="highlightable-text"
                v-html="highlightedQuestion"
                @mouseup="handleHighlight"
              ></div>
            </div>
          </div>

          <!-- Highlighter Tools -->
          <div class="highlighter-tools">
            <button
              v-for="color in highlightColors"
              :key="color.name"
              class="highlight-btn"
              :class="{ active: activeHighlighter === color.name }"
              :style="{ background: color.value }"
              @click="setHighlighter(color.name)"
              :title="color.name"
            >
              <span v-if="activeHighlighter === color.name">✓</span>
            </button>
            <button class="highlight-btn clear-btn" @click="clearHighlights">
              Clear
            </button>
          </div>

          <!-- Answer Choices -->
          <div class="answer-choices">
            <button
              v-for="choice in choices"
              :key="choice.letter"
              class="choice-btn"
              :class="{
                selected: selectedAnswer === choice.letter,
                correct: showResult && choice.letter === currentQuestion.answer,
                wrong:
                  showResult &&
                  selectedAnswer === choice.letter &&
                  choice.letter !== currentQuestion.answer,
                revealed: showResult,
              }"
              :disabled="showResult"
              @click="selectAnswer(choice.letter)"
            >
              <span class="choice-letter">{{ choice.letter }}</span>
              <span class="choice-text">{{ choice.text }}</span>
            </button>
          </div>

          <!-- Result Display -->
          <Transition name="slide-up">
            <div v-if="showResult" class="hole-result" :class="resultClass">
              <div class="result-icon">{{ resultIcon }}</div>
              <div class="result-label">{{ resultLabel }}</div>
              <div class="result-score">
                {{ resultScore > 0 ? "+" : "" }}{{ resultScore }}
              </div>
              <div v-if="currentQuestion.explanation" class="explanation">
                {{ currentQuestion.explanation }}
              </div>
            </div>
          </Transition>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button
              v-if="!showResult && selectedAnswer"
              class="putt-btn"
              @click="submitAnswer"
            >
              ⛳ Take Your Shot
            </button>
            <button
              v-if="showResult && currentIndex < questions.length - 1"
              class="next-hole-btn"
              @click="nextHole"
            >
              Next Hole →
            </button>
            <button
              v-if="showResult && currentIndex === questions.length - 1"
              class="finish-btn"
              @click="finishRound"
            >
              🏆 Complete Round
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results / Clubhouse -->
    <div v-if="showResults" class="clubhouse-results">
      <div class="results-content">
        <div class="trophy-display">
          <div class="trophy">🏆</div>
          <h1>ROUND COMPLETE</h1>
        </div>

        <!-- Final Scorecard -->
        <div class="final-scorecard">
          <h2>Official Scorecard</h2>
          <table class="scorecard-table">
            <thead>
              <tr>
                <th>Hole</th>
                <th v-for="(_, idx) in questions" :key="idx">{{ idx + 1 }}</th>
                <th>Total</th>
              </tr>
              <tr>
                <th>Par</th>
                <th v-for="(_, idx) in questions" :key="idx">2</th>
                <th>{{ questions.length * 2 }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Score</td>
                <td
                  v-for="(score, idx) in holeScores"
                  :key="idx"
                  :class="getScoreClass(score)"
                >
                  {{ score !== null ? formatScore(score) : "-" }}
                </td>
                <td class="total">{{ totalScore }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Performance Summary -->
        <div class="performance-grid">
          <div class="perf-item">
            <span class="perf-icon">🦅</span>
            <span class="perf-count">{{ birdieCount }}</span>
            <span class="perf-label">Birdies</span>
          </div>
          <div class="perf-item">
            <span class="perf-icon">⛳</span>
            <span class="perf-count">{{ parCount }}</span>
            <span class="perf-label">Pars</span>
          </div>
          <div class="perf-item">
            <span class="perf-icon">😬</span>
            <span class="perf-count">{{ bogeyCount }}</span>
            <span class="perf-label">Bogeys</span>
          </div>
          <div class="perf-item">
            <span class="perf-icon">💀</span>
            <span class="perf-count">{{ doubleBogeyCount }}</span>
            <span class="perf-label">Double+</span>
          </div>
        </div>

        <div class="final-score-display">
          <div class="final-total">{{ totalScore }}</div>
          <div class="final-vs-par" :class="getVsParClass">
            {{ vsPar }} ({{ vsParLabel }})
          </div>
        </div>

        <div class="pirate-message">
          <p v-if="totalScore <= questions.length">
            🏴‍☠️ Ahoy! A true master of the crater course! 🏴‍☠️
          </p>
          <p v-else-if="totalScore <= questions.length * 2">
            ⛳ Solid round, matey! Barbarossa approves.
          </p>
          <p v-else>💀 Back to the practice green, landlubber!</p>
        </div>

        <div class="results-actions">
          <button
            class="btn btn--primary"
            @click="$emit('complete', quizResult)"
          >
            View Detailed Stats
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
import { useGolfScoring } from "~/composables/useGolfScoring";
import type { Question } from "~/stores/quiz";

const props = defineProps<{
  questions: Question[];
}>();

const emit = defineEmits<{
  complete: [result: any];
  restart: [];
}>();

const { playSound, setTheme } = useGameAudio();
const { calculateScore: golfCalculateScore, getScoreEmoji: _getScoreEmoji } =
  useGolfScoring();

// Constants
const PAR_TIME = 90; // seconds for par

// Helper to get label from score
const getScoreLabel = (score: number): string => {
  if (score === 1) return "Birdie";
  if (score === 2) return "Par";
  if (score === 3) return "Bogey";
  return "Double Bogey";
};

// Simple score calculation for the component (returns numeric)
const calculateScore = (isCorrect: boolean, elapsedSeconds: number): number => {
  if (isCorrect) {
    return elapsedSeconds < PAR_TIME ? 1 : 2; // Birdie or Par
  }
  return 3; // Bogey
};

// Game state
const showIntro = ref(true);
const showResults = ref(false);
const currentIndex = ref(0);
const selectedAnswer = ref<string | null>(null);
const showResult = ref(false);
const holeScores = ref<(number | null)[]>(
  new Array(props.questions.length).fill(null),
);
const answers = ref<(string | null)[]>(
  new Array(props.questions.length).fill(null),
);

// Timer
const timeRemaining = ref(120); // 2 minutes per hole
const timerInterval = ref<NodeJS.Timeout | null>(null);
const startTime = ref(0);

// Highlighting
const highlightColors = [
  { name: "yellow", value: "#ffeb3b" },
  { name: "green", value: "#a5d6a7" },
  { name: "blue", value: "#90caf9" },
  { name: "pink", value: "#f48fb1" },
];
const activeHighlighter = ref<string | null>(null);
const promptHighlights = ref<
  Array<{ start: number; end: number; color: string }>
>([]);
const questionHighlights = ref<
  Array<{ start: number; end: number; color: string }>
>([]);

// Current hole result
const resultScore = ref(0);
const resultLabel = ref("");
const resultIcon = ref("");
const resultClass = ref("");

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

const timerProgress = computed(() => {
  const circumference = 2 * Math.PI * 45;
  const progress = (120 - timeRemaining.value) / 120;
  return circumference * progress;
});

const totalScore = computed((): number =>
  holeScores.value.reduce((sum: number, s) => sum + (s ?? 0), 0),
);

const frontNineTotal = computed((): number =>
  holeScores.value.slice(0, 9).reduce((sum: number, s) => sum + (s ?? 0), 0),
);

const backNineTotal = computed((): number =>
  holeScores.value.slice(9, 18).reduce((sum: number, s) => sum + (s ?? 0), 0),
);

const holesPlayed = computed(
  () => holeScores.value.filter((s) => s !== null).length,
);

const coursePar = computed(() => holesPlayed.value * 2);

const vsPar = computed(() => {
  const diff = totalScore.value - coursePar.value;
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : diff.toString();
});

const vsParLabel = computed(() => {
  const diff = totalScore.value - coursePar.value;
  if (diff < -3) return "Amazing!";
  if (diff < 0) return "Under Par";
  if (diff === 0) return "Even";
  if (diff <= 3) return "Over Par";
  return "Needs Work";
});

const getTotalClass = computed(() => {
  const diff = totalScore.value - coursePar.value;
  if (diff < 0) return "under-par";
  if (diff === 0) return "even";
  return "over-par";
});

const getVsParClass = computed(() => {
  const diff = totalScore.value - coursePar.value;
  if (diff < 0) return "under-par";
  if (diff === 0) return "even";
  return "over-par";
});

const birdieCount = computed(
  () => holeScores.value.filter((s) => s === 1).length,
);
const parCount = computed(() => holeScores.value.filter((s) => s === 2).length);
const bogeyCount = computed(
  () => holeScores.value.filter((s) => s === 3).length,
);
const doubleBogeyCount = computed(
  () => holeScores.value.filter((s) => s !== null && s >= 4).length,
);

// Highlighted text
const highlightedPrompt = computed(() => {
  if (!currentQuestion.value?.prompt) return "";
  return applyHighlights(currentQuestion.value.prompt, promptHighlights.value);
});

const highlightedQuestion = computed(() => {
  if (!currentQuestion.value) return "";
  return applyHighlights(
    currentQuestion.value.question,
    questionHighlights.value,
  );
});

const quizResult = computed(() => ({
  score: holeScores.value.filter((s) => s !== null && s <= 2).length, // Correct = birdie or par
  total: props.questions.length,
  totalStrokes: totalScore.value,
  vsPar: vsPar.value,
  birdies: birdieCount.value,
  pars: parCount.value,
  bogeys: bogeyCount.value,
  doubleBogeys: doubleBogeyCount.value,
  holeScores: holeScores.value,
  answers: answers.value.map((a, i) => {
    const q = props.questions[i];
    return {
      questionId: q?.id || `unknown-${i}`,
      selected: a,
      correct: q ? a === q.answer : false,
      score: holeScores.value[i],
    };
  }),
}));

// Methods
const applyHighlights = (
  text: string,
  highlights: Array<{ start: number; end: number; color: string }>,
) => {
  if (highlights.length === 0) return text;

  // Sort highlights by start position (descending) to apply from end to start
  const sorted = [...highlights].sort((a, b) => b.start - a.start);
  let result = text;

  for (const h of sorted) {
    const before = result.slice(0, h.start);
    const highlighted = result.slice(h.start, h.end);
    const after = result.slice(h.end);
    result = `${before}<mark style="background: ${h.color}">${highlighted}</mark>${after}`;
  }

  return result;
};

const setHighlighter = (color: string) => {
  activeHighlighter.value = activeHighlighter.value === color ? null : color;
};

const handleHighlight = () => {
  if (!activeHighlighter.value) return;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const color =
    highlightColors.find((c) => c.name === activeHighlighter.value)?.value ||
    "#ffeb3b";
  const range = selection.getRangeAt(0);

  // Get the container to determine which text was highlighted
  const container = range.commonAncestorContainer;
  const isPrompt = container.parentElement?.closest(".question-prompt");

  const highlight = {
    start: range.startOffset,
    end: range.endOffset,
    color,
  };

  if (isPrompt) {
    promptHighlights.value.push(highlight);
  } else {
    questionHighlights.value.push(highlight);
  }

  selection.removeAllRanges();
};

const clearHighlights = () => {
  promptHighlights.value = [];
  questionHighlights.value = [];
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatScore = (score: number | null) => {
  if (score === null) return "-";
  return score.toString();
};

const getScoreClass = (score: number | null) => {
  if (score === null) return "";
  if (score === 1) return "birdie";
  if (score === 2) return "par";
  if (score === 3) return "bogey";
  return "double-bogey";
};

const skipIntro = () => {
  showIntro.value = false;
  startHole();
};

const startGame = () => {
  setTheme("classic"); // Using classic theme for golf
  playSound("intro");
  setTimeout(() => {
    showIntro.value = false;
    startHole();
  }, 500);
};

const startHole = () => {
  timeRemaining.value = 120;
  startTime.value = Date.now();
  clearHighlights();

  timerInterval.value = setInterval(() => {
    timeRemaining.value--;
    if (timeRemaining.value <= 0) {
      clearInterval(timerInterval.value!);
      handleTimeout();
    }
  }, 1000);
};

const selectAnswer = (letter: string) => {
  if (showResult.value) return;
  playSound("click");
  selectedAnswer.value = letter;
};

const submitAnswer = () => {
  if (!selectedAnswer.value || !currentQuestion.value) return;

  clearInterval(timerInterval.value!);
  const elapsedSeconds = Math.floor((Date.now() - startTime.value) / 1000);
  const isCorrect = selectedAnswer.value === currentQuestion.value.answer;

  // Calculate score
  const score = calculateScore(isCorrect, elapsedSeconds);
  holeScores.value[currentIndex.value] = score;
  answers.value[currentIndex.value] = selectedAnswer.value;

  // Set result display
  const label = getScoreLabel(score);
  resultScore.value = score;
  resultLabel.value = label;

  if (score === 1) {
    resultIcon.value = "🦅";
    resultClass.value = "birdie";
    playSound("correct");
  } else if (score === 2) {
    resultIcon.value = "⛳";
    resultClass.value = "par";
    playSound("correct");
  } else if (score === 3) {
    resultIcon.value = "😬";
    resultClass.value = "bogey";
    playSound("wrong");
  } else {
    resultIcon.value = "💀";
    resultClass.value = "double-bogey";
    playSound("wrong");
  }

  showResult.value = true;
};

const handleTimeout = () => {
  // Time ran out = double bogey
  holeScores.value[currentIndex.value] = 4;
  answers.value[currentIndex.value] = null;

  resultScore.value = 4;
  resultLabel.value = "Double Bogey";
  resultIcon.value = "💀";
  resultClass.value = "double-bogey";
  playSound("wrong");

  showResult.value = true;
};

const nextHole = () => {
  if (currentIndex.value < props.questions.length - 1) {
    playSound("transition");
    currentIndex.value++;
    selectedAnswer.value = null;
    showResult.value = false;
    startHole();
  }
};

const finishRound = () => {
  clearInterval(timerInterval.value!);

  // Play appropriate sound
  const diff = totalScore.value - coursePar.value;
  if (diff <= 0) {
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

  if (!showIntro.value && !showResults.value && !showResult.value) {
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

  if (showResult.value && e.code === "Enter") {
    if (currentIndex.value < props.questions.length - 1) {
      nextHole();
    } else {
      finishRound();
    }
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
});
</script>

<style scoped>
.golf-mode {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%);
  color: #fff;
  font-family: var(--font-body);
}

/* Space Intro */
.space-intro {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #000011 0%, #001133 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  overflow: hidden;
}

.stars-bg {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 20px 30px, #fff, transparent),
    radial-gradient(2px 2px at 40px 70px, #fff, transparent),
    radial-gradient(1px 1px at 90px 40px, #fff, transparent),
    radial-gradient(2px 2px at 130px 80px, #fff, transparent),
    radial-gradient(1px 1px at 160px 30px, #fff, transparent);
  background-size: 200px 100px;
  animation: twinkle 5s linear infinite;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.intro-content {
  text-align: center;
  z-index: 1;
  animation: float-in 1s ease-out;
}

@keyframes float-in {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.crater-logo {
  width: 150px;
  height: 150px;
  margin: 0 auto 1.5rem;
  position: relative;
}

.moon-surface {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 30%, #ddd, #888);
  border-radius: 50%;
  position: relative;
  box-shadow: 0 0 60px rgba(255, 255, 255, 0.3);
}

.crater {
  position: absolute;
  background: radial-gradient(circle, #666, #888);
  border-radius: 50%;
}

.crater.c1 {
  width: 30px;
  height: 30px;
  top: 30%;
  left: 20%;
}
.crater.c2 {
  width: 20px;
  height: 20px;
  top: 50%;
  left: 60%;
}
.crater.c3 {
  width: 15px;
  height: 15px;
  top: 70%;
  left: 40%;
}

.moon-surface .flag {
  position: absolute;
  top: 20%;
  right: 25%;
  font-size: 2rem;
  animation: wave-flag 1s ease-in-out infinite;
}

@keyframes wave-flag {
  0%,
  100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

.space-title {
  font-family: "Impact", "Arial Black", sans-serif;
  font-size: 3rem;
  color: #ffd700;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  margin: 0;
  letter-spacing: 0.2em;
}

.crater-title {
  font-size: 2rem;
  color: #90caf9;
  margin: 0.5rem 0;
  letter-spacing: 0.1em;
}

.latin-motto {
  font-style: italic;
  font-size: 1.25rem;
  color: #ff6b6b;
  margin-top: 1rem;
}

.motto-translation {
  font-size: 0.875rem;
  color: #888;
}

.course-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
}

.holes-badge,
.par-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tee-off-btn {
  background: linear-gradient(180deg, #4caf50, #2e7d32);
  color: #fff;
  border: 3px solid #fff;
  border-radius: 50px;
  padding: 1rem 3rem;
  font-family: "Arial Black", sans-serif;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
}

.tee-off-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(76, 175, 80, 0.5);
}

.skip-hint {
  margin-top: 1.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

/* Golf Interface */
.golf-interface {
  min-height: 100vh;
  padding: 1rem;
}

.lunar-surface {
  background: radial-gradient(
    ellipse at bottom,
    #2a2a4a 0%,
    #1a1a2e 50%,
    #0a0a1a 100%
  );
}

/* Scorecard Header */
.scorecard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.course-name {
  font-family: "Georgia", serif;
  font-size: 1.25rem;
  color: #ffd700;
}

.pirate-flag {
  margin-right: 0.5rem;
}

.round-info {
  color: #90caf9;
}

/* Mini Scorecard */
.mini-scorecard {
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a1a;
  border-radius: 8px;
  margin: 1rem auto;
  max-width: 700px;
  overflow: hidden;
  font-size: 0.75rem;
}

.scorecard-row {
  display: flex;
}

.header-row {
  background: #1a5a1a;
  color: #fff;
  font-weight: bold;
}

.par-row {
  background: #f5f5f5;
}

.score-row {
  background: #fff;
}

.hole-label {
  width: 50px;
  padding: 0.5rem;
  text-align: center;
  font-weight: bold;
  border-right: 1px solid #ddd;
}

.hole-cell {
  flex: 1;
  padding: 0.5rem;
  text-align: center;
  border-right: 1px solid #ddd;
  min-width: 28px;
}

.hole-cell.current {
  background: #fff3cd;
  font-weight: bold;
}

.hole-cell.birdie {
  background: #ff6b6b;
  color: #fff;
  font-weight: bold;
}

.hole-cell.par {
  background: #4caf50;
  color: #fff;
}

.hole-cell.bogey {
  background: #90caf9;
}

.hole-cell.double-bogey {
  background: #333;
  color: #fff;
}

.total-cell {
  width: 40px;
  padding: 0.5rem;
  text-align: center;
  font-weight: bold;
  background: #f0f0f0;
}

/* Score Summary */
.score-summary {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1rem;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: bold;
}

.summary-value.under-par {
  color: #ff6b6b;
}
.summary-value.even {
  color: #4caf50;
}
.summary-value.over-par {
  color: #90caf9;
}
.summary-value.birdie-count {
  color: #ffd700;
}

/* Golf Hole */
.golf-hole {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.hole-marker {
  text-align: center;
  margin-bottom: 1rem;
}

.flag-container {
  display: inline-block;
  position: relative;
}

.flag-pole {
  width: 3px;
  height: 60px;
  background: #ddd;
  margin: 0 auto;
}

.hole-marker .flag {
  position: absolute;
  top: 0;
  left: 5px;
  background: #ff6b6b;
  color: #fff;
  padding: 0.25rem 0.75rem;
  font-weight: bold;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  padding-right: 1rem;
}

.hole-name {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 0.5rem;
}

.par-indicator {
  color: #888;
}

/* Shot Clock */
.shot-clock {
  position: absolute;
  top: 0;
  right: 0;
  text-align: center;
}

.clock-face {
  width: 80px;
  height: 80px;
  position: relative;
}

.clock-face svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.clock-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 8;
}

.clock-progress {
  fill: none;
  stroke: #4caf50;
  stroke-width: 8;
  stroke-dasharray: 283;
  transition: stroke-dashoffset 1s linear;
}

.shot-clock.warning .clock-progress {
  stroke: #ff6b6b;
}

.clock-time {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: "Courier New", monospace;
  font-size: 1.25rem;
  font-weight: bold;
}

.shot-clock.warning .clock-time {
  color: #ff6b6b;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.time-label {
  font-size: 0.625rem;
  color: #888;
  text-transform: uppercase;
}

/* Question Card */
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

.subject-tag {
  background: #1a5a1a;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
}

.difficulty-tag {
  color: #888;
  font-size: 0.875rem;
}

.question-content {
  margin-bottom: 1rem;
}

.question-prompt {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-style: italic;
  border-left: 4px solid #1a5a1a;
}

.question-text {
  font-size: 1.125rem;
  line-height: 1.6;
}

.highlightable-text {
  cursor: text;
}

/* Highlighter Tools */
.highlighter-tools {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.highlight-btn {
  width: 32px;
  height: 32px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #333;
}

.highlight-btn.active {
  border-color: #333;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.highlight-btn.clear-btn {
  background: #fff;
  border: 1px solid #ddd;
  width: auto;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  margin-left: auto;
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
}

.choice-btn:hover:not(:disabled) {
  border-color: #1a5a1a;
  background: #f0fff0;
}

.choice-btn.selected {
  border-color: #1a5a1a;
  background: #e8f5e9;
  box-shadow: 0 0 0 2px #1a5a1a;
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
  background: #1a5a1a;
  color: #fff;
  border-radius: 50%;
  font-weight: bold;
  flex-shrink: 0;
}

.choice-text {
  flex: 1;
}

/* Hole Result */
.hole-result {
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 1.5rem;
}

.hole-result.birdie {
  background: linear-gradient(135deg, #ff6b6b, #c62828);
  color: white;
}

.hole-result.par {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: white;
}

.hole-result.bogey {
  background: linear-gradient(135deg, #90caf9, #1976d2);
  color: white;
}

.hole-result.double-bogey {
  background: linear-gradient(135deg, #333, #111);
  color: white;
}

.result-icon {
  font-size: 3rem;
}

.result-label {
  font-size: 1.5rem;
  font-weight: bold;
}

.result-score {
  font-size: 2rem;
  font-weight: bold;
  margin-top: 0.5rem;
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

.putt-btn,
.next-hole-btn,
.finish-btn {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: bold;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s;
}

.putt-btn {
  background: linear-gradient(180deg, #4caf50, #2e7d32);
  color: #fff;
}

.putt-btn:hover {
  transform: scale(1.05);
}

.next-hole-btn {
  background: #1a5a1a;
  color: #fff;
}

.finish-btn {
  background: linear-gradient(180deg, #ffd700, #ffb700);
  color: #1a1a1a;
}

/* Clubhouse Results */
.clubhouse-results {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a2a1a 100%);
}

.results-content {
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a1a;
  border-radius: 20px;
  padding: 3rem;
  max-width: 600px;
  text-align: center;
}

.trophy-display {
  margin-bottom: 2rem;
}

.trophy {
  font-size: 5rem;
  animation: trophy-shine 2s ease-in-out infinite;
}

@keyframes trophy-shine {
  0%,
  100% {
    filter: drop-shadow(0 0 10px gold);
  }
  50% {
    filter: drop-shadow(0 0 30px gold);
  }
}

.trophy-display h1 {
  font-size: 2rem;
  color: #1a5a1a;
  margin: 0;
}

/* Final Scorecard */
.final-scorecard {
  margin-bottom: 2rem;
}

.final-scorecard h2 {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 1rem;
}

.scorecard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.scorecard-table th,
.scorecard-table td {
  padding: 0.5rem;
  border: 1px solid #ddd;
  text-align: center;
}

.scorecard-table th {
  background: #1a5a1a;
  color: #fff;
}

.scorecard-table td.birdie {
  background: #ff6b6b;
  color: #fff;
}
.scorecard-table td.par {
  background: #4caf50;
  color: #fff;
}
.scorecard-table td.bogey {
  background: #90caf9;
}
.scorecard-table td.double-bogey {
  background: #333;
  color: #fff;
}
.scorecard-table td.total {
  font-weight: bold;
  background: #f0f0f0;
}

/* Performance Grid */
.performance-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.perf-item {
  text-align: center;
}

.perf-icon {
  display: block;
  font-size: 2rem;
}

.perf-count {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
}

.perf-label {
  font-size: 0.75rem;
  color: #888;
}

/* Final Score Display */
.final-score-display {
  background: #1a5a1a;
  color: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.final-total {
  font-size: 4rem;
  font-weight: bold;
}

.final-vs-par {
  font-size: 1.5rem;
}

.final-vs-par.under-par {
  color: #ff6b6b;
}
.final-vs-par.even {
  color: #90ee90;
}
.final-vs-par.over-par {
  color: #90caf9;
}

.pirate-message {
  font-size: 1.25rem;
  color: #666;
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
