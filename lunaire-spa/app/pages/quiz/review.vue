<template>
  <div class="review-view" :class="modeClass">
    <div class="review-container">
      <!-- Header Panel -->
      <div class="review-header">
        <div class="review-header__left">
          <NuxtLink to="/quiz/results" class="back-link">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Results
          </NuxtLink>
        </div>
        <div class="review-header__center">
          <h1 class="review-title">Review Session</h1>
          <span class="review-subtitle">
            {{ correctCount }} / {{ questions.length }} correct
          </span>
        </div>
        <div class="review-header__right">
          <div class="filter-group">
            <button
              class="filter-btn"
              :class="{ 'filter-btn--active': filter === 'all' }"
              @click="filter = 'all'"
            >
              All
            </button>
            <button
              class="filter-btn filter-btn--wrong"
              :class="{ 'filter-btn--active': filter === 'wrong' }"
              @click="filter = 'wrong'"
            >
              Wrong Only
            </button>
          </div>
        </div>
      </div>

      <!-- Questions List -->
      <div class="questions-list">
        <div
          v-for="(q, index) in filteredQuestions"
          :key="q.question.id"
          class="review-card"
          :class="{
            'review-card--correct': q.correct,
            'review-card--incorrect': !q.correct,
          }"
        >
          <div class="review-card__header">
            <span class="question-number">Q{{ q.originalIndex + 1 }}</span>
            <span class="question-status">
              {{ q.correct ? "Correct" : "Incorrect" }}
            </span>
          </div>

          <div class="review-card__body">
            <!-- Question Text -->
            <div class="question-section">
              <p v-if="q.question.prompt" class="question-prompt">
                {{ q.question.prompt }}
              </p>
              <p class="question-text">{{ q.question.question }}</p>
            </div>

            <!-- Answer Choices -->
            <div class="choices-section">
              <div
                v-for="choice in getChoices(q.question)"
                :key="choice.letter"
                class="review-choice"
                :class="getChoiceClass(choice.letter, q)"
              >
                <span class="choice-letter">{{ choice.letter }}</span>
                <span class="choice-text">{{ choice.text }}</span>
                <span
                  v-if="choice.letter === q.question.answer"
                  class="choice-marker correct-marker"
                  >✓ Correct</span
                >
                <span
                  v-else-if="choice.letter === q.selected && !q.correct"
                  class="choice-marker your-marker"
                  >Your answer</span
                >
              </div>
            </div>

            <!-- Explanation (expandable) -->
            <div class="explanation-section">
              <button
                class="explanation-toggle"
                @click="toggleExplanation(q.question.id)"
              >
                <span
                  >{{
                    expandedExplanations.has(q.question.id) ? "Hide" : "Show"
                  }}
                  Explanation</span
                >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  :class="{ rotated: expandedExplanations.has(q.question.id) }"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                v-if="expandedExplanations.has(q.question.id)"
                class="explanation-content"
              >
                <div
                  v-if="loadingExplanations.has(q.question.id)"
                  class="explanation-loading"
                >
                  <span class="loading-spinner"></span>
                  Generating explanation with AI...
                </div>
                <div
                  v-else-if="explanations[q.question.id]"
                  class="explanation-text"
                >
                  <p>
                    <strong>Correct Answer ({{ q.question.answer }}):</strong>
                  </p>
                  <p>
                    {{
                      explanations[q.question.id][q.question.answer] ||
                      "No explanation available."
                    }}
                  </p>

                  <template
                    v-if="!q.correct && explanations[q.question.id][q.selected]"
                  >
                    <p class="mt-4">
                      <strong>Why {{ q.selected }} is wrong:</strong>
                    </p>
                    <p>{{ explanations[q.question.id][q.selected] }}</p>
                  </template>

                  <!-- Feedback Buttons -->
                  <div class="explanation-feedback">
                    <span class="feedback-label"
                      >Was this explanation helpful?</span
                    >
                    <div class="feedback-buttons">
                      <button
                        class="feedback-btn feedback-btn--up"
                        :class="{
                          'feedback-btn--active':
                            feedbackState[q.question.id] === true,
                        }"
                        @click="submitFeedback(q.question.id, true)"
                        :disabled="feedbackLoading.has(q.question.id)"
                      >
                        👍
                      </button>
                      <button
                        class="feedback-btn feedback-btn--down"
                        :class="{
                          'feedback-btn--active':
                            feedbackState[q.question.id] === false,
                        }"
                        @click="submitFeedback(q.question.id, false)"
                        :disabled="feedbackLoading.has(q.question.id)"
                      >
                        👎
                      </button>
                    </div>
                    <span
                      v-if="feedbackState[q.question.id] === true"
                      class="feedback-thanks"
                    >
                      Thanks! This explanation will be saved.
                    </span>
                    <span
                      v-else-if="feedbackState[q.question.id] === false"
                      class="feedback-thanks feedback-thanks--negative"
                    >
                      Noted. This explanation won't be cached.
                    </span>
                  </div>
                </div>
                <div v-else class="explanation-text explanation-text--fallback">
                  <p>
                    {{
                      q.question.explanation ||
                      "No explanation available for this question."
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredQuestions.length === 0" class="empty-state">
        <p v-if="filter === 'wrong'">
          No wrong answers! Impressive. Did you cheat?
        </p>
        <p v-else>No questions to review. Something went wrong.</p>
      </div>

      <!-- Footer Navigation -->
      <div class="review-footer">
        <NuxtLink to="/quiz/setup" class="btn btn--primary">
          Practice Again
        </NuxtLink>
        <NuxtLink to="/" class="btn btn--ghost"> Back to Home </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "~/composables/useTheme";
import { useDailyTrackerStore } from "~/stores/dailyTracker";
import { useQuizStore, type Question } from "~/stores/quiz";

const route = useRoute();
const router = useRouter();
const quizStore = useQuizStore();
const dailyTracker = useDailyTrackerStore();
const api = useApi();
const { modeClass } = useTheme();

const filter = ref<"all" | "wrong">("all");
const expandedExplanations = ref(new Set<string>());
const loadingExplanations = ref(new Set<string>());
const explanations = ref<Record<string, Record<string, string>>>({});
const feedbackState = ref<Record<string, boolean | null>>({});
const feedbackLoading = ref(new Set<string>());
const reviewedQuestions = ref(new Set<string>());

// Get result from query or most recent
const resultId = computed(() => route.query.id as string);
const result = computed(() => {
  if (resultId.value) {
    return quizStore.quizHistory.find((r) => r.id === resultId.value);
  }
  return quizStore.quizHistory[0];
});

// Build question list with answers
const questions = computed(() => {
  if (!result.value) return [];

  return result.value.answers
    .map((answer, index) => {
      const question = quizStore.currentQuestions[index];
      return {
        question: question || ({} as Question),
        selected: answer.selected,
        correct: answer.correct,
        originalIndex: index,
      };
    })
    .filter((q) => q.question.id);
});

const filteredQuestions = computed(() => {
  if (filter.value === "wrong") {
    return questions.value.filter((q) => !q.correct);
  }
  return questions.value;
});

const correctCount = computed(
  () => questions.value.filter((q) => q.correct).length,
);

const getChoices = (question: Question) =>
  [
    { letter: "A", text: question.choice_a },
    { letter: "B", text: question.choice_b },
    { letter: "C", text: question.choice_c },
    { letter: "D", text: question.choice_d },
  ].filter((c) => c.text);

const getChoiceClass = (
  letter: string,
  q: { selected: string; correct: boolean; question: Question },
) => {
  const classes: string[] = [];

  if (letter === q.question.answer) {
    classes.push("review-choice--correct");
  } else if (letter === q.selected && !q.correct) {
    classes.push("review-choice--incorrect");
  }

  return classes;
};

const toggleExplanation = async (questionId: string) => {
  if (expandedExplanations.value.has(questionId)) {
    expandedExplanations.value.delete(questionId);
    expandedExplanations.value = new Set(expandedExplanations.value);
    return;
  }

  expandedExplanations.value.add(questionId);
  expandedExplanations.value = new Set(expandedExplanations.value);

  // Track this question as reviewed (only once per session)
  if (!reviewedQuestions.value.has(questionId)) {
    reviewedQuestions.value.add(questionId);

    // Find the question to get subject/subtopic info
    const questionInfo = questions.value.find(
      (q) => q.question.id === questionId,
    );
    const subject = questionInfo?.question.subject || "General";
    const subtopic = questionInfo?.question.subtopic || undefined;
    const correct = questionInfo?.correct || false;

    // Record in daily tracker
    dailyTracker.recordQuestionReviewed(subject, subtopic, correct);

    // Track review on backend
    try {
      await api.trackReview(questionId);
    } catch (e) {
      console.error("Failed to track review:", e);
    }
  }

  // Load existing feedback state if not already loaded
  if (feedbackState.value[questionId] === undefined) {
    try {
      const existingFeedback = await api.getExplanationFeedback(questionId);
      if (existingFeedback && existingFeedback.user_feedback !== null) {
        feedbackState.value[questionId] = existingFeedback.user_feedback;
      }
    } catch (e) {
      // No existing feedback, that's ok
    }
  }

  // Fetch explanation if not already loaded
  if (!explanations.value[questionId]) {
    loadingExplanations.value.add(questionId);
    loadingExplanations.value = new Set(loadingExplanations.value);

    try {
      const exp = await api.fetchExplanation(questionId);
      if (exp) {
        explanations.value[questionId] = exp;
      }
    } catch (e) {
      console.error("Failed to fetch explanation:", e);
    } finally {
      loadingExplanations.value.delete(questionId);
      loadingExplanations.value = new Set(loadingExplanations.value);
    }
  }
};

const submitFeedback = async (questionId: string, thumbsUp: boolean) => {
  feedbackLoading.value.add(questionId);
  feedbackLoading.value = new Set(feedbackLoading.value);

  try {
    await api.saveExplanationFeedback(questionId, thumbsUp);
    feedbackState.value[questionId] = thumbsUp;

    // Find the question info for tracking
    const questionInfo = questions.value.find(
      (q) => q.question.id === questionId,
    );
    const subject = questionInfo?.question.subject || "General";

    // Record feedback in daily tracker
    dailyTracker.recordExplanationFeedback(questionId, thumbsUp, subject);

    // If thumbs up, the backend will cache the explanation automatically
    if (thumbsUp) {
      console.log("Explanation approved and will be cached for future use");
    }
  } catch (e) {
    console.error("Failed to save feedback:", e);
  } finally {
    feedbackLoading.value.delete(questionId);
    feedbackLoading.value = new Set(feedbackLoading.value);
  }
};

// Redirect if no result
onMounted(() => {
  if (!result.value && !quizStore.quizHistory.length) {
    router.push("/quiz/setup");
  }
});
</script>

<style scoped>
.review-view {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
}

.review-container {
  max-width: 900px;
  margin: 0 auto;
}

/* Header */
.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(65, 90, 119, 0.3);
}

.review-header__center {
  text-align: center;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--star-silver);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.back-link svg {
  width: 20px;
  height: 20px;
}

.back-link:hover {
  color: var(--nebula-teal);
}

.review-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--lunar-white);
  margin: 0;
}

.review-subtitle {
  font-size: 0.9rem;
  color: var(--star-silver);
}

/* Filter Buttons */
.filter-group {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  font-size: 0.85rem;
  color: var(--star-silver);
  background: rgba(27, 38, 59, 0.4);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  border-color: var(--star-silver);
}

.filter-btn--active {
  color: var(--nebula-teal);
  background: rgba(0, 255, 200, 0.1);
  border-color: var(--nebula-teal);
}

.filter-btn--wrong.filter-btn--active {
  color: var(--plasma-orange);
  background: rgba(255, 107, 53, 0.1);
  border-color: var(--plasma-orange);
}

/* Question Cards */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.review-card {
  background: linear-gradient(
    135deg,
    rgba(27, 38, 59, 0.8) 0%,
    rgba(13, 27, 42, 0.9) 100%
  );
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 12px;
  overflow: hidden;
}

.review-card--correct {
  border-left: 4px solid var(--nebula-teal);
}

.review-card--incorrect {
  border-left: 4px solid var(--plasma-orange);
}

.review-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
}

.question-number {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--solar-gold);
}

.question-status {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.review-card--correct .question-status {
  color: var(--nebula-teal);
}

.review-card--incorrect .question-status {
  color: var(--plasma-orange);
}

.review-card__body {
  padding: 20px;
}

/* Question Section */
.question-section {
  margin-bottom: 20px;
}

.question-prompt {
  font-size: 0.9rem;
  color: var(--star-silver);
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(65, 90, 119, 0.2);
  line-height: 1.6;
}

.question-text {
  font-size: 1rem;
  color: var(--lunar-white);
  line-height: 1.7;
  margin: 0;
}

/* Choices Section */
.choices-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.review-choice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(27, 38, 59, 0.4);
  border: 1px solid rgba(65, 90, 119, 0.2);
  border-radius: 8px;
}

.review-choice--correct {
  background: rgba(0, 255, 200, 0.1);
  border-color: var(--nebula-teal);
}

.review-choice--incorrect {
  background: rgba(255, 107, 53, 0.1);
  border-color: var(--plasma-orange);
}

.choice-letter {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--star-silver);
  background: rgba(65, 90, 119, 0.3);
  border-radius: 50%;
}

.review-choice--correct .choice-letter {
  background: var(--nebula-teal);
  color: var(--void-black);
}

.review-choice--incorrect .choice-letter {
  background: var(--plasma-orange);
  color: var(--void-black);
}

.choice-text {
  flex: 1;
  font-size: 0.95rem;
  color: var(--lunar-white);
  line-height: 1.5;
}

.choice-marker {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 8px;
  border-radius: 4px;
}

.correct-marker {
  color: var(--nebula-teal);
  background: rgba(0, 255, 200, 0.15);
}

.your-marker {
  color: var(--plasma-orange);
  background: rgba(255, 107, 53, 0.15);
}

/* Explanation Section */
.explanation-section {
  border-top: 1px solid rgba(65, 90, 119, 0.2);
  padding-top: 16px;
}

.explanation-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--star-silver);
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.explanation-toggle:hover {
  color: var(--nebula-teal);
}

.explanation-toggle svg {
  width: 18px;
  height: 18px;
  transition: transform var(--transition-fast);
}

.explanation-toggle svg.rotated {
  transform: rotate(180deg);
}

.explanation-content {
  margin-top: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.explanation-loading {
  font-size: 0.9rem;
  color: var(--star-silver);
  font-style: italic;
}

.explanation-text {
  font-size: 0.95rem;
  color: var(--lunar-white);
  line-height: 1.7;
}

.explanation-text p {
  margin: 0 0 8px 0;
}

.explanation-text--fallback {
  color: var(--star-silver);
}

.mt-4 {
  margin-top: 16px;
}

/* Feedback Section */
.explanation-feedback {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(65, 90, 119, 0.3);
}

.feedback-label {
  font-size: 0.85rem;
  color: var(--star-silver);
}

.feedback-buttons {
  display: flex;
  gap: 8px;
}

.feedback-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(65, 90, 119, 0.5);
  background: transparent;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.feedback-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.feedback-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback-btn--up:hover:not(:disabled) {
  border-color: var(--color-success);
  background: rgba(40, 167, 69, 0.2);
}

.feedback-btn--down:hover:not(:disabled) {
  border-color: var(--color-danger);
  background: rgba(220, 53, 69, 0.2);
}

.feedback-btn--active.feedback-btn--up {
  border-color: var(--color-success);
  background: rgba(40, 167, 69, 0.3);
}

.feedback-btn--active.feedback-btn--down {
  border-color: var(--color-danger);
  background: rgba(220, 53, 69, 0.3);
}

.feedback-thanks {
  font-size: 0.8rem;
  color: var(--color-success);
  font-style: italic;
}

.feedback-thanks--negative {
  color: var(--star-silver);
}

.explanation-loading {
  font-size: 0.9rem;
  color: var(--star-silver);
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(65, 90, 119, 0.3);
  border-top-color: var(--nebula-teal);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--star-silver);
}

/* Footer */
.review-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid rgba(65, 90, 119, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    gap: 16px;
  }

  .review-header__left,
  .review-header__right {
    width: 100%;
  }

  .filter-group {
    justify-content: center;
  }
}
</style>
