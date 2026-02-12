<template>
  <div class="quiz-setup">
    <div class="panel-container">
      <!-- Setup Form Panel -->
      <div class="panel panel--wide">
        <div class="panel__header">
          <h2 class="panel__title">Configure Your Suffering</h2>
        </div>
        <div class="panel__body">
          <div class="setup-form">
            <!-- Subject Selection -->
            <div class="form-group">
              <label class="form-label">Subject Area</label>
              <div class="subject-grid">
                <button
                  v-for="subject in subjects"
                  :key="subject.value"
                  class="subject-btn"
                  :class="{
                    'subject-btn--active': selectedSubject === subject.value,
                  }"
                  @click="selectedSubject = subject.value"
                >
                  {{ subject.label }}
                </button>
              </div>
            </div>

            <!-- Question Type -->
            <div class="form-group">
              <label class="form-label">Question Type</label>
              <div class="radio-group">
                <label
                  v-for="type in questionTypes"
                  :key="type.value"
                  class="radio-card"
                  :class="{ 'radio-card--active': selectedType === type.value }"
                >
                  <input
                    v-model="selectedType"
                    type="radio"
                    :value="type.value"
                    class="sr-only"
                  />
                  <span class="radio-card__name">{{ type.name }}</span>
                  <span class="radio-card__desc">{{ type.desc }}</span>
                </label>
              </div>
            </div>

            <!-- Question Count -->
            <div class="form-group">
              <label class="form-label">Questions</label>
              <div class="count-selector">
                <button
                  v-for="count in questionCounts"
                  :key="count"
                  class="count-btn"
                  :class="{
                    'count-btn--active':
                      selectedCount === count && !useCustomCount,
                  }"
                  @click="selectPresetCount(count)"
                >
                  {{ count }}
                </button>
                <div class="custom-count-wrapper">
                  <input
                    v-model.number="customCount"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Custom"
                    class="custom-count-input"
                    :class="{ 'custom-count-input--active': useCustomCount }"
                    @focus="useCustomCount = true"
                    @input="onCustomCountInput"
                  />
                </div>
              </div>
            </div>

            <!-- Mode -->
            <div class="form-group">
              <label class="form-label">Test Mode</label>
              <div class="mode-grid">
                <label
                  v-for="mode in modes"
                  :key="mode.value"
                  class="mode-card"
                  :class="[
                    `mode-card--${mode.value}`,
                    { 'mode-card--active': selectedMode === mode.value },
                  ]"
                >
                  <input
                    v-model="selectedMode"
                    type="radio"
                    :value="mode.value"
                    class="sr-only"
                  />
                  <div class="mode-card__icon" v-html="mode.icon"></div>
                  <span class="mode-card__name">{{ mode.name }}</span>
                  <span class="mode-card__desc">{{ mode.desc }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="panel__footer">
          <button
            class="btn btn--primary"
            @click="startQuiz"
            :disabled="loading"
          >
            {{ loading ? "Loading..." : "Begin Session" }}
          </button>
        </div>
      </div>

      <!-- Round Summary Panel -->
      <div class="panel panel--narrow">
        <div class="panel__header">
          <h2 class="panel__title">Session Summary</h2>
        </div>
        <div class="panel__body">
          <div class="round-summary">
            <div class="summary-item">
              <span class="summary-label">Subject</span>
              <span class="summary-value">{{
                getSubjectLabel(selectedSubject)
              }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Type</span>
              <span class="summary-value">{{
                getTypeLabel(selectedType)
              }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Questions</span>
              <span class="summary-value">{{ selectedCount }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Mode</span>
              <span class="summary-value">{{
                getModeLabel(selectedMode)
              }}</span>
            </div>
            <div class="summary-item summary-item--highlight">
              <span class="summary-label">Est. Time</span>
              <span class="summary-value">{{ selectedCount * 90 }}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuizStore } from "~/stores/quiz";
import { useToastStore } from "~/stores/toast";

const router = useRouter();
const quizStore = useQuizStore();
const toastStore = useToastStore();
const api = useApi();

const loading = ref(false);

const selectedSubject = ref("all");
const selectedType = ref<"mix" | "mbe" | "generated">("mix");
const selectedCount = ref(9);
const selectedMode = ref<
  "classic" | "quizshow" | "baseball" | "golf" | "football"
>("classic");

const subjects = [
  { value: "all", label: "All Subjects" },
  { value: "contracts", label: "Contracts" },
  { value: "torts", label: "Torts" },
  { value: "constitutional", label: "Con Law" },
  { value: "criminal", label: "Criminal" },
  { value: "civil_procedure", label: "Civ Pro" },
  { value: "evidence", label: "Evidence" },
  { value: "property", label: "Property" },
];

const questionTypes = [
  { value: "mix", name: "Mixed", desc: "MBE + AI questions" },
  { value: "mbe", name: "MBE", desc: "Real exam questions" },
  { value: "generated", name: "AI", desc: "Generated questions" },
];

const questionCounts = [9, 18, 33, 50];

// Custom count support
const useCustomCount = ref(false);
const customCount = ref<number | null>(null);

const selectPresetCount = (count: number) => {
  useCustomCount.value = false;
  customCount.value = null;
  selectedCount.value = count;
};

const onCustomCountInput = () => {
  useCustomCount.value = true;
  if (customCount.value && customCount.value >= 1 && customCount.value <= 100) {
    selectedCount.value = customCount.value;
  }
};

const modes = [
  {
    value: "classic",
    name: "Classic",
    desc: "Default glassmorphic interface",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="15" x2="12" y2="15"/></svg>`,
  },
  {
    value: "quizshow",
    name: "Quiz Show",
    desc: "Retro game show vibes",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  },
  {
    value: "baseball",
    name: "Baseball",
    desc: "Stadium scoreboard style",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93c4.08 4.08 4.08 10.06 0 14.14"/><path d="M19.07 4.93c-4.08 4.08-4.08 10.06 0 14.14"/></svg>`,
  },
  {
    value: "golf",
    name: "Golf",
    desc: "Lunar mini-game theme",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 18v-6"/><path d="M12 12l6-4-6-6v10"/><ellipse cx="12" cy="20" rx="4" ry="2"/></svg>`,
  },
  {
    value: "football",
    name: "Football",
    desc: "Overtime review battle",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(45 12 12)"/><path d="M7 7l10 10"/><path d="M9 12h6"/><path d="M12 9v6"/></svg>`,
  },
];

const getSubjectLabel = (value: string) =>
  subjects.find((s) => s.value === value)?.label ?? value;

const getTypeLabel = (value: string) =>
  questionTypes.find((t) => t.value === value)?.name ?? value;

const getModeLabel = (value: string) =>
  modes.find((m) => m.value === value)?.name ?? value;

const startQuiz = async () => {
  loading.value = true;

  try {
    // Get anonymous ID for smart question selection
    const anonymousId =
      localStorage.getItem("monobloc_anonymous_id") || crypto.randomUUID();

    // Ensure we have an anonymous ID stored
    if (!localStorage.getItem("monobloc_anonymous_id")) {
      localStorage.setItem("monobloc_anonymous_id", anonymousId);
    }

    // Use smart question selection to avoid repeats
    const questions = await api.fetchQuestions(
      selectedCount.value,
      selectedSubject.value,
      selectedType.value,
      undefined, // user_id (for logged-in users, future)
      anonymousId,
      true, // smart = true (use smart selection)
    );

    if (!questions || questions.length === 0) {
      toastStore.error("No questions available for this selection");
      return;
    }

    quizStore.updateSettings({
      subject: selectedSubject.value,
      questionType: selectedType.value,
      questionCount: selectedCount.value,
      mode: selectedMode.value,
    });

    quizStore.setQuestions(questions);

    router.push("/quiz/play");
  } catch {
    toastStore.error("Failed to load questions. Check your connection.");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.quiz-setup {
  height: 100%;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--star-silver);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.subject-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.subject-btn {
  padding: 10px 16px;
  font-size: 0.85rem;
  color: var(--star-silver);
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.subject-btn:hover {
  color: var(--lunar-white);
  border-color: var(--star-silver);
}

.subject-btn--active {
  color: var(--nebula-teal);
  background: rgba(0, 71, 255, 0.08);
  border-color: var(--nebula-teal);
}

.radio-group {
  display: flex;
  gap: 12px;
}

.radio-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.radio-card:hover {
  border-color: var(--star-silver);
}

.radio-card--active {
  background: rgba(0, 71, 255, 0.08);
  border-color: var(--nebula-teal);
}

.radio-card__name {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--lunar-white);
}

.radio-card__desc {
  font-size: 0.75rem;
  color: var(--star-silver);
}

.count-selector {
  display: flex;
  gap: 12px;
}

.count-btn {
  width: 64px;
  height: 64px;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--star-silver);
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.count-btn:hover {
  color: var(--lunar-white);
  border-color: var(--star-silver);
}

.count-btn--active {
  color: var(--solar-gold);
  background: rgba(255, 215, 0, 0.1);
  border-color: var(--solar-gold);
}

.custom-count-wrapper {
  display: flex;
  align-items: center;
}

.custom-count-input {
  width: 80px;
  height: 64px;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--star-silver);
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.custom-count-input::placeholder {
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--star-silver);
  opacity: 0.7;
}

.custom-count-input:hover {
  color: var(--lunar-white);
  border-color: var(--star-silver);
}

.custom-count-input:focus {
  outline: none;
  color: var(--lunar-white);
  border-color: var(--nebula-teal);
}

.custom-count-input--active {
  color: var(--solar-gold);
  background: rgba(255, 215, 0, 0.1);
  border-color: var(--solar-gold);
}

/* Hide number input spinners */
.custom-count-input::-webkit-outer-spin-button,
.custom-count-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.custom-count-input[type="number"] {
  -moz-appearance: textfield;
}

/* Mode Grid - 2x2 layout */
.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.mode-card:hover {
  border-color: var(--star-silver);
}

.mode-card--active {
  background: rgba(0, 71, 255, 0.08);
  border-color: var(--nebula-teal);
}

.mode-card__icon {
  width: 32px;
  height: 32px;
  color: var(--star-silver);
  transition: all var(--transition-fast);
}

.mode-card__icon svg {
  width: 100%;
  height: 100%;
}

.mode-card--active .mode-card__icon {
  color: var(--nebula-teal);
}

/* Mode-specific colors on hover/active */
.mode-card--quizshow:hover,
.mode-card--quizshow.mode-card--active {
  background: rgba(255, 196, 0, 0.1);
  border-color: var(--game-gold, #ffc400);
}

.mode-card--quizshow.mode-card--active .mode-card__icon {
  color: var(--game-gold, #ffc400);
}

.mode-card--baseball:hover,
.mode-card--baseball.mode-card--active {
  background: rgba(196, 30, 58, 0.1);
  border-color: var(--diamond-red, #c41e3a);
}

.mode-card--baseball.mode-card--active .mode-card__icon {
  color: var(--diamond-red, #c41e3a);
}

.mode-card--golf:hover,
.mode-card--golf.mode-card--active {
  background: rgba(45, 90, 39, 0.2);
  border-color: var(--golf-green, #2d5a27);
}

.mode-card--golf.mode-card--active .mode-card__icon {
  color: var(--clubhouse-gold, #c9a227);
}

.mode-card__name {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--lunar-white);
}

.mode-card__desc {
  font-size: 0.7rem;
  color: var(--star-silver);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* Round Summary */
.round-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--bevel-dark);
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  font-size: 0.85rem;
  color: var(--star-silver);
}

.summary-value {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--lunar-white);
}

.summary-item--highlight {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 71, 255, 0.15);
}

.summary-item--highlight .summary-value {
  color: var(--nebula-teal);
  font-size: 1rem;
}
</style>
