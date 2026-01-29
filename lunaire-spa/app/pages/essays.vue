<template>
  <div class="essays-page">
    <div class="panel-container">
      <!-- Essays Overview Panel -->
      <div class="panel panel--wide">
        <div class="panel__header">
          <h2 class="panel__title">Essay Practice</h2>
        </div>
        <div class="panel__body">
          <div class="essays-intro">
            <h1 class="essays-intro__title">Master the Written Portion</h1>
            <p class="essays-intro__desc">
              The MEE (Multistate Essay Examination) tests your ability to
              communicate legal analysis in writing. Practice makes perfect — or
              at least passable.
            </p>
          </div>

          <!-- Essay Categories -->
          <div class="essay-categories">
            <div
              v-for="category in essayCategories"
              :key="category.subject"
              class="essay-category"
              @click="selectCategory(category.subject)"
            >
              <div class="essay-category__icon">{{ category.icon }}</div>
              <div class="essay-category__content">
                <h3 class="essay-category__title">{{ category.subject }}</h3>
                <p class="essay-category__count">
                  {{ category.count }} essays available
                </p>
                <div class="essay-category__progress">
                  <div
                    class="essay-category__progress-bar"
                    :style="{ width: `${category.progress}%` }"
                  ></div>
                </div>
                <span class="essay-category__progress-text"
                  >{{ category.progress }}% completed</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Essays Panel -->
      <div class="panel panel--narrow">
        <div class="panel__header">
          <h2 class="panel__title">Your Essay Stats</h2>
        </div>
        <div class="panel__body">
          <div class="essay-stats">
            <div class="stat-card stat-card--featured">
              <div class="stat-card__value">{{ essayStats.completed }}</div>
              <div class="stat-card__label">Essays Completed</div>
            </div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-card__value">{{ essayStats.avgScore }}</div>
                <div class="stat-card__label">Avg Score</div>
              </div>
              <div class="stat-card">
                <div class="stat-card__value">{{ essayStats.bestSubject }}</div>
                <div class="stat-card__label">Best Subject</div>
              </div>
            </div>
          </div>

          <div class="coming-soon">
            <div class="coming-soon__icon">📝</div>
            <h3 class="coming-soon__title">More Essays Coming Soon</h3>
            <p class="coming-soon__desc">
              Essay content is being prepared. Check back soon for practice
              prompts and AI-powered grading.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Essay Selection Modal -->
    <Teleport to="body">
      <div
        v-if="selectedCategory"
        class="modal-overlay"
        @click.self="selectedCategory = null"
      >
        <div class="modal">
          <div class="modal__header">
            <h3>{{ selectedCategory }} Essays</h3>
            <button class="modal__close" @click="selectedCategory = null">
              ×
            </button>
          </div>
          <div class="modal__body">
            <p class="modal__placeholder">
              Essay prompts for {{ selectedCategory }} will be available soon.
              This section will include:
            </p>
            <ul class="feature-list">
              <li>Timed essay practice</li>
              <li>Model answers for comparison</li>
              <li>AI-powered grading and feedback</li>
              <li>Issue spotting hints</li>
              <li>IRAC structure guidance</li>
            </ul>
            <button class="btn btn--primary btn--disabled" disabled>
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const selectedCategory = ref<string | null>(null);

const essayCategories = [
  { subject: "Constitutional Law", icon: "⚖️", count: 0, progress: 0 },
  { subject: "Contracts", icon: "📜", count: 0, progress: 0 },
  { subject: "Criminal Law", icon: "🔒", count: 0, progress: 0 },
  { subject: "Evidence", icon: "🔍", count: 0, progress: 0 },
  { subject: "Real Property", icon: "🏠", count: 0, progress: 0 },
  { subject: "Torts", icon: "⚠️", count: 0, progress: 0 },
  { subject: "Civil Procedure", icon: "📋", count: 0, progress: 0 },
  { subject: "Family Law", icon: "👨‍👩‍👧", count: 0, progress: 0 },
  { subject: "Trusts & Estates", icon: "📦", count: 0, progress: 0 },
];

const essayStats = computed(() => ({
  completed: 0,
  avgScore: "—",
  bestSubject: "—",
}));

const selectCategory = (subject: string) => {
  selectedCategory.value = subject;
};
</script>

<style scoped>
.essays-page {
  height: 100%;
  overflow: hidden;
}

.essays-intro {
  margin-bottom: 32px;
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

/* Essay Categories Grid */
.essay-categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.essay-category {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(27, 38, 59, 0.4);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.essay-category:hover {
  background: rgba(0, 255, 200, 0.05);
  border-color: var(--nebula-teal);
  transform: translateY(-2px);
}

.essay-category__icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.essay-category__content {
  flex: 1;
}

.essay-category__title {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--lunar-white);
  margin-bottom: 4px;
}

.essay-category__count {
  font-size: 0.8rem;
  color: var(--star-silver);
  margin-bottom: 12px;
}

.essay-category__progress {
  height: 4px;
  background: rgba(65, 90, 119, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.essay-category__progress-bar {
  height: 100%;
  background: var(--nebula-teal);
  transition: width 0.3s ease;
}

.essay-category__progress-text {
  font-size: 0.7rem;
  color: var(--star-silver);
}

/* Essay Stats */
.essay-stats {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

/* Coming Soon */
.coming-soon {
  text-align: center;
  padding: 32px 20px;
  background: rgba(27, 38, 59, 0.3);
  border-radius: 12px;
  border: 1px dashed rgba(65, 90, 119, 0.3);
}

.coming-soon__icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.coming-soon__title {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--nebula-teal);
  margin-bottom: 8px;
}

.coming-soon__desc {
  font-size: 0.85rem;
  color: var(--star-silver);
  line-height: 1.5;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 480px;
  background: var(--space-navy);
  border: 1px solid rgba(65, 90, 119, 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(27, 38, 59, 0.5);
  border-bottom: 1px solid rgba(65, 90, 119, 0.3);
}

.modal__header h3 {
  font-size: 1rem;
  color: var(--nebula-teal);
}

.modal__close {
  background: none;
  border: none;
  color: var(--star-silver);
  font-size: 1.5rem;
  cursor: pointer;
}

.modal__body {
  padding: 20px;
}

.modal__placeholder {
  color: var(--star-silver);
  margin-bottom: 16px;
  line-height: 1.5;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.feature-list li {
  padding: 8px 0;
  padding-left: 24px;
  position: relative;
  color: var(--lunar-white);
  font-size: 0.9rem;
}

.feature-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: var(--nebula-teal);
}

.btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
