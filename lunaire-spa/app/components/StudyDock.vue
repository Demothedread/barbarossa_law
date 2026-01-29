<template>
  <aside class="study-dock">
    <!-- Quick Stats Section -->
    <div class="study-dock__section">
      <h3 class="study-dock__title">Your Standing</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card__value">{{ stats.totalRounds }}</div>
          <div class="stat-card__label">Rounds</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">{{ stats.avgScore }}%</div>
          <div class="stat-card__label">Average</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="study-dock__section">
      <h3 class="study-dock__title">Quick Tee</h3>
      <div class="quick-actions">
        <button
          v-for="action in quickActions"
          :key="action.subject"
          class="quick-action-btn"
          @click="startQuickQuiz(action)"
        >
          <span class="quick-action-btn__subject">{{ action.label }}</span>
          <span class="quick-action-btn__count">{{ action.count }} Qs</span>
        </button>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="study-dock__section">
      <h3 class="study-dock__title">Recent Rounds</h3>
      <div v-if="recentRounds.length" class="recent-rounds">
        <div v-for="round in recentRounds" :key="round.id" class="recent-round">
          <span class="recent-round__subject">{{ round.subject }}</span>
          <span class="recent-round__score" :class="getScoreClass(round.score)">
            {{ round.score }}%
          </span>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>Your first tee time awaits.</p>
      </div>
    </div>

    <!-- Subject Progress -->
    <div class="study-dock__section">
      <h3 class="study-dock__title">Subject Progress</h3>
      <div class="subject-progress">
        <div
          v-for="subject in subjectProgress"
          :key="subject.name"
          class="subject-progress__item"
        >
          <div class="subject-progress__header">
            <span class="subject-progress__name">{{ subject.name }}</span>
            <span class="subject-progress__pct">{{ subject.progress }}%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-bar__fill"
              :style="{ width: subject.progress + '%' }"
            />
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useQuizStore } from "~/stores/quiz";

const router = useRouter();
const quizStore = useQuizStore();

const stats = computed(() => ({
  totalRounds: quizStore.quizHistory.length,
  avgScore: quizStore.averageScore,
}));

const quickActions = ref([
  { subject: "all", label: "All Subjects", count: 200 },
  { subject: "contracts", label: "Contracts", count: 45 },
  { subject: "torts", label: "Torts", count: 38 },
  { subject: "constitutional", label: "Con Law", count: 42 },
]);

const recentRounds = computed(() => quizStore.quizHistory.slice(0, 5));

const subjectProgress = ref([
  { name: "Contracts", progress: 65 },
  { name: "Torts", progress: 45 },
  { name: "Con Law", progress: 30 },
  { name: "Civ Pro", progress: 20 },
]);

const startQuickQuiz = (action: { subject: string }) => {
  router.push({
    path: "/quiz/play",
    query: { subject: action.subject, n: "9", type: "mix" },
  });
};

const getScoreClass = (score: number) => {
  if (score >= 80) return "score--excellent";
  if (score >= 65) return "score--good";
  return "score--needs-work";
};
</script>

<style scoped>
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(27, 38, 59, 0.4);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 6px;
  color: var(--lunar-white);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-action-btn:hover {
  background: rgba(0, 255, 200, 0.1);
  border-color: var(--nebula-teal);
}

.quick-action-btn__subject {
  font-size: 0.85rem;
}

.quick-action-btn__count {
  font-size: 0.7rem;
  color: var(--star-silver);
}

.recent-rounds {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-round {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(27, 38, 59, 0.3);
  border-radius: 4px;
  font-size: 0.85rem;
}

.recent-round__subject {
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

.subject-progress {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subject-progress__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subject-progress__header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

.subject-progress__name {
  color: var(--star-silver);
}

.subject-progress__pct {
  color: var(--nebula-teal);
}

.empty-state {
  padding: 16px;
  text-align: center;
  color: var(--star-silver);
  font-size: 0.85rem;
}
</style>
