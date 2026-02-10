<template>
  <div class="results-view">
    <div class="panel-container">
      <!-- Scorecard Panel -->
      <div class="panel panel--wide">
        <div class="panel__header">
          <h2 class="panel__title">Session Complete</h2>
        </div>
        <div class="panel__body">
          <div class="scorecard">
            <!-- Score Summary -->
            <div class="scorecard__hero">
              <div class="score-ring" :class="scoreClass">
                <span class="score-ring__value">{{ scorePercent }}%</span>
                <span class="score-ring__label">{{ scoreLabel }}</span>
              </div>
              <div class="scorecard__details">
                <p class="scorecard__commentary">{{ scoreCommentary }}</p>
                <div class="detail-row">
                  <span class="detail-label">Correct</span>
                  <span class="detail-value"
                    >{{ result?.score ?? 0 }} / {{ result?.total ?? 0 }}</span
                  >
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time</span>
                  <span class="detail-value">{{ formattedTime }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Subject</span>
                  <span class="detail-value">{{ subjectLabel }}</span>
                </div>
              </div>
            </div>

            <!-- Per-Question Breakdown -->
            <div class="scorecard__breakdown">
              <h3 class="breakdown-title">Question by Question</h3>
              <p class="breakdown-hint">Click to review</p>
              <div class="breakdown-grid">
                <NuxtLink
                  v-for="(answer, index) in result?.answers ?? []"
                  :key="index"
                  :to="{ path: '/quiz/review', query: { id: resultId } }"
                  class="question-result"
                  :class="
                    answer.correct
                      ? 'question-result--correct'
                      : 'question-result--incorrect'
                  "
                >
                  <span class="question-result__number">{{ index + 1 }}</span>
                  <span class="question-result__icon">{{
                    answer.correct ? "+" : "-"
                  }}</span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
        <div class="panel__footer">
          <NuxtLink
            :to="{ path: '/quiz/review', query: { id: resultId } }"
            class="btn btn--secondary"
          >
            Review Answers
          </NuxtLink>
          <NuxtLink to="/" class="btn btn--ghost"> Back to Home </NuxtLink>
          <NuxtLink to="/quiz/setup" class="btn btn--primary">
            Try Again
          </NuxtLink>
        </div>
      </div>

      <!-- Stats Panel -->
      <div class="panel panel--narrow">
        <div class="panel__header">
          <h2 class="panel__title">Performance</h2>
        </div>
        <div class="panel__body">
          <div class="performance-stats">
            <div class="stat-card">
              <div class="stat-card__value">{{ fastAnswers }}</div>
              <div class="stat-card__label">Fast Correct (&lt;60s)</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">{{ slowAnswers }}</div>
              <div class="stat-card__label">Slow Correct (60-90s)</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">{{ wrongAnswers }}</div>
              <div class="stat-card__label">Wrong Answers</div>
            </div>
          </div>

          <div class="trend-section">
            <h4 class="trend-title">Recent Trend</h4>
            <div class="trend-chart">
              <div
                v-for="(round, index) in recentRounds"
                :key="index"
                class="trend-bar"
                :style="{ height: round.percent + '%' }"
                :class="getTrendClass(round.percent)"
                :title="`${round.percent}%`"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuizStore } from "~/stores/quiz";

const route = useRoute();
const quizStore = useQuizStore();

const resultId = computed(() => route.query.id as string);

const result = computed(() =>
  quizStore.quizHistory.find((r) => r.id === resultId.value),
);

const scorePercent = computed(() => {
  if (!result.value) return 0;
  return Math.round((result.value.score / result.value.total) * 100);
});

const scoreClass = computed(() => {
  if (scorePercent.value >= 80) return "score-ring--excellent";
  if (scorePercent.value >= 65) return "score-ring--good";
  return "score-ring--needs-work";
});

const scoreLabel = computed(() => {
  if (scorePercent.value >= 90) return "Outstanding";
  if (scorePercent.value >= 80) return "Passing";
  if (scorePercent.value >= 65) return "Borderline";
  if (scorePercent.value >= 50) return "Failing";
  return "Catastrophic";
});

// Satirical commentary based on score
const scoreCommentary = computed(() => {
  const p = scorePercent.value;
  if (p >= 90) {
    return "Congratulations. You're doing this on a free, unaccredited, probably-illegal bar review site and outperforming people who paid $4,000. Let that sink in.";
  }
  if (p >= 80) {
    return "Acceptable performance. You've demonstrated the adequacy that is Deez' Eazy-Breezy's entire brand promise. Unlike those $4,000 courses, we won't pretend this makes you 'empowered.' But you're doing fine.";
  }
  if (p >= 65) {
    return "You're in the danger zone — that statistical purgatory where examiners watch candidates squirm. But hey, at least your bar review is free. Study more. Come back. We'll be here.";
  }
  if (p >= 50) {
    return "Listen, Rome wasn't built in a day and neither is bar exam competence. The good news: this site is free, the questions are unlimited, and nobody named Brad is going to email you about it. Keep at it.";
  }
  return "We're not going to sugarcoat it. But we're also not going to charge you $4,000 to hear bad news from someone named Brad. Practice more. It's free. That's literally our whole thing.";
});

const formattedTime = computed(() => {
  const ms = result.value?.timeSpent ?? 0;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
});

const subjectLabel = computed(() => {
  const subject = result.value?.subject;
  if (!subject || subject === "all") return "All Subjects";
  return subject.charAt(0).toUpperCase() + subject.slice(1);
});

// Performance metrics
const fastAnswers = computed(
  () => result.value?.answers.filter((a) => a.correct).length ?? 0,
);
const slowAnswers = computed(() => 0); // Would need timing data
const wrongAnswers = computed(
  () => result.value?.answers.filter((a) => !a.correct).length ?? 0,
);

const recentRounds = computed(() =>
  quizStore.quizHistory.slice(0, 10).map((r) => ({
    percent: Math.round((r.score / r.total) * 100),
  })),
);

const getTrendClass = (percent: number) => {
  if (percent >= 80) return "trend-bar--excellent";
  if (percent >= 65) return "trend-bar--good";
  return "trend-bar--needs-work";
};
</script>

<style scoped>
.results-view {
  height: 100%;
}

.scorecard {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.scorecard__hero {
  display: flex;
  align-items: center;
  gap: 48px;
}

.score-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 4px solid;
  background: rgba(0, 0, 0, 0.2);
}

.score-ring--excellent {
  border-color: var(--nebula-teal);
  box-shadow: 0 0 30px rgba(0, 255, 200, 0.3);
}

.score-ring--good {
  border-color: var(--solar-gold);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.2);
}

.score-ring--needs-work {
  border-color: var(--plasma-orange);
  box-shadow: 0 0 30px rgba(255, 107, 53, 0.2);
}

.score-ring__value {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--lunar-white);
}

.score-ring__label {
  font-size: 0.85rem;
  color: var(--star-silver);
}

.scorecard__details {
  flex: 1;
}

.scorecard__commentary {
  font-size: 0.95rem;
  color: var(--star-silver);
  line-height: 1.6;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(65, 90, 119, 0.2);
  font-style: italic;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(65, 90, 119, 0.2);
}

.detail-label {
  color: var(--star-silver);
}

.detail-value {
  font-family: var(--font-display);
  color: var(--lunar-white);
}

.scorecard__breakdown {
  padding-top: 24px;
  border-top: 1px solid rgba(65, 90, 119, 0.3);
}

.breakdown-title {
  font-size: 0.85rem;
  color: var(--star-silver);
  margin-bottom: 4px;
}

.breakdown-hint {
  font-size: 0.75rem;
  color: var(--star-silver);
  opacity: 0.6;
  margin-bottom: 16px;
}

.breakdown-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 6px;
  border: 1px solid;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.question-result:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.question-result--correct {
  background: rgba(0, 255, 200, 0.1);
  border-color: var(--nebula-teal);
}

.question-result--incorrect {
  background: rgba(255, 107, 53, 0.1);
  border-color: var(--plasma-orange);
}

.question-result__number {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--star-silver);
}

.question-result__icon {
  font-size: 1.1rem;
  font-weight: 700;
}

.question-result--correct .question-result__icon {
  color: var(--nebula-teal);
}

.question-result--incorrect .question-result__icon {
  color: var(--plasma-orange);
}

/* Performance Stats */
.performance-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.trend-section {
  padding-top: 24px;
  border-top: 1px solid rgba(65, 90, 119, 0.3);
}

.trend-title {
  font-size: 0.75rem;
  color: var(--star-silver);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 80px;
}

.trend-bar {
  flex: 1;
  min-height: 8px;
  border-radius: 2px 2px 0 0;
  transition: height var(--transition-normal);
}

.trend-bar--excellent {
  background: var(--nebula-teal);
}

.trend-bar--good {
  background: var(--solar-gold);
}

.trend-bar--needs-work {
  background: var(--plasma-orange);
}
</style>
