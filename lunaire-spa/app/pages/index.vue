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

const startQuickRound = (type: string) => {
  router.push({
    path: "/quiz/play",
    query: { subject: "all", n: "9", type },
  });
};
</script>

<style scoped>
.clubhouse {
  height: 100%;
  overflow: hidden;
}

.clubhouse-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: 40px;
}

.clubhouse-hero__content {
  flex: 1;
}

.clubhouse-hero__title {
  font-family: "strenuous", var(--font-display);
  font-size: 2.8rem;
  font-weight: 200;
  color: var(--solar-gold);
  margin-bottom: 8px;
  letter-spacing: 0.15em;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
}

.clubhouse-hero__tagline {
  font-family: "good-times", var(--font-display);
  font-size: 0.85rem;
  font-weight: 300;
  color: var(--star-silver);
  letter-spacing: 0.25em;
  text-transform: uppercase;
  margin-bottom: 20px;
}

.clubhouse-hero__desc {
  font-family: var(--font-legal);
  font-size: 1.1rem;
  color: var(--lunar-white);
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
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(65, 90, 119, 0.6) 0%,
    rgba(13, 27, 42, 0.8) 100%
  );
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow:
    0 0 40px rgba(255, 215, 0, 0.1),
    inset 0 0 20px rgba(0, 0, 0, 0.3);
}

.moon-badge__text {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--solar-gold);
}

.moon-badge__location {
  font-size: 0.65rem;
  color: var(--star-silver);
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
  background: linear-gradient(
    135deg,
    rgba(0, 255, 200, 0.1) 0%,
    rgba(0, 255, 200, 0.05) 100%
  );
  border-color: var(--nebula-teal);
}

.stat-card--featured .stat-card__value {
  font-size: 3rem;
}

/* Modal */
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

.modal__body p {
  color: var(--star-silver);
  margin-bottom: 20px;
}

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
  background: rgba(27, 38, 59, 0.4);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-option:hover {
  background: rgba(0, 255, 200, 0.1);
  border-color: var(--nebula-teal);
}

.quick-option__name {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--lunar-white);
}

.quick-option__desc {
  font-size: 0.8rem;
  color: var(--star-silver);
}

/* Beach Boys Button */
.beach-boys-btn {
  margin-left: 8px;
  vertical-align: middle;
  font-size: 0.85rem;
}
</style>
