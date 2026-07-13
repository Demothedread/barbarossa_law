<template>
  <!-- Alternative Game Modes -->
  <QuizShowMode
    v-if="quizMode === 'quizshow'"
    :questions="quizStore.currentQuestions"
    @complete="handleModeComplete"
    @restart="handleRestart"
  />
  <BaseballMode
    v-else-if="quizMode === 'baseball'"
    :questions="quizStore.currentQuestions"
    @complete="handleModeComplete"
    @restart="handleRestart"
  />
  <GolfMode
    v-else-if="quizMode === 'golf'"
    :questions="quizStore.currentQuestions"
    @complete="handleModeComplete"
    @restart="handleRestart"
  />
  <FootballMode
    v-else-if="quizMode === 'football'"
    :questions="quizStore.currentQuestions"
    @complete="handleModeComplete"
    @restart="handleRestart"
  />

  <!-- Classic Mode (default) -->
  <div
    v-else
    class="warp-zone"
    :class="[modeClass, { 'warp-zone--active': isWarping }]"
  >
    <!-- Hyperspace starfield with receding stars -->
    <div class="hyperspace">
      <div class="star-layer star-layer--far" />
      <div class="star-layer star-layer--mid" />
      <div class="star-layer star-layer--near" />
      <div class="warp-tunnel" />
    </div>

    <!-- Glassmorphic Question Card -->
    <div
      class="quiz-card"
      :class="{
        'quiz-card--entering': isEntering,
        'quiz-card--active': !isEntering,
      }"
    >
      <!-- Card HUD Header -->
      <div class="card-hud">
        <div class="hud-left">
          <span class="hud-label">QUESTION</span>
          <span class="hud-value">{{ currentIndex }}/{{ totalQuestions }}</span>
        </div>
        <div class="hud-center">
          <div class="progress-ring">
            <svg viewBox="0 0 36 36">
              <path
                class="ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                class="ring-fill"
                :stroke-dasharray="`${progress}, 100`"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span class="ring-text">{{ Math.round(progress) }}%</span>
          </div>
        </div>
        <div class="hud-right">
          <span class="hud-timer" :class="timerClass">{{ formattedTime }}</span>
          <button class="abort-btn" @click="confirmAbort" title="Exit Session">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Question Panel with Glass Effect -->
      <div class="glass-panel question-panel">
        <div class="panel-header">
          <span class="panel-badge">Question {{ currentIndex }}</span>
          <HighlightToolbar
            v-model="activeHighlight"
            @clear="clearHighlights"
          />
        </div>
        <div
          ref="questionBody"
          class="panel-content"
          @mouseup="handleHighlight"
        >
          <p
            v-if="currentQuestion?.prompt"
            class="question-prompt highlightable"
          >
            {{ currentQuestion.prompt }}
          </p>
          <p class="question-text highlightable">
            {{ currentQuestion?.question }}
          </p>
        </div>
      </div>

      <!-- Choices Panel with Glass Effect -->
      <div class="glass-panel choices-panel">
        <div class="choices-grid">
          <button
            v-for="(choice, index) in choices"
            :key="choice.letter"
            class="choice-card"
            :class="getChoiceClass(choice.letter)"
            @click="selectChoice(choice.letter)"
          >
            <span class="choice-letter">{{ choice.letter }}</span>
            <span
              class="choice-text highlightable"
              @mouseup="handleHighlight"
              >{{ choice.text }}</span
            >
            <span class="choice-indicator" />
          </button>
        </div>
      </div>

      <!-- Card Footer Navigation -->
      <div class="card-nav">
        <button
          class="nav-btn nav-btn--prev"
          :disabled="currentIndex === 1"
          @click="previousQuestion"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Previous</span>
        </button>

        <div class="nav-score">
          <span class="score-current">{{ currentScore }}</span>
          <span class="score-divider">/</span>
          <span class="score-total">{{ answeredCount }}</span>
        </div>

        <button
          v-if="!isLastQuestion"
          class="nav-btn nav-btn--next"
          :disabled="!hasAnswered"
          @click="nextQuestion"
        >
          <span>Next</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button
          v-else
          class="nav-btn nav-btn--complete"
          :disabled="!hasAnswered"
          @click="completeSession"
        >
          <span>Finish</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "~/composables/useTheme";
import { useApi } from "~/composables/useApi";
import { useQuizStore } from "~/stores/quiz";
import { useToastStore } from "~/stores/toast";

const router = useRouter();
const route = useRoute();
const quizStore = useQuizStore();
const toastStore = useToastStore();
const api = useApi();
const { modeClass, terminology } = useTheme();

const questionBody = ref<HTMLElement | null>(null);
const activeHighlight = ref<string | null>(null);
const elapsedTime = ref(0);
const isWarping = ref(false);
const isEntering = ref(true);

let timerInterval: ReturnType<typeof setInterval> | null = null;

// Get quiz mode from store
const quizMode = computed(() => quizStore.settings.mode);

// Handler for alternative mode completion
const handleModeComplete = (result: any) => {
  // Store the result and navigate to results page
  const quizResult = quizStore.completeQuizWithResult(result);
  router.push({ path: "/quiz/results", query: { id: quizResult.id } });
};

// Handler for restart
const handleRestart = () => {
  router.push("/quiz/setup");
};

// Computed
const currentQuestion = computed(() => quizStore.currentQuestion);
const currentIndex = computed(() => quizStore.currentIndex + 1);
const totalQuestions = computed(() => quizStore.totalQuestions);
const progress = computed(() => quizStore.progress);
const currentScore = computed(() => quizStore.currentScore);
const answeredCount = computed(() => quizStore.selectedAnswers.size);
const isLastQuestion = computed(
  () => currentIndex.value === totalQuestions.value,
);

const selectedAnswer = computed(() =>
  quizStore.selectedAnswers.get(quizStore.currentIndex),
);

const hasAnswered = computed(() => selectedAnswer.value !== undefined);

const choices = computed(() => {
  if (!currentQuestion.value) return [];
  return [
    { letter: "A", text: currentQuestion.value.choice_a },
    { letter: "B", text: currentQuestion.value.choice_b },
    { letter: "C", text: currentQuestion.value.choice_c },
    { letter: "D", text: currentQuestion.value.choice_d },
  ].filter((c) => c.text);
});

const formattedTime = computed(() => {
  const mins = Math.floor(elapsedTime.value / 60);
  const secs = elapsedTime.value % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
});

const timerClass = computed(() => {
  if (elapsedTime.value < 60) return "timer--good";
  if (elapsedTime.value < 90) return "timer--warning";
  return "timer--danger";
});

// Methods
const getChoiceClass = (letter: string) => {
  if (!selectedAnswer.value) return "";
  // During quiz, only show selected state - answers revealed after completion
  return selectedAnswer.value === letter ? "choice-card--selected" : "";
};

const triggerWarp = (callback: () => void) => {
  isWarping.value = true;
  isEntering.value = true;
  setTimeout(() => {
    callback();
    setTimeout(() => {
      isWarping.value = false;
      isEntering.value = false;
    }, 400);
  }, 300);
};

const selectChoice = (letter: string) => {
  // Allow changing answer - don't lock during quiz
  quizStore.selectAnswer(letter);
  // No toast showing correct/incorrect - answers revealed after completion
};

const nextQuestion = () => {
  triggerWarp(() => {
    elapsedTime.value = 0;
    clearHighlights();
    quizStore.nextQuestion();
  });
};

const previousQuestion = () => {
  triggerWarp(() => {
    clearHighlights();
    quizStore.previousQuestion();
  });
};

const completeSession = () => {
  if (timerInterval) clearInterval(timerInterval);
  const result = quizStore.completeQuiz();
  router.push({ path: "/quiz/results", query: { id: result.id } });
};

const confirmAbort = () => {
  if (confirm("Abandon session? Your progress won't be saved.")) {
    if (timerInterval) clearInterval(timerInterval);
    quizStore.reset();
    router.push("/");
  }
};

// Highlighting
const handleHighlight = () => {
  if (!activeHighlight.value) return;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const highlightable =
    container.nodeType === Node.ELEMENT_NODE
      ? (container as Element).closest(".highlightable")
      : container.parentElement?.closest(".highlightable");

  if (!highlightable) return;

  const highlight = document.createElement("span");
  highlight.className = `quiz-highlight quiz-highlight--${activeHighlight.value}`;

  try {
    range.surroundContents(highlight);
  } catch {
    const fragment = range.extractContents();
    highlight.appendChild(fragment);
    range.insertNode(highlight);
  }

  selection.removeAllRanges();
};

const clearHighlights = () => {
  if (!questionBody.value) return;
  const highlights = questionBody.value.querySelectorAll(".quiz-highlight");
  highlights.forEach((el) => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent || ""), el);
      parent.normalize();
    }
  });
};

// Lifecycle
const loadQuizFromQuery = async () => {
  const type = (route.query.type as string) || "mix";
  const subject = (route.query.subject as string) || "all";
  const count = Number(route.query.n) || 9;

  if (!["mix", "mbe", "generated"].includes(type)) {
    throw new Error("Invalid question type");
  }

  const anonymousId =
    localStorage.getItem("monobloc_anonymous_id") || crypto.randomUUID();
  localStorage.setItem("monobloc_anonymous_id", anonymousId);

  const questions = await api.fetchQuestions(
    count,
    subject,
    type,
    undefined,
    anonymousId,
    true,
  );

  if (!questions.length) {
    throw new Error("No questions available");
  }

  quizStore.updateSettings({
    subject,
    questionType: type as "mix" | "mbe" | "generated",
    questionCount: questions.length,
    mode: "classic",
  });
  quizStore.setQuestions(questions);
};

onMounted(async () => {
  // Quick-start links may navigate here before the store has questions.
  if (!quizStore.currentQuestions.length) {
    if (!route.query.type && !route.query.n && !route.query.subject) {
      router.push("/quiz/setup");
      return;
    }

    try {
      await loadQuizFromQuery();
    } catch {
      toastStore.error("Failed to load questions. Check your connection.");
      router.push("/quiz/setup");
      return;
    }
  }

  // Trigger entrance animation
  setTimeout(() => {
    isEntering.value = false;
  }, 600);

  // Start timer
  timerInterval = setInterval(() => {
    elapsedTime.value++;
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

// Watch for question changes to reset timer
watch(
  () => quizStore.currentIndex,
  () => {
    elapsedTime.value = 0;
  },
);
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   WARP ZONE - Hyperspace Travel Effect
   ═══════════════════════════════════════════════════════════════ */
.warp-zone {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  perspective: 1000px;
}

/* Hyperspace Starfield Background */
.hyperspace {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: var(--concrete);
}

/* Star Layers - Create depth with parallax */
.star-layer {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background-image:
    radial-gradient(
      2px 2px at 100px 50px,
      rgba(255, 255, 255, 0.9),
      transparent
    ),
    radial-gradient(
      2px 2px at 200px 150px,
      rgba(255, 255, 255, 0.7),
      transparent
    ),
    radial-gradient(
      1px 1px at 300px 100px,
      rgba(255, 255, 255, 0.6),
      transparent
    ),
    radial-gradient(
      2px 2px at 400px 200px,
      rgba(255, 255, 255, 0.8),
      transparent
    ),
    radial-gradient(1px 1px at 500px 80px, rgba(0, 71, 255, 0.3), transparent),
    radial-gradient(
      2px 2px at 150px 300px,
      rgba(255, 214, 0, 0.4),
      transparent
    ),
    radial-gradient(
      1px 1px at 350px 250px,
      rgba(123, 47, 190, 0.3),
      transparent
    );
  background-size: 600px 400px;
  transform-origin: center center;
  animation: starfield-drift 60s linear infinite;
}

.star-layer--far {
  opacity: 0.4;
  animation-duration: 120s;
}

.star-layer--mid {
  opacity: 0.6;
  animation-duration: 80s;
  animation-delay: -20s;
}

.star-layer--near {
  opacity: 0.9;
  animation-duration: 40s;
  animation-delay: -10s;
}

/* Warp Tunnel Effect - Radial speed lines */
.warp-tunnel {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 0%,
    transparent 40%,
    rgba(0, 71, 255, 0.02) 60%,
    rgba(0, 71, 255, 0.05) 80%,
    rgba(0, 71, 255, 0.08) 100%
  );
  opacity: 0;
  transition: opacity 0.5s ease;
}

/* Active warp state - Stars recede */
.warp-zone--active .star-layer {
  animation: star-warp 0.5s ease-out forwards;
}

.warp-zone--active .warp-tunnel {
  opacity: 1;
  animation: tunnel-pulse 0.5s ease-out;
}

@keyframes starfield-drift {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes star-warp {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(0.3) rotate(180deg);
    opacity: 0.2;
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}

@keyframes tunnel-pulse {
  0%,
  100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

/* ═══════════════════════════════════════════════════════════════
   GLASSMORPHIC QUIZ CARD
   ═══════════════════════════════════════════════════════════════ */
.quiz-card {
  position: relative;
  z-index: 10;
  width: 95%;
  max-width: 1200px;
  height: 90%;
  max-height: 800px;
  display: flex;
  flex-direction: column;

  /* Glassmorphism */
  background: var(--glass-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  /* Borders & Glow */
  border: 1px solid rgba(0, 71, 255, 0.12);
  border-radius: 0;
  box-shadow:
    0 0 60px rgba(0, 71, 255, 0.08),
    0 0 120px rgba(0, 71, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);

  /* Animation base */
  transform-origin: center center;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Card entrance animation - grows toward user */
.quiz-card--entering {
  transform: scale(0.7) translateZ(-200px) rotateX(10deg);
  opacity: 0;
}

.quiz-card--active {
  transform: scale(1) translateZ(0) rotateX(0);
  opacity: 1;
}

/* ═══════════════════════════════════════════════════════════════
   CARD HUD (Heads-Up Display Header)
   ═══════════════════════════════════════════════════════════════ */
.card-hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 71, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0;
}

.hud-left,
.hud-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hud-label {
  font-family: var(--font-display);
  font-size: 0.65rem;
  color: var(--star-silver);
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.hud-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--solar-gold);
  /* text-shadow removed */
}

/* Progress Ring */
.hud-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  position: relative;
  width: 50px;
  height: 50px;
}

.progress-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg,
.ring-fill {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
}

.ring-bg {
  stroke: var(--bevel-dark);
}

.ring-fill {
  stroke: var(--nebula-teal);
  stroke-dasharray: 0, 100;
  transition: stroke-dasharray 0.5s ease;
  filter: drop-shadow(0 0 4px var(--nebula-teal));
}

.ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--nebula-teal);
}

/* Timer */
.hud-timer {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0;
  border: 1px solid var(--bevel-dark);
}

.timer--good {
  color: var(--nebula-teal);
}
.timer--warning {
  color: var(--solar-gold);
}
.timer--danger {
  color: var(--plasma-orange);
  animation: pulse-danger 1s ease infinite;
}

@keyframes pulse-danger {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.abort-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(232, 55, 44, 0.08);
  border: 1px solid rgba(232, 55, 44, 0.15);
  border-radius: 50%;
  color: var(--plasma-orange);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.abort-btn:hover {
  background: rgba(255, 107, 53, 0.2);
  border-color: var(--plasma-orange);
  transform: scale(1.1);
}

/* ═══════════════════════════════════════════════════════════════
   GLASS PANELS
   ═══════════════════════════════════════════════════════════════ */
.glass-panel {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--bevel-dark);
  backdrop-filter: blur(10px);
}

.question-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 16px 24px 8px;
  border-radius: 0;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 71, 255, 0.05);
  border-bottom: 1px solid rgba(0, 71, 255, 0.08);
}

.panel-badge {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--nebula-teal);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 4px 12px;
  background: rgba(0, 71, 255, 0.08);
  border-radius: 0;
  border: 1px solid rgba(0, 71, 255, 0.12);
}

.panel-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  font-size: 1rem;
  line-height: 1.8;
}

.question-prompt {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--bevel-dark);
  color: var(--star-silver);
  font-size: 0.95rem;
}

.question-text {
  color: var(--lunar-white);
  font-size: 1.05rem;
}

.highlightable {
  cursor: text;
  user-select: text;
}

/* ═══════════════════════════════════════════════════════════════
   CHOICES PANEL
   ═══════════════════════════════════════════════════════════════ */
.choices-panel {
  margin: 8px 24px 16px;
  padding: 16px;
  border-radius: 0;
}

.choices-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.choice-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  overflow: hidden;
}

.choice-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(0, 71, 255, 0.05) 100%
  );
  opacity: 0;
  transition: opacity 0.2s ease;
}

.choice-card:hover:not(:disabled) {
  border-color: var(--nebula-teal);
  transform: translateY(-2px);
}

.choice-card:hover:not(:disabled)::before {
  opacity: 1;
}

.choice-card:disabled {
  cursor: default;
}

.choice-letter {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--nebula-teal);
  background: rgba(0, 71, 255, 0.08);
  border: 1px solid rgba(0, 71, 255, 0.15);
  border-radius: 0;
  transition: all 0.2s ease;
}

.choice-text {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--lunar-white);
}

.choice-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  opacity: 0;
  transition: all 0.2s ease;
}

/* Choice States */
.choice-card--selected {
  border-color: var(--nebula-teal);
  background: rgba(0, 71, 255, 0.08);
}

.choice-card--selected .choice-letter {
  background: var(--nebula-teal);
  color: var(--void-black);
}

.choice-card--correct {
  border-color: var(--nebula-teal);
  background: rgba(0, 71, 255, 0.1);
  animation: glow-correct 0.5s ease;
}

.choice-card--correct .choice-indicator {
  opacity: 1;
  background: var(--nebula-teal);
  box-shadow: var(--shadow-sm);
}

.choice-card--incorrect {
  border-color: var(--plasma-orange);
  background: rgba(232, 55, 44, 0.1);
  animation: shake 0.4s ease;
}

.choice-card--incorrect .choice-indicator {
  opacity: 1;
  background: var(--plasma-orange);
  box-shadow: 0 0 10px var(--plasma-orange);
}

@keyframes glow-correct {
  0%,
  100% {
    box-shadow: var(--shadow-sm);
  }
  50% {
    box-shadow: var(--shadow-lg);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
}

/* ═══════════════════════════════════════════════════════════════
   CARD NAVIGATION FOOTER
   ═══════════════════════════════════════════════════════════════ */
.card-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid var(--bevel-dark);
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn--prev {
  background: transparent;
  border: 1px solid var(--bevel-dark);
  color: var(--star-silver);
}

.nav-btn--prev:hover:not(:disabled) {
  border-color: var(--star-silver);
  color: var(--lunar-white);
}

.nav-btn--next,
.nav-btn--complete {
  background: var(--accent-blue);
  border: none;
  color: var(--void-black);
}

.nav-btn--next:hover:not(:disabled),
.nav-btn--complete:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.nav-score {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-display);
}

.score-current {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--nebula-teal);
  /* text-shadow removed */
}

.score-divider {
  font-size: 1rem;
  color: var(--star-silver);
}

.score-total {
  font-size: 1rem;
  color: var(--star-silver);
}

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE ADJUSTMENTS
   ═══════════════════════════════════════════════════════════════ */
@media (max-width: 900px) {
  .choices-grid {
    grid-template-columns: 1fr;
  }

  .quiz-card {
    height: 95%;
    border-radius: 0;
  }

  .card-hud {
    padding: 12px 16px;
    border-radius: 0 16px 0 0;
  }

  .card-nav {
    border-radius: 0 0 16px 16px;
  }
}

@media (max-width: 600px) {
  .hud-center {
    display: none;
  }

  .question-panel,
  .choices-panel {
    margin: 8px 12px;
  }
}
</style>
