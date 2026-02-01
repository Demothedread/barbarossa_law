<template>
  <div class="essay-write-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading essay prompt...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h2>Error Loading Essay</h2>
      <p>{{ error }}</p>
      <button class="btn btn--primary" @click="navigateTo('/essays')">
        Back to Essays
      </button>
    </div>

    <!-- Essay Writer -->
    <div v-else-if="prompt" class="essay-writer">
      <!-- Header -->
      <div class="writer-header">
        <div class="header-left">
          <NuxtLink to="/essays" class="back-link">← Back to Essays</NuxtLink>
          <h1 class="essay-title">
            {{ prompt.exam_month }} {{ prompt.exam_year }} - Question
            {{ prompt.question_number }}
          </h1>
          <div class="essay-meta">
            <span v-if="prompt.subject" class="meta-badge subject-badge">
              {{ prompt.subject }}
            </span>
            <span class="meta-badge">{{ prompt.exam_id }}</span>
          </div>
        </div>
        <div class="header-right">
          <div
            class="word-count"
            :class="{ 'count-warning': wordCount > 2000 }"
          >
            {{ wordCount }} words
          </div>
          <div class="timer">{{ formatTime(elapsedSeconds) }}</div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="writer-content">
        <!-- Left Panel: Prompt -->
        <div class="panel prompt-panel">
          <div class="panel__header">
            <h2 class="panel__title">Essay Prompt</h2>
            <button
              class="btn btn--small btn--ghost"
              @click="showModelAnswer = !showModelAnswer"
              v-if="prompt.model_answer"
            >
              {{ showModelAnswer ? "Hide" : "Show" }} Model Answer
            </button>
          </div>
          <div class="panel__body">
            <div class="prompt-text">{{ prompt.prompt_text }}</div>

            <!-- Model Answer (Toggleable) -->
            <Transition name="slide">
              <div
                v-if="showModelAnswer && prompt.model_answer"
                class="model-answer"
              >
                <h3 class="model-answer__title">📚 Model Answer</h3>
                <div class="model-answer__text">{{ prompt.model_answer }}</div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Right Panel: Editor & Grade -->
        <div class="panel editor-panel">
          <div class="panel__header">
            <h2 class="panel__title">Your Essay</h2>
            <div class="header-actions">
              <button
                class="btn btn--small btn--ghost"
                @click="clearEssay"
                :disabled="!essayText.trim() || isGrading"
              >
                Clear
              </button>
              <button
                class="btn btn--small btn--primary"
                @click="submitForGrading"
                :disabled="wordCount < 50 || isGrading"
              >
                {{ isGrading ? "Grading..." : "Submit for Grading" }}
              </button>
            </div>
          </div>
          <div class="panel__body">
            <!-- Text Editor -->
            <div v-if="!gradeResult" class="editor-container">
              <textarea
                v-model="essayText"
                class="essay-editor"
                placeholder="Write your essay here...

Remember to use IRAC format:
• Issue: Identify the legal issues
• Rule: State the applicable legal rules
• Application: Apply the rules to the facts
• Conclusion: State your conclusion

Aim for 500-1500 words for a comprehensive answer."
                :disabled="isGrading"
                @input="handleInput"
              ></textarea>
            </div>

            <!-- Grading Result -->
            <div v-else class="grade-result">
              <div class="grade-header">
                <div
                  class="grade-score"
                  :class="getScoreClass(gradeResult.score)"
                >
                  <span class="score-value">{{ gradeResult.score }}</span>
                  <span class="score-max">/{{ gradeResult.max_score }}</span>
                </div>
                <div class="grade-info">
                  <span class="grader-badge">
                    Graded by {{ gradeResult.grader_model }}
                  </span>
                </div>
              </div>

              <!-- Overall Feedback -->
              <div class="feedback-section">
                <h3 class="feedback-title">Overall Feedback</h3>
                <p class="feedback-text">{{ gradeResult.overall_feedback }}</p>
              </div>

              <!-- Rubric Breakdown -->
              <div
                v-if="gradeResult.rubric_points?.length"
                class="rubric-section"
              >
                <h3 class="rubric-title">Rubric Breakdown</h3>
                <div class="rubric-items">
                  <div
                    v-for="(item, idx) in gradeResult.rubric_points"
                    :key="idx"
                    class="rubric-item"
                    :class="{
                      'rubric-item--full':
                        item.points_awarded === item.points_possible,
                      'rubric-item--partial':
                        item.points_awarded > 0 &&
                        item.points_awarded < item.points_possible,
                      'rubric-item--zero': item.points_awarded === 0,
                    }"
                  >
                    <div class="rubric-item__header">
                      <span class="rubric-criterion">{{ item.criterion }}</span>
                      <span class="rubric-points">
                        {{ item.points_awarded }}/{{ item.points_possible }}
                      </span>
                    </div>
                    <p class="rubric-justification">{{ item.justification }}</p>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="grade-actions">
                <button class="btn btn--ghost" @click="tryAgain">
                  Write Another Essay
                </button>
                <button
                  class="btn btn--primary"
                  @click="showModelAnswer = true"
                  v-if="prompt.model_answer && !showModelAnswer"
                >
                  View Model Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const api = useApi();

// State
const prompt = ref<{
  id: number;
  exam_id: string;
  exam_year: number;
  exam_month: string;
  question_number: number;
  subject: string | null;
  prompt_text: string;
  model_answer: string | null;
} | null>(null);

const loading = ref(true);
const error = ref<string | null>(null);
const essayText = ref("");
const isGrading = ref(false);
const showModelAnswer = ref(false);
const gradeResult = ref<{
  score: number;
  max_score: number;
  overall_feedback: string;
  rubric_points: Array<{
    criterion: string;
    points_possible: number;
    points_awarded: number;
    justification: string;
  }>;
  grader_model: string;
  model_answer?: string;
} | null>(null);

// Timer
const elapsedSeconds = ref(0);
let timerInterval: ReturnType<typeof setInterval> | null = null;

// Computed
const wordCount = computed(() => {
  const text = essayText.value.trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
});

// Methods
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getScoreClass = (score: number): string => {
  if (score >= 70) return "score--passing";
  if (score >= 50) return "score--marginal";
  return "score--failing";
};

const handleInput = () => {
  // Start timer on first input
  if (!timerInterval && essayText.value.trim()) {
    timerInterval = setInterval(() => {
      elapsedSeconds.value++;
    }, 1000);
  }
};

const clearEssay = () => {
  if (confirm("Are you sure you want to clear your essay?")) {
    essayText.value = "";
    gradeResult.value = null;
    elapsedSeconds.value = 0;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
};

const submitForGrading = async () => {
  if (wordCount.value < 50) {
    alert("Please write at least 50 words before submitting.");
    return;
  }

  isGrading.value = true;

  try {
    // Get anonymous ID from localStorage
    let anonymousId = localStorage.getItem("anonymous_id");
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("anonymous_id", anonymousId);
    }

    // Submit essay with auto-grade
    const result = await api.submitEssay({
      prompt_id: prompt.value!.id,
      essay_text: essayText.value,
      anonymous_id: anonymousId,
      auto_grade: true,
    });

    if (result.grade) {
      gradeResult.value = result.grade;
    } else if (result.grade_error) {
      throw new Error(result.grade_error);
    } else {
      // If no auto-grade, manually request grading
      const grade = await api.gradeEssay(result.essay_id);
      gradeResult.value = grade;
    }

    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  } catch (err) {
    console.error("Grading error:", err);
    alert(
      `Failed to grade essay: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  } finally {
    isGrading.value = false;
  }
};

const tryAgain = () => {
  essayText.value = "";
  gradeResult.value = null;
  elapsedSeconds.value = 0;
  showModelAnswer.value = false;
};

// Fetch prompt on mount
onMounted(async () => {
  const promptId = Number(route.params.id);

  if (!promptId || isNaN(promptId)) {
    error.value = "Invalid essay prompt ID";
    loading.value = false;
    return;
  }

  try {
    const { prompt: fetchedPrompt } = await api.fetchEssayPrompt(promptId);
    prompt.value = fetchedPrompt;
  } catch (err) {
    console.error("Failed to fetch prompt:", err);
    error.value =
      err instanceof Error ? err.message : "Failed to load essay prompt";
  } finally {
    loading.value = false;
  }
});

// Cleanup timer on unmount
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>

<style scoped>
.essay-write-page {
  height: 100%;
  overflow: hidden;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  text-align: center;
  color: var(--star-silver);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(0, 255, 200, 0.1);
  border-top-color: var(--nebula-teal);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 3rem;
}

/* Writer Layout */
.essay-writer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.writer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(65, 90, 119, 0.3);
  background: rgba(27, 38, 59, 0.5);
}

.header-left {
  flex: 1;
}

.back-link {
  display: inline-block;
  color: var(--star-silver);
  text-decoration: none;
  font-size: 0.85rem;
  margin-bottom: 8px;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--nebula-teal);
}

.essay-title {
  font-family: "strenuous", var(--font-display);
  font-size: 1.5rem;
  font-weight: 200;
  color: var(--solar-gold);
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.essay-meta {
  display: flex;
  gap: 8px;
}

.meta-badge {
  padding: 4px 10px;
  background: rgba(65, 90, 119, 0.3);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--star-silver);
}

.subject-badge {
  background: rgba(0, 255, 200, 0.1);
  color: var(--nebula-teal);
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.word-count {
  font-size: 1rem;
  color: var(--nebula-teal);
  font-family: var(--font-mono);
}

.count-warning {
  color: var(--solar-gold);
}

.timer {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  color: var(--lunar-white);
}

/* Content Grid */
.writer-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

@media (max-width: 1024px) {
  .writer-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}

/* Panels */
.panel {
  display: flex;
  flex-direction: column;
  background: var(--space-navy);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 12px;
  overflow: hidden;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(27, 38, 59, 0.5);
  border-bottom: 1px solid rgba(65, 90, 119, 0.3);
}

.panel__title {
  font-size: 1rem;
  font-family: var(--font-display);
  color: var(--nebula-teal);
  margin: 0;
}

.panel__body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* Prompt Panel */
.prompt-text {
  white-space: pre-wrap;
  line-height: 1.7;
  color: var(--lunar-white);
  font-size: 0.95rem;
}

.model-answer {
  margin-top: 24px;
  padding: 16px;
  background: rgba(65, 90, 119, 0.2);
  border-radius: 8px;
  border-left: 3px solid var(--solar-gold);
}

.model-answer__title {
  font-size: 0.9rem;
  color: var(--solar-gold);
  margin-bottom: 12px;
}

.model-answer__text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--star-silver);
  font-size: 0.9rem;
}

/* Editor */
.editor-container {
  height: 100%;
}

.essay-editor {
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 16px;
  background: rgba(27, 38, 59, 0.3);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 8px;
  color: var(--lunar-white);
  font-size: 1rem;
  line-height: 1.7;
  resize: none;
  font-family: inherit;
}

.essay-editor::placeholder {
  color: var(--star-silver);
  opacity: 0.6;
}

.essay-editor:focus {
  outline: none;
  border-color: var(--nebula-teal);
}

.essay-editor:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Grade Result */
.grade-result {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.grade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grade-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-value {
  font-size: 3rem;
  font-family: var(--font-display);
  font-weight: bold;
}

.score-max {
  font-size: 1.5rem;
  color: var(--star-silver);
}

.score--passing .score-value {
  color: #4caf50;
}

.score--marginal .score-value {
  color: var(--solar-gold);
}

.score--failing .score-value {
  color: #f44336;
}

.grader-badge {
  padding: 6px 12px;
  background: rgba(65, 90, 119, 0.3);
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--star-silver);
}

/* Feedback Section */
.feedback-section {
  padding: 16px;
  background: rgba(27, 38, 59, 0.3);
  border-radius: 8px;
}

.feedback-title {
  font-size: 1rem;
  color: var(--nebula-teal);
  margin-bottom: 12px;
}

.feedback-text {
  line-height: 1.6;
  color: var(--lunar-white);
}

/* Rubric Section */
.rubric-section {
  padding: 16px;
  background: rgba(27, 38, 59, 0.3);
  border-radius: 8px;
}

.rubric-title {
  font-size: 1rem;
  color: var(--nebula-teal);
  margin-bottom: 16px;
}

.rubric-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rubric-item {
  padding: 12px;
  background: rgba(65, 90, 119, 0.2);
  border-radius: 8px;
  border-left: 3px solid var(--star-silver);
}

.rubric-item--full {
  border-left-color: #4caf50;
}

.rubric-item--partial {
  border-left-color: var(--solar-gold);
}

.rubric-item--zero {
  border-left-color: #f44336;
}

.rubric-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rubric-criterion {
  font-weight: 500;
  color: var(--lunar-white);
}

.rubric-points {
  font-family: var(--font-mono);
  color: var(--nebula-teal);
}

.rubric-justification {
  font-size: 0.9rem;
  color: var(--star-silver);
  line-height: 1.5;
  margin: 0;
}

/* Grade Actions */
.grade-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 16px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn--small {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.btn--primary {
  background: var(--nebula-teal);
  color: var(--deep-space);
}

.btn--primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn--ghost {
  background: transparent;
  border: 1px solid rgba(65, 90, 119, 0.5);
  color: var(--star-silver);
}

.btn--ghost:hover:not(:disabled) {
  border-color: var(--nebula-teal);
  color: var(--nebula-teal);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding: 0;
  margin: 0;
}
</style>
