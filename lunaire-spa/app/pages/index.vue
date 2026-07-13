<template>
  <div class="clubhouse">
    <!-- Hero Panel -->
    <div class="panel-container">
      <!-- Welcome Panel -->
      <div class="panel panel--wide">
        <div class="panel__header">
          <h2 class="panel__title">
            {{ copyStore.content.global.tagline.text }}
          </h2>
        </div>
        <div class="panel__body clubhouse-hero">
          <div class="clubhouse-hero__content">
            <h1 class="clubhouse-hero__title">{{ heroCopy.title.text }}</h1>
            <p class="clubhouse-hero__tagline">{{ heroCopy.tagline.text }}</p>
            <p
              v-for="(para, idx) in heroCopy.description"
              :key="idx"
              class="clubhouse-hero__desc"
            >
              {{ para.text }}
            </p>
            <p class="clubhouse-hero__desc">
              <strong>{{ heroCopy.funFact.text }}</strong>
            </p>
            <p class="clubhouse-hero__desc">
              {{ heroCopy.barbaraAnne.text }}
              <button
                class="btn btn--secondary btn--small beach-boys-btn"
                @click="toggleBeachBoys"
              >
                {{ beachBoysButtonText }}
              </button>
            </p>
            <p class="clubhouse-hero__tagline">{{ heroCopy.winning.text }}</p>
            <div class="clubhouse-hero__actions">
              <NuxtLink to="/quiz/setup" class="btn btn--primary">
                {{ heroCopy.ctaPrimary.text }}
              </NuxtLink>
              <button class="btn btn--secondary" @click="showQuickStart = true">
                {{ heroCopy.ctaSecondary.text }}
              </button>
            </div>
          </div>
          <div class="clubhouse-hero__visual">
            <div class="moon-badge">
              <span class="moon-badge__text">monobloc.com</span>
              <span class="moon-badge__location">Free. Adequate. Yours.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Panel -->
      <div class="panel panel--narrow">
        <div class="panel__header">
          <h2 class="panel__title">Your Question Set Metrics</h2>
        </div>
        <div class="panel__body">
          <div class="member-stats">
            <div class="stat-card stat-card--featured">
              <div class="stat-card__value">{{ memberStats.totalRounds }}</div>
              <div class="stat-card__label">Sets Did</div>
            </div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-card__value">{{ memberStats.avgScore }}%</div>
                <div class="stat-card__label">Average Score</div>
              </div>
              <div class="stat-card">
                <div class="stat-card__value">{{ memberStats.bestScore }}%</div>
                <div class="stat-card__label">Best Set</div>
              </div>
              <div class="stat-card">
                <div class="stat-card__value">{{ memberStats.streak }}</div>
                <div class="stat-card__label">DAILY STREAK</div>
              </div>
              <div class="stat-card">
                <div class="stat-card__value">
                  {{ memberStats.correctTotal }}
                </div>
                <div class="stat-card__label">Total Correct</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Start Modal -->
    <Teleport to="body">
      <div
        v-if="showQuickStart"
        class="modal-overlay"
        @click.self="showQuickStart = false"
      >
        <div class="modal">
          <div class="modal__header">
            <h3>Quick Practice Set</h3>
            <button class="modal__close" @click="showQuickStart = false">
              ×
            </button>
          </div>
          <div class="modal__body">
            <p>
              Just pick some questions from some topic areas and start trying
              already. no need to futz around with settings.
            </p>
            <div class="quick-options">
              <button
                v-for="option in quickOptions"
                :key="option.type"
                class="quick-option"
                @click="startQuickRound(option.type)"
              >
                <span class="quick-option__name">{{ option.name }}</span>
                <span class="quick-option__desc">{{ option.desc }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useBeachBoysTheme } from "~/composables/useBeachBoysTheme";
import { useCopyStore } from "~/stores/copy";
import { useQuizStore } from "~/stores/quiz";

const router = useRouter();
const quizStore = useQuizStore();
const beachBoysTheme = useBeachBoysTheme();
const copyStore = useCopyStore();
const api = useApi();

// Get copy from store
const heroCopy = computed(() => copyStore.content.home.hero);

const showQuickStart = ref(false);

const toggleBeachBoys = () => {
  beachBoysTheme.toggle();
};

// Beach boys button text from copy store
const beachBoysButtonText = computed(() =>
  beachBoysTheme.isActive.value
    ? heroCopy.value.beachBoysButtonActive.text
    : heroCopy.value.beachBoysButton.text,
);

const memberStats = computed(() => {
  const history = quizStore.quizHistory;
  const scores = history.map((h) => (h.score / h.total) * 100);

  return {
    totalRounds: history.length,
    avgScore: scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0,
    bestScore: scores.length ? Math.round(Math.max(...scores)) : 0,
    streak: 0, // TODO: Calculate streak
    correctTotal: history.reduce(
      (sum, h) => sum + h.answers.filter((a) => a.correct).length,
      0,
    ),
  };
});

const quickOptions = [
  { type: "mix", name: "Mixed", desc: "The full no-frills experience" },
  {
    type: "mbe",
    name: "MBE Only",
    desc: "The questions they don't want you to have",
  },
  {
    type: "generated",
    name: "AI Generated",
    desc: "Infinite practice, zero licensing fees",
  },
];

const startQuickRound = async (type: string) => {
  showQuickStart.value = false;

  try {
    const anonymousId =
      localStorage.getItem("monobloc_anonymous_id") || crypto.randomUUID();
    localStorage.setItem("monobloc_anonymous_id", anonymousId);

    const questions = await api.fetchQuestions(
      9,
      "all",
      type,
      undefined,
      anonymousId,
      true,
    );

    if (!questions.length) {
      throw new Error("No questions available");
    }

    quizStore.updateSettings({
      subject: "all",
      questionType: type as "mix" | "mbe" | "generated",
      questionCount: questions.length,
      mode: "classic",
    });
    quizStore.setQuestions(questions);
    router.push("/quiz/play");
  } catch {
    // Return to the setup page so the user can retry with different options.
    router.push("/quiz/setup");
  }
};
</script>

<style scoped>
.clubhouse {
  min-height: 100%;
  overflow-y: auto;
}

.clubhouse-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 400px;
  gap: 40px;
}

.clubhouse-hero__content {
  flex: 1;
}

.clubhouse-hero__title {
  font-family: "strenuous", var(--font-display);
  font-size: 2.8rem;
  font-weight: 200;
  color: var(--accent-blue);
  margin-bottom: 8px;
  letter-spacing: 0.15em;
}

.clubhouse-hero__tagline {
  font-family: "good-times", var(--font-display);
  font-size: 0.85rem;
  font-weight: 300;
  color: var(--ink-soft);
  letter-spacing: 0.25em;
  text-transform: uppercase;
  margin-bottom: 20px;
}

.clubhouse-hero__desc {
  font-family: var(--font-legal);
  font-size: 1.1rem;
  color: var(--ink);
  max-width: 420px;
  margin-bottom: 32px;
  line-height: 1.7;
}

.clubhouse-hero__actions {
  display: flex;
  gap: 16px;
}

.clubhouse-hero__visual {
  flex-shrink: 0;
}

.moon-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
  background: var(--frame);
  border: 3px solid var(--accent-yellow);
  box-shadow: var(--shadow-lg);
}

.moon-badge__text {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--accent-yellow);
}

.moon-badge__location {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 4px;
}

.member-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card--featured {
  padding: 24px;
  background: rgba(0, 71, 255, 0.06);
  border-color: var(--accent-blue);
}

.stat-card--featured .stat-card__value {
  font-size: 3rem;
}

/* Quick Start Options */
.quick-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: var(--paper);
  border: 2px solid;
  border-color: var(--bevel-light) var(--bevel-dark) var(--bevel-dark)
    var(--bevel-light);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-option:hover {
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
  border-color: var(--accent-blue);
}

.quick-option:active {
  transform: translateY(1px);
  border-color: var(--bevel-dark) var(--bevel-light) var(--bevel-light)
    var(--bevel-dark);
}

.quick-option__name {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quick-option__desc {
  font-size: 0.8rem;
  color: var(--ink-soft);
}

/* Beach Boys Button */
.beach-boys-btn {
  margin-left: 8px;
  vertical-align: middle;
  font-size: 0.85rem;
}
</style>
