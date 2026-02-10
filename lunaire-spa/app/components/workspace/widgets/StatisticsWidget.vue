<template>
  <div class="statistics-widget">
    <div class="stats-header">
      <select v-model="selectedSubject" class="subject-select">
        <option value="all">All Subjects</option>
        <option v-for="subject in subjects" :key="subject" :value="subject">
          {{ subject }}
        </option>
      </select>
      <select v-model="timeRange" class="time-select">
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="all">All Time</option>
      </select>
    </div>

    <div class="stats-grid">
      <div class="stat-card stat-card--primary">
        <div class="stat-value">{{ stats.totalQuestions }}</div>
        <div class="stat-label">Questions Attempted</div>
      </div>
      <div class="stat-card stat-card--success">
        <div class="stat-value">{{ stats.accuracy }}%</div>
        <div class="stat-label">Accuracy</div>
      </div>
      <div class="stat-card stat-card--info">
        <div class="stat-value">{{ stats.streak }}</div>
        <div class="stat-label">Current Streak</div>
      </div>
      <div class="stat-card stat-card--warning">
        <div class="stat-value">{{ formatTime(stats.studyTime) }}</div>
        <div class="stat-label">Study Time</div>
      </div>
    </div>

    <div class="subject-breakdown">
      <h4 class="section-title">Subject Performance</h4>
      <div class="subject-bars">
        <div
          v-for="subject in subjectStats"
          :key="subject.name"
          class="subject-bar"
        >
          <div class="subject-info">
            <span class="subject-name">{{ subject.name }}</span>
            <span class="subject-score">{{ subject.accuracy }}%</span>
          </div>
          <div class="bar-container">
            <div
              class="bar-fill"
              :style="{ width: `${subject.accuracy}%` }"
              :class="getBarClass(subject.accuracy)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="recent-activity">
      <h4 class="section-title">Recent Activity</h4>
      <div class="activity-list">
        <div
          v-for="activity in recentActivities"
          :key="activity.id"
          class="activity-item"
        >
          <span class="activity-icon">{{
            activity.correct ? "✅" : "❌"
          }}</span>
          <span class="activity-subject">{{ activity.subject }}</span>
          <span class="activity-time">{{ activity.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SubjectStat {
  name: string;
  accuracy: number;
  total: number;
  correct: number;
}

interface Activity {
  id: string;
  subject: string;
  correct: boolean;
  time: string;
}

const selectedSubject = ref("all");
const timeRange = ref("week");

const subjects = [
  "Constitutional Law",
  "Contracts",
  "Criminal Law",
  "Evidence",
  "Property",
  "Torts",
  "Civil Procedure",
];

// Sample stats (would come from API/store in production)
const stats = computed(() => ({
  totalQuestions: 156,
  accuracy: 72,
  streak: 5,
  studyTime: 12600, // seconds
}));

const subjectStats = computed<SubjectStat[]>(() => [
  { name: "Contracts", accuracy: 82, total: 45, correct: 37 },
  { name: "Torts", accuracy: 78, total: 38, correct: 30 },
  { name: "Property", accuracy: 65, total: 28, correct: 18 },
  { name: "Criminal Law", accuracy: 71, total: 22, correct: 16 },
  { name: "Evidence", accuracy: 58, total: 15, correct: 9 },
  { name: "Civil Procedure", accuracy: 68, total: 8, correct: 5 },
]);

const recentActivities = computed<Activity[]>(() => [
  { id: "1", subject: "Contracts", correct: true, time: "2m ago" },
  { id: "2", subject: "Torts", correct: true, time: "5m ago" },
  { id: "3", subject: "Property", correct: false, time: "8m ago" },
  { id: "4", subject: "Contracts", correct: true, time: "12m ago" },
  { id: "5", subject: "Criminal Law", correct: true, time: "15m ago" },
]);

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const getBarClass = (accuracy: number): string => {
  if (accuracy >= 75) return "bar-fill--success";
  if (accuracy >= 60) return "bar-fill--warning";
  return "bar-fill--danger";
};
</script>

<style scoped>
.statistics-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  overflow-y: auto;
}

.stats-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.subject-select,
.time-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.8);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  padding: 16px;
  border-radius: 12px;
  text-align: center;
}

.stat-card--primary {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.stat-card--success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.stat-card--info {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.stat-card--warning {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
}

.subject-breakdown {
  margin-bottom: 20px;
}

.subject-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.subject-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subject-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.subject-name {
  color: rgba(255, 255, 255, 0.8);
}

.subject-score {
  color: rgba(255, 255, 255, 0.6);
}

.bar-container {
  height: 6px;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.bar-fill--success {
  background: linear-gradient(90deg, #22c55e, #10b981);
}

.bar-fill--warning {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.bar-fill--danger {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.recent-activity {
  flex: 1;
  min-height: 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(100, 116, 139, 0.1);
  border-radius: 8px;
  font-size: 0.85rem;
}

.activity-icon {
  font-size: 1rem;
}

.activity-subject {
  flex: 1;
  color: rgba(255, 255, 255, 0.8);
}

.activity-time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
}
</style>
