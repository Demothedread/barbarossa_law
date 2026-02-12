<template>
  <div class="statistics-view">
    <div class="panel-container">
      <!-- Daily Progress Panel -->
      <div class="panel">
        <div class="panel__header">
          <h2 class="panel__title">Today's Progress</h2>
        </div>
        <div class="panel__body">
          <DailyTracker />
        </div>
      </div>

      <!-- Overview Panel -->
      <div class="panel">
        <div class="panel__header">
          <h2 class="panel__title">Your Suffering in Numbers</h2>
        </div>
        <div class="panel__body">
          <div class="stats-grid stats-grid--large">
            <div class="stat-card stat-card--featured">
              <div class="stat-card__value">{{ totalSessions }}</div>
              <div class="stat-card__label">Total Sessions</div>
            </div>
            <div class="stat-card stat-card--featured">
              <div class="stat-card__value">{{ totalQuestions }}</div>
              <div class="stat-card__label">Questions Answered</div>
            </div>
            <div class="stat-card stat-card--featured">
              <div class="stat-card__value">{{ averageScore }}%</div>
              <div class="stat-card__label">Average Score</div>
            </div>
            <div class="stat-card stat-card--featured">
              <div class="stat-card__value">{{ bestScore }}%</div>
              <div class="stat-card__label">Best Session</div>
            </div>
          </div>
          <p class="stats-commentary">{{ overallCommentary }}</p>
        </div>
      </div>

      <!-- Subject Breakdown Panel -->
      <div class="panel">
        <div class="panel__header">
          <h2 class="panel__title">Performance by Subject</h2>
        </div>
        <div class="panel__body">
          <div class="subject-stats">
            <div
              v-for="subject in subjectStats"
              :key="subject.name"
              class="subject-stat"
            >
              <div class="subject-stat__header">
                <span class="subject-stat__name">{{ subject.name }}</span>
                <span
                  class="subject-stat__score"
                  :class="getScoreClass(subject.avgScore)"
                >
                  {{ subject.avgScore }}%
                </span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-bar__fill"
                  :style="{ width: subject.avgScore + '%' }"
                />
              </div>
              <div class="subject-stat__details">
                <span>{{ subject.questions }} questions</span>
                <span>{{ subject.sessions }} sessions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subtopic Breakdown Panel -->
      <div class="panel">
        <div class="panel__header">
          <h2 class="panel__title">Subtopic Deep Dive</h2>
          <span class="panel__subtitle">Your weakest areas need attention</span>
        </div>
        <div class="panel__body">
          <div v-if="weakestSubtopics.length" class="subtopic-stats">
            <div class="subtopic-section">
              <h3 class="subtopic-section__title">🔥 Needs Work</h3>
              <div class="subtopic-list">
                <div
                  v-for="subtopic in weakestSubtopics"
                  :key="subtopic.subtopic"
                  class="subtopic-item subtopic-item--weak"
                >
                  <div class="subtopic-item__info">
                    <span class="subtopic-item__name">{{
                      subtopic.subtopic
                    }}</span>
                    <span class="subtopic-item__subject">{{
                      subtopic.subject
                    }}</span>
                  </div>
                  <div class="subtopic-item__stats">
                    <span
                      class="subtopic-item__accuracy"
                      :class="getScoreClass(subtopic.accuracy)"
                    >
                      {{ subtopic.accuracy }}%
                    </span>
                    <span class="subtopic-item__count"
                      >{{ subtopic.total }} Qs</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <div v-if="strongestSubtopics.length" class="subtopic-section">
              <h3 class="subtopic-section__title">✨ Strengths</h3>
              <div class="subtopic-list">
                <div
                  v-for="subtopic in strongestSubtopics"
                  :key="subtopic.subtopic"
                  class="subtopic-item subtopic-item--strong"
                >
                  <div class="subtopic-item__info">
                    <span class="subtopic-item__name">{{
                      subtopic.subtopic
                    }}</span>
                    <span class="subtopic-item__subject">{{
                      subtopic.subject
                    }}</span>
                  </div>
                  <div class="subtopic-item__stats">
                    <span
                      class="subtopic-item__accuracy"
                      :class="getScoreClass(subtopic.accuracy)"
                    >
                      {{ subtopic.accuracy }}%
                    </span>
                    <span class="subtopic-item__count"
                      >{{ subtopic.total }} Qs</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>Review more questions to see subtopic analysis.</p>
          </div>
        </div>
      </div>

      <!-- History Panel -->
      <div class="panel">
        <div class="panel__header">
          <h2 class="panel__title">Recent Sessions</h2>
        </div>
        <div class="panel__body">
          <div v-if="recentHistory.length" class="history-list">
            <div
              v-for="session in recentHistory"
              :key="session.id"
              class="history-item"
            >
              <div class="history-item__date">
                {{ formatDate(session.date) }}
              </div>
              <div class="history-item__subject">
                {{ formatSubject(session.subject) }}
              </div>
              <div
                class="history-item__score"
                :class="getScoreClass(getPercent(session))"
              >
                {{ session.score }}/{{ session.total }}
              </div>
              <div class="history-item__percent">
                {{ getPercent(session) }}%
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>
              No sessions yet. Start practicing — it's free, it's adequate, it's
              at monobloc.com.
            </p>
            <NuxtLink to="/quiz/setup" class="btn btn--primary">
              Start Studying
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDailyTrackerStore } from "~/stores/dailyTracker";
import { useQuizStore } from "~/stores/quiz";

const quizStore = useQuizStore();
const dailyTracker = useDailyTrackerStore();

const totalSessions = computed(() => quizStore.quizHistory.length);

const totalQuestions = computed(() =>
  quizStore.quizHistory.reduce((sum, r) => sum + r.total, 0),
);

const averageScore = computed(() => quizStore.averageScore);

const bestScore = computed(() => {
  if (!quizStore.quizHistory.length) return 0;
  return Math.max(
    ...quizStore.quizHistory.map((r) => Math.round((r.score / r.total) * 100)),
  );
});

// Get weakest and strongest subtopics from daily tracker
const weakestSubtopics = computed(() => {
  return dailyTracker.weakestSubtopics.slice(0, 5);
});

const strongestSubtopics = computed(() => {
  const allSubtopics: Array<{
    subject: string;
    subtopic: string;
    accuracy: number;
    total: number;
  }> = [];

  for (const [subject, data] of Object.entries(
    dailyTracker.subjectPerformance,
  )) {
    if (data.subtopics) {
      for (const [subtopicName, subtopicData] of Object.entries(
        data.subtopics,
      )) {
        if (subtopicData.total >= 3) {
          allSubtopics.push({
            subject,
            subtopic: subtopicName,
            accuracy: subtopicData.accuracy,
            total: subtopicData.total,
          });
        }
      }
    }
  }

  return allSubtopics
    .filter((s) => s.accuracy >= 70)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5);
});

// Satirical commentary based on overall performance
const overallCommentary = computed(() => {
  const avg = averageScore.value;
  const total = totalSessions.value;

  if (total === 0) {
    return "You haven't started yet. The NCBE appreciates your procrastination — it increases their repeat customer rate. Meanwhile, we're over here. Free. Adequate. Waiting.";
  }
  if (avg >= 80) {
    return "Genuinely impressive. Keep this up and you might actually join the legal profession's gatekeeping ranks. Deez' Eazy-Breezy takes no credit for your success, obviously.";
  }
  if (avg >= 65) {
    return "You're hovering in the statistical danger zone where bar examiners love to watch candidates sweat. Unlike those $4,000 courses, we won't sugarcoat it. But at least you're not paying $4,000 to hear that.";
  }
  return "We sincerely believe in you. But the numbers don't yet. Keep going — this site is free and the questions are unlimited. That's our whole selling point.";
});

const subjectStats = computed(() => {
  const subjects = new Map<
    string,
    { scores: number[]; questions: number; sessions: number }
  >();

  quizStore.quizHistory.forEach((session) => {
    const key = session.subject || "all";
    const existing = subjects.get(key) || {
      scores: [],
      questions: 0,
      sessions: 0,
    };
    existing.scores.push((session.score / session.total) * 100);
    existing.questions += session.total;
    existing.sessions++;
    subjects.set(key, existing);
  });

  return Array.from(subjects.entries()).map(([name, data]) => ({
    name: formatSubject(name),
    avgScore: Math.round(
      data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
    ),
    questions: data.questions,
    sessions: data.sessions,
  }));
});

const recentHistory = computed(() => quizStore.quizHistory.slice(0, 10));

const getPercent = (session: { score: number; total: number }) =>
  Math.round((session.score / session.total) * 100);

const getScoreClass = (score: number) => {
  if (score >= 80) return "score--excellent";
  if (score >= 65) return "score--good";
  return "score--needs-work";
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatSubject = (subject: string) => {
  if (subject === "all") return "All Subjects";
  return subject
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};
</script>

<style scoped>
.statistics-view {
  height: 100%;
}

.stats-grid--large {
  grid-template-columns: repeat(4, 1fr);
}

.stat-card--featured {
  padding: 24px;
  background: rgba(0, 71, 255, 0.05);
  border-color: rgba(0, 71, 255, 0.12);
}

.stat-card--featured .stat-card__value {
  font-size: 2rem;
}

.stats-commentary {
  margin-top: 20px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.04);
  border-left: 3px solid var(--nebula-teal);
  border-radius: 0;
  font-size: 0.9rem;
  font-style: italic;
  color: var(--star-silver);
  line-height: 1.6;
}

.subject-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.subject-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subject-stat__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subject-stat__name {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--lunar-white);
}

.subject-stat__score {
  font-family: var(--font-display);
  font-size: 0.9rem;
}

.subject-stat__details {
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--star-silver);
}

.score--excellent {
  color: var(--nebula-teal);
}

.score--good {
  color: var(--solar-gold);
}

.score--needs-work {
  color: var(--plasma-orange);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: grid;
  grid-template-columns: 140px 1fr 80px 60px;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 0;
}

.history-item__date {
  font-size: 0.85rem;
  color: var(--star-silver);
}

.history-item__subject {
  font-size: 0.9rem;
  color: var(--lunar-white);
}

.history-item__score {
  font-family: var(--font-display);
  font-size: 0.85rem;
  text-align: right;
}

.history-item__percent {
  font-family: var(--font-display);
  font-size: 0.9rem;
  text-align: right;
  color: var(--nebula-teal);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px;
  text-align: center;
  color: var(--star-silver);
}

/* Subtopic Stats */
.subtopic-stats {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.subtopic-section__title {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--lunar-white);
  margin-bottom: 12px;
}

.subtopic-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtopic-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 0;
  border-left: 3px solid transparent;
}

.subtopic-item--weak {
  border-left-color: var(--plasma-orange);
}

.subtopic-item--strong {
  border-left-color: var(--nebula-teal);
}

.subtopic-item__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subtopic-item__name {
  font-size: 0.9rem;
  color: var(--lunar-white);
}

.subtopic-item__subject {
  font-size: 0.75rem;
  color: var(--star-silver);
  text-transform: capitalize;
}

.subtopic-item__stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.subtopic-item__accuracy {
  font-family: var(--font-display);
  font-size: 0.9rem;
}

.subtopic-item__count {
  font-size: 0.75rem;
  color: var(--star-silver);
}

.panel__subtitle {
  font-size: 0.8rem;
  color: var(--star-silver);
  margin-left: 12px;
}

@media (max-width: 768px) {
  .stats-grid--large {
    grid-template-columns: repeat(2, 1fr);
  }

  .subtopic-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .subtopic-item__stats {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
