<template>
  <div class="question-generator">
    <!-- Header -->
    <div class="generator-header">
      <div class="header-icon">🤖</div>
      <div class="header-content">
        <h2>AI Question Generator</h2>
        <p>
          Generate MBE-caliber questions using dual vector stores with
          intelligent fallback
        </p>
      </div>
    </div>

    <!-- Stats Dashboard -->
    <div v-if="stats" class="stats-dashboard">
      <div class="stat-card">
        <span class="stat-value">{{ stats.total_generated }}</span>
        <span class="stat-label">Total Generated</span>
      </div>
      <div class="stat-card stat-model">
        <span class="stat-value">{{ stats.model_questions }}</span>
        <span class="stat-label">Model Questions</span>
      </div>
      <div class="stat-card stat-pending">
        <span class="stat-value">{{ stats.pending_review }}</span>
        <span class="stat-label">Pending Review</span>
      </div>
      <div class="stat-card stat-rejected">
        <span class="stat-value">{{ stats.rejected }}</span>
        <span class="stat-label">Rejected</span>
      </div>
    </div>

    <!-- Generation Form -->
    <div class="generation-form">
      <div class="form-row">
        <div class="form-group">
          <label for="subject">Subject *</label>
          <select id="subject" v-model="selectedSubject" @change="loadSubtopics">
            <option value="">Select a subject...</option>
            <option v-for="subject in subjects" :key="subject" :value="subject">
              {{ subject }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="subtopic">
            Subtopic
            <span class="label-hint">(optional - uses MBE distribution if blank)</span>
          </label>
          <select id="subtopic" v-model="selectedSubtopic" :disabled="!selectedSubject">
            <option value="">Use probability weighting...</option>
            <option
              v-for="(weight, subtopic) in subtopicWeights"
              :key="subtopic"
              :value="subtopic"
            >
              {{ subtopic }} ({{ (weight * 100).toFixed(0) }}%)
            </option>
          </select>
        </div>

        <div class="form-group form-group-small">
          <label for="count">Count</label>
          <input
            id="count"
            v-model.number="questionCount"
            type="number"
            min="1"
            max="20"
          />
        </div>
      </div>

      <button
        class="generate-btn"
        :disabled="!selectedSubject || isGenerating"
        @click="generateQuestions"
      >
        <span v-if="isGenerating" class="spinner"></span>
        <span v-else>⚡</span>
        {{ isGenerating ? "Generating..." : "Generate Questions" }}
      </button>
    </div>

    <!-- Generation Progress -->
    <div v-if="isGenerating" class="generation-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <p class="progress-text">{{ progressText }}</p>
    </div>

    <!-- Results -->
    <div v-if="lastResult" class="generation-results">
      <div class="results-header">
        <h3>Generation Complete</h3>
        <span class="batch-id">Batch: {{ lastResult.batch_id }}</span>
      </div>

      <div class="results-summary">
        <div class="summary-item">
          <span class="summary-value">{{ lastResult.generated }}</span>
          <span class="summary-label">Generated</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ lastResult.saved }}</span>
          <span class="summary-label">Saved</span>
        </div>
        <div class="summary-item">
          <span
            class="summary-badge"
            :class="lastResult.fallback_used ? 'badge-fallback' : 'badge-primary'"
          >
            {{ lastResult.source }}
          </span>
          <span class="summary-label">Source</span>
        </div>
      </div>

      <!-- Generated Questions Preview -->
      <div v-if="lastResult.questions?.length" class="questions-preview">
        <h4>Generated Questions</h4>
        <div
          v-for="(q, idx) in lastResult.questions"
          :key="idx"
          class="question-card"
        >
          <div class="question-header">
            <span class="question-number">#{{ idx + 1 }}</span>
            <span class="question-subject">{{ q.subject }}</span>
            <span v-if="q.subtopic" class="question-subtopic">{{ q.subtopic }}</span>
          </div>
          <p class="question-text">{{ truncateText(q.question, 200) }}</p>
          <div class="question-choices">
            <div
              v-for="choice in ['A', 'B', 'C', 'D']"
              :key="choice"
              class="choice"
              :class="{ 'choice-correct': q.answer === choice }"
            >
              <span class="choice-letter">{{ choice }}</span>
              <span class="choice-text">
                {{ truncateText(q[`choice_${choice.toLowerCase()}`], 80) }}
              </span>
            </div>
          </div>
          <div class="question-source">
            <span class="source-badge">{{ q.generation_source || "generated" }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Batches -->
    <div v-if="stats?.recent_batches?.length" class="recent-batches">
      <h3>Recent Generation Batches</h3>
      <div class="batches-list">
        <div
          v-for="batch in stats.recent_batches"
          :key="batch.batch_id"
          class="batch-item"
        >
          <div class="batch-info">
            <span class="batch-subject">{{ batch.subject }}</span>
            <span v-if="batch.subtopic" class="batch-subtopic">
              → {{ batch.subtopic }}
            </span>
          </div>
          <div class="batch-stats">
            <span>{{ batch.generated }}/{{ batch.requested }}</span>
            <span
              class="batch-source"
              :class="batch.fallback_used ? 'source-fallback' : 'source-primary'"
            >
              {{ batch.source }}
            </span>
          </div>
          <span class="batch-time">{{ formatTime(batch.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const api = useApi();

// Form state
const subjects = ref<string[]>([]);
const selectedSubject = ref("");
const selectedSubtopic = ref("");
const subtopicWeights = ref<Record<string, number>>({});
const questionCount = ref(5);

// Generation state
const isGenerating = ref(false);
const progressPercent = ref(0);
const progressText = ref("");
const lastResult = ref<any>(null);

// Stats
const stats = ref<any>(null);

// Load subjects on mount
onMounted(async () => {
  await loadSubjects();
  await loadStats();
});

async function loadSubjects() {
  try {
    subjects.value = await api.fetchSubjects();
  } catch {
    // Failed to load subjects
  }
}

async function loadStats() {
  try {
    stats.value = await api.getGenerationStats();
  } catch {
    // Failed to load stats
  }
}

async function loadSubtopics() {
  selectedSubtopic.value = "";
  subtopicWeights.value = {};

  if (!selectedSubject.value) return;

  try {
    const result = await api.getSubtopicWeights(selectedSubject.value);
    subtopicWeights.value = result.weights;
  } catch {
    // Failed to load subtopic weights
  }
}

async function generateQuestions() {
  if (!selectedSubject.value || isGenerating.value) return;

  isGenerating.value = true;
  progressPercent.value = 0;
  progressText.value = "Initializing generation...";
  lastResult.value = null;

  // Simulate progress updates
  const progressInterval = setInterval(() => {
    if (progressPercent.value < 90) {
      progressPercent.value += Math.random() * 10;
      const messages = [
        "Searching MBE vector store...",
        "Extracting questions...",
        "Checking for duplicates...",
        "Validating question quality...",
        "Applying fallback if needed...",
        "Saving to database...",
      ];
      progressText.value = messages[Math.floor(Math.random() * messages.length)] ?? "Processing...";
    }
  }, 1500);

  try {
    const result = await api.generateMBEQuestions(selectedSubject.value, {
      subtopic: selectedSubtopic.value || undefined,
      count: questionCount.value,
    });

    progressPercent.value = 100;
    progressText.value = "Complete!";
    lastResult.value = result;

    // Refresh stats
    await loadStats();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    progressText.value = `Error: ${message}`;
  } finally {
    clearInterval(progressInterval);
    setTimeout(() => {
      isGenerating.value = false;
    }, 1000);
  }
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
</script>

<style scoped>
.question-generator {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.generator-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.header-icon {
  font-size: 3rem;
}

.header-content h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-content p {
  color: #6b7280;
  margin: 0.25rem 0 0;
}

/* Stats Dashboard */
.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #f9fafb;
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
}

.stat-card.stat-model {
  background: #ecfdf5;
}

.stat-card.stat-pending {
  background: #fef3c7;
}

.stat-card.stat-rejected {
  background: #fef2f2;
}

.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Generation Form */
.generation-form {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  flex: 1;
}

.form-group-small {
  flex: 0 0 100px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.label-hint {
  font-weight: 400;
  font-size: 0.75rem;
  color: #9ca3af;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: #fff;
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Progress */
.generation-progress {
  margin-bottom: 2rem;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #6b7280;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

/* Results */
.generation-results {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.results-header h3 {
  margin: 0;
  color: #166534;
}

.batch-id {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: monospace;
}

.results-summary {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #166534;
}

.summary-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.summary-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-primary {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-fallback {
  background: #fef3c7;
  color: #b45309;
}

/* Questions Preview */
.questions-preview h4 {
  margin: 0 0 1rem;
  color: #374151;
}

.question-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.question-number {
  font-weight: 700;
  color: #6366f1;
}

.question-subject {
  background: #e5e7eb;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.question-subtopic {
  background: #dbeafe;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #1d4ed8;
}

.question-text {
  color: #374151;
  margin: 0.5rem 0;
  line-height: 1.5;
}

.question-choices {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.choice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.choice-correct {
  background: #dcfce7;
  border: 1px solid #86efac;
}

.choice-letter {
  font-weight: 700;
  color: #6366f1;
}

.choice-text {
  color: #4b5563;
}

.question-source {
  margin-top: 0.75rem;
  text-align: right;
}

.source-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.5rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
  color: #6b7280;
}

/* Recent Batches */
.recent-batches {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.recent-batches h3 {
  margin: 0 0 1rem;
  color: #374151;
}

.batch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.batch-item:last-child {
  border-bottom: none;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.batch-subject {
  font-weight: 600;
  color: #374151;
}

.batch-subtopic {
  color: #6b7280;
  font-size: 0.875rem;
}

.batch-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.batch-source {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

.source-primary {
  background: #dbeafe;
  color: #1d4ed8;
}

.source-fallback {
  background: #fef3c7;
  color: #b45309;
}

.batch-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-dashboard {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row {
    flex-direction: column;
  }

  .form-group-small {
    flex: 1;
  }

  .results-summary {
    justify-content: center;
  }

  .question-choices {
    grid-template-columns: 1fr;
  }
}
</style>
</template>
