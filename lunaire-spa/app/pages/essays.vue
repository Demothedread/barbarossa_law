<template>
  <div class="essays-page">
    <div class="panel-container">
      <!-- Essays Overview Panel -->
      <div class="panel panel--wide">
        <div class="panel__header">
          <h2 class="panel__title">Essay Practice</h2>
          <div class="header-filters">
            <select v-model="selectedSubject" class="filter-select">
              <option value="">All Subjects</option>
              <option v-for="s in subjects" :key="s.subject" :value="s.subject">
                {{ s.subject }} ({{ s.count }})
              </option>
            </select>
            <select v-model="selectedYear" class="filter-select">
              <option value="">All Years</option>
              <option
                v-for="y in years"
                :key="`${y.year}-${y.month}`"
                :value="y.year"
              >
                {{ y.year }}
              </option>
            </select>
          </div>
        </div>
        <div class="panel__body">
          <div class="essays-intro">
            <h1 class="essays-intro__title">California Bar Essay Practice</h1>
            <p class="essays-intro__desc">
              Practice with real California Bar Exam essay questions from
              2012-2025. Write your response and receive AI-powered feedback
              with rubric-based scoring.
            </p>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading essay prompts...</p>
          </div>

          <!-- Essay Prompts Grid -->
          <div v-else class="essay-prompts-grid">
            <div
              v-for="prompt in filteredPrompts"
              :key="prompt.id"
              class="essay-prompt-card"
              @click="navigateTo(`/essays/write/${prompt.id}`)"
            >
              <div class="card-header">
                <span class="card-exam">
                  {{ prompt.exam_month }} {{ prompt.exam_year }}
                </span>
                <span class="card-question">Q{{ prompt.question_number }}</span>
              </div>
              <div class="card-body">
                <span v-if="prompt.subject" class="card-subject">
                  {{ prompt.subject }}
                </span>
                <span v-else class="card-subject card-subject--unknown">
                  Mixed/Unknown
                </span>
              </div>
              <div class="card-footer">
                <span class="card-meta">
                  ~{{ Math.round((prompt.prompt_length || 500) / 5) }} words
                </span>
                <span v-if="prompt.has_model_answer" class="card-badge">
                  📚 Model Answer
                </span>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="!loading && filteredPrompts.length === 0"
            class="empty-state"
          >
            <div class="empty-icon">📝</div>
            <h3>No Essays Found</h3>
            <p v-if="selectedSubject || selectedYear">
              Try adjusting your filters or run the extraction script.
            </p>
            <p v-else>
              Run <code>python scripts/extract_cbx_essays.py</code> to populate
              the database.
            </p>
          </div>
        </div>
      </div>

      <!-- Stats Panel -->
      <div class="panel panel--narrow">
        <div class="panel__header">
          <h2 class="panel__title">Your Essay Stats</h2>
        </div>
        <div class="panel__body">
          <div class="essay-stats">
            <div class="stat-card stat-card--featured">
              <div class="stat-card__value">{{ stats.user_essays || 0 }}</div>
              <div class="stat-card__label">Essays Written</div>
            </div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-card__value">
                  {{ stats.avg_score ? Math.round(stats.avg_score) : "—" }}
                </div>
                <div class="stat-card__label">Avg Score</div>
              </div>
              <div class="stat-card">
                <div class="stat-card__value">
                  {{ stats.total_prompts || 0 }}
                </div>
                <div class="stat-card__label">Available</div>
              </div>
            </div>
          </div>

          <!-- Subject Breakdown -->
          <div v-if="subjects.length > 0" class="subject-breakdown">
            <h3 class="section-title">By Subject</h3>
            <div class="subject-list">
              <div
                v-for="s in subjects"
                :key="s.subject"
                class="subject-item"
                @click="selectedSubject = s.subject"
              >
                <span class="subject-name">{{ s.subject }}</span>
                <span class="subject-count">{{ s.count }}</span>
              </div>
            </div>
          </div>

          <!-- Recent Essays -->
          <div v-if="recentEssays.length > 0" class="recent-essays">
            <h3 class="section-title">Recent Essays</h3>
            <div class="recent-list">
              <div
                v-for="essay in recentEssays"
                :key="essay.id"
                class="recent-item"
              >
                <div class="recent-info">
                  <span class="recent-subject">{{
                    essay.subject || "Essay"
                  }}</span>
                  <span class="recent-date">{{
                    formatDate(essay.submitted_at)
                  }}</span>
                </div>
                <div v-if="essay.score" class="recent-score">
                  {{ essay.score }}/{{ essay.max_score || 100 }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useApi();

// State
const loading = ref(true);
const prompts = ref<
  Array<{
    id: number;
    exam_id: string;
    exam_year: number;
    exam_month: string;
    question_number: number;
    subject: string | null;
    prompt_length?: number;
    has_model_answer?: number;
  }>
>([]);

const subjects = ref<Array<{ subject: string; count: number }>>([]);
const years = ref<Array<{ year: number; month: string; count: number }>>([]);
const stats = ref<{
  total_prompts: number;
  user_essays: number;
  avg_score: number | null;
}>({ total_prompts: 0, user_essays: 0, avg_score: null });

const recentEssays = ref<
  Array<{
    id: number;
    subject: string | null;
    submitted_at: string;
    score?: number;
    max_score?: number;
  }>
>([]);

// Filters
const selectedSubject = ref("");
const selectedYear = ref("");

// Computed
const filteredPrompts = computed(() => {
  return prompts.value.filter((p) => {
    if (selectedSubject.value && p.subject !== selectedSubject.value)
      return false;
    if (selectedYear.value && p.exam_year !== Number(selectedYear.value))
      return false;
    return true;
  });
});

// Methods
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Fetch data on mount
onMounted(async () => {
  try {
    // Get anonymous ID
    let anonymousId = localStorage.getItem("anonymous_id");
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("anonymous_id", anonymousId);
    }

    // Fetch all data in parallel
    const [promptsRes, subjectsRes, yearsRes, statsRes, essaysRes] =
      await Promise.all([
        api.fetchEssayPrompts({ limit: 200 }),
        api.fetchEssaySubjects(),
        api.fetchEssayYears(),
        api.fetchEssayStats({ anonymous_id: anonymousId }),
        api.fetchUserEssays({ anonymous_id: anonymousId, limit: 5 }),
      ]);

    prompts.value = promptsRes.prompts;
    subjects.value = subjectsRes;
    years.value = yearsRes;
    stats.value = statsRes;
    recentEssays.value = essaysRes.essays;
  } catch (err) {
    console.error("Failed to load essay data:", err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.essays-page {
  height: 100%;
  overflow: hidden;
}

.essays-intro {
  margin-bottom: 24px;
}

.essays-intro__title {
  font-family: "strenuous", var(--font-display);
  font-size: 2rem;
  font-weight: 200;
  color: var(--solar-gold);
  margin-bottom: 12px;
  letter-spacing: 0.1em;
}

.essays-intro__desc {
  font-size: 1rem;
  color: var(--star-silver);
  max-width: 600px;
  line-height: 1.6;
}

/* Header Filters */
.header-filters {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 6px 12px;
  background: rgba(27, 38, 59, 0.5);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 6px;
  color: var(--lunar-white);
  font-size: 0.85rem;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--nebula-teal);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 16px;
  color: var(--star-silver);
}

.loading-spinner {
  width: 40px;
  height: 40px;
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

/* Essay Prompts Grid */
.essay-prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.essay-prompt-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: rgba(27, 38, 59, 0.4);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.essay-prompt-card:hover {
  background: rgba(0, 255, 200, 0.05);
  border-color: var(--nebula-teal);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-exam {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--nebula-teal);
}

.card-question {
  padding: 2px 8px;
  background: rgba(65, 90, 119, 0.3);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--star-silver);
}

.card-body {
  flex: 1;
  margin-bottom: 12px;
}

.card-subject {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(0, 255, 200, 0.1);
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--nebula-teal);
}

.card-subject--unknown {
  background: rgba(65, 90, 119, 0.3);
  color: var(--star-silver);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--star-silver);
}

.card-badge {
  color: var(--solar-gold);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--star-silver);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: var(--lunar-white);
  margin-bottom: 8px;
}

.empty-state code {
  padding: 2px 6px;
  background: rgba(65, 90, 119, 0.3);
  border-radius: 4px;
  font-size: 0.85rem;
}

/* Stats Panel */
.essay-stats {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

/* Section Title */
.section-title {
  font-size: 0.9rem;
  color: var(--nebula-teal);
  margin-bottom: 12px;
  font-family: var(--font-display);
}

/* Subject Breakdown */
.subject-breakdown {
  margin-bottom: 24px;
}

.subject-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subject-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(27, 38, 59, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.subject-item:hover {
  background: rgba(0, 255, 200, 0.1);
}

.subject-name {
  color: var(--lunar-white);
  font-size: 0.85rem;
}

.subject-count {
  color: var(--star-silver);
  font-size: 0.8rem;
}

/* Recent Essays */
.recent-essays {
  border-top: 1px solid rgba(65, 90, 119, 0.3);
  padding-top: 16px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(27, 38, 59, 0.3);
  border-radius: 6px;
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-subject {
  color: var(--lunar-white);
  font-size: 0.85rem;
}

.recent-date {
  color: var(--star-silver);
  font-size: 0.75rem;
}

.recent-score {
  font-family: var(--font-mono);
  color: var(--nebula-teal);
  font-size: 0.9rem;
}
</style>
