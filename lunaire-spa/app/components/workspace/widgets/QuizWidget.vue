<template>
  <div class="quiz-widget">
    <!-- Quick Setup -->
    <div v-if="!isPlaying" class="quiz-setup">
      <h3 class="setup-title">Quick Quiz</h3>

      <div class="setup-form">
        <div class="form-group">
          <label class="form-label">Subject</label>
          <select v-model="selectedSubject" class="form-select">
            <option value="">All Subjects</option>
            <option v-for="subject in subjects" :key="subject" :value="subject">
              {{ subject }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Questions</label>
          <div class="question-count-btns">
            <button
              v-for="count in questionCounts"
              :key="count"
              class="count-btn"
              :class="{ active: questionCount === count }"
              @click="questionCount = count"
            >
              {{ count }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Question Type</label>
          <select v-model="questionType" class="form-select">
            <option value="mix">Mixed</option>
            <option value="mbe">MBE Only</option>
            <option value="generated">AI Generated</option>
          </select>
        </div>

        <button class="start-btn" @click="startQuiz" :disabled="isLoading">
          {{ isLoading ? "Loading..." : "Start Quiz" }}
        </button>
      </div>
    </div>

    <!-- Quiz in Progress -->
    <div v-else class="quiz-play">
      <div class="quiz-header">
        <div class="progress-info">
          <span class="question-number"
            >Q{{ currentIndex + 1 }}/{{ questions.length }}</span
          >
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>
        <button class="exit-btn" @click="exitQuiz">✕</button>
      </div>

      <div v-if="currentQuestion" class="question-content">
        <p class="question-text">
          {{ currentQuestion.prompt || currentQuestion.question }}
        </p>

        <div class="answer-options">
          <button
            v-for="(option, key) in currentOptions"
            :key="key"
            class="answer-btn"
            :class="{
              selected: selectedAnswer === key,
              correct: showResult && key === currentQuestion.answer,
              incorrect:
                showResult &&
                selectedAnswer === key &&
                key !== currentQuestion.answer,
            }"
            :disabled="showResult"
            @click="selectAnswer(key)"
          >
            <span class="answer-key">{{ key }}</span>
            <span class="answer-text">{{ option }}</span>
          </button>
        </div>
      </div>

      <div class="quiz-actions">
        <button
          v-if="!showResult"
          class="action-btn action-btn--primary"
          :disabled="!selectedAnswer"
          @click="checkAnswer"
        >
          Check Answer
        </button>
        <button
          v-else
          class="action-btn action-btn--primary"
          @click="nextQuestion"
        >
          {{
            currentIndex >= questions.length - 1
              ? "View Results"
              : "Next Question"
          }}
        </button>
      </div>

      <div
        v-if="showResult"
        class="result-feedback"
        :class="isCorrect ? 'correct' : 'incorrect'"
      >
        {{ isCorrect ? "✓ Correct!" : "✗ Incorrect" }}
      </div>
    </div>

    <!-- Results -->
    <div v-if="showResults" class="quiz-results">
      <h3 class="results-title">Quiz Complete!</h3>
      <div class="results-score">
        <span class="score-value"
          >{{ correctAnswers }}/{{ questions.length }}</span
        >
        <span class="score-label">Correct</span>
      </div>
      <div class="results-percent">
        {{ Math.round((correctAnswers / questions.length) * 100) }}%
      </div>
      <div class="results-actions">
        <button class="action-btn action-btn--secondary" @click="resetQuiz">
          New Quiz
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from "~/composables/useApi";
import type { Question } from "~/stores/quiz";

const { fetchQuestions } = useApi();

const subjects = [
  "Constitutional Law",
  "Contracts",
  "Criminal Law",
  "Evidence",
  "Property",
  "Torts",
  "Civil Procedure",
];

const questionCounts = [5, 10, 15, 20];

// Setup state
const selectedSubject = ref("");
const questionCount = ref(10);
const questionType = ref<"mix" | "mbe" | "generated">("mix");
const isLoading = ref(false);

// Quiz state
const isPlaying = ref(false);
const questions = ref<Question[]>([]);
const currentIndex = ref(0);
const selectedAnswer = ref<string | null>(null);
const showResult = ref(false);
const correctAnswers = ref(0);
const showResults = ref(false);

const currentQuestion = computed(() => questions.value[currentIndex.value]);

// Convert choice_a/b/c/d format to options object for rendering
const currentOptions = computed(() => {
  const q = currentQuestion.value;
  if (!q) return {};
  return {
    A: q.choice_a,
    B: q.choice_b,
    C: q.choice_c,
    D: q.choice_d,
  };
});

const progressPercent = computed(() =>
  questions.value.length > 0
    ? ((currentIndex.value + 1) / questions.value.length) * 100
    : 0,
);

const isCorrect = computed(
  () =>
    currentQuestion.value &&
    selectedAnswer.value === currentQuestion.value.answer,
);

const startQuiz = async () => {
  isLoading.value = true;
  try {
    // Use the API directly to fetch questions
    const fetchedQuestions = await fetchQuestions(
      questionCount.value,
      selectedSubject.value || "all",
      questionType.value,
    );
    questions.value = fetchedQuestions;
    isPlaying.value = true;
    currentIndex.value = 0;
    correctAnswers.value = 0;
    showResults.value = false;
    selectedAnswer.value = null;
    showResult.value = false;
  } catch {
    // Failed to load questions
  } finally {
    isLoading.value = false;
  }
};

const selectAnswer = (key: string) => {
  selectedAnswer.value = key;
};

const checkAnswer = () => {
  if (!selectedAnswer.value) return;
  showResult.value = true;
  if (isCorrect.value) {
    correctAnswers.value++;
  }
};

const nextQuestion = () => {
  if (currentIndex.value >= questions.value.length - 1) {
    showResults.value = true;
    isPlaying.value = false;
    return;
  }
  currentIndex.value++;
  selectedAnswer.value = null;
  showResult.value = false;
};

const exitQuiz = () => {
  isPlaying.value = false;
  showResults.value = false;
  resetQuiz();
};

const resetQuiz = () => {
  isPlaying.value = false;
  questions.value = [];
  currentIndex.value = 0;
  selectedAnswer.value = null;
  showResult.value = false;
  correctAnswers.value = 0;
  showResults.value = false;
};
</script>

<style scoped>
.quiz-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  overflow-y: auto;
}

/* Setup Styles */
.quiz-setup {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setup-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  text-align: center;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.form-select {
  padding: 10px 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.8);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
}

.question-count-btns {
  display: flex;
  gap: 8px;
}

.count-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.count-btn:hover {
  background: rgba(100, 116, 139, 0.2);
}

.count-btn.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.5);
  color: #38bdf8;
}

.start-btn {
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Quiz Play Styles */
.quiz-play {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.question-number {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s ease;
}

.exit-btn {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.exit-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

.question-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.question-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  padding: 12px;
  background: rgba(100, 116, 139, 0.1);
  border-radius: 10px;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.answer-btn {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.answer-btn:hover:not(:disabled) {
  background: rgba(100, 116, 139, 0.2);
}

.answer-btn.selected {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.5);
}

.answer-btn.correct {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.5);
}

.answer-btn.incorrect {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
}

.answer-btn:disabled {
  cursor: default;
}

.answer-key {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(100, 116, 139, 0.3);
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.answer-text {
  font-size: 0.9rem;
  line-height: 1.5;
}

.quiz-actions {
  padding-top: 12px;
}

.action-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn--primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
}

.action-btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.action-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn--secondary {
  background: rgba(100, 116, 139, 0.2);
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: rgba(255, 255, 255, 0.8);
}

.action-btn--secondary:hover {
  background: rgba(100, 116, 139, 0.3);
}

.result-feedback {
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  padding: 10px;
  border-radius: 8px;
}

.result-feedback.correct {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.result-feedback.incorrect {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Results Styles */
.quiz-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  text-align: center;
}

.results-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
}

.results-score {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.score-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
}

.score-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.results-percent {
  font-size: 1.5rem;
  font-weight: 600;
  color: #22c55e;
}

.results-actions {
  width: 100%;
  max-width: 200px;
}
</style>
