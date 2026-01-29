<template>
  <div class="daily-tracker">
    <div class="tracker-header">
      <h3 class="tracker-title">Daily Goals</h3>
      <span class="tracker-date">{{ formattedDate }}</span>
    </div>

    <div class="goals-container">
      <!-- Questions Answered Goal -->
      <div class="goal-item">
        <div class="goal-info">
          <span class="goal-label">Questions Answered</span>
          <span class="goal-count">
            {{ dailyTracker.questionsAnsweredToday }} /
            {{ dailyTracker.dailyQuestionGoal }}
          </span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill progress-fill--answered"
            :style="{ width: `${dailyTracker.questionGoalProgress}%` }"
          />
        </div>
        <span
          v-if="dailyTracker.questionGoalMet"
          class="goal-badge goal-badge--complete"
        >
          ✓ Goal Met!
        </span>
      </div>

      <!-- Questions Reviewed Goal -->
      <div class="goal-item">
        <div class="goal-info">
          <span class="goal-label">Questions Reviewed</span>
          <span class="goal-count">
            {{ dailyTracker.questionsReviewedToday }} /
            {{ dailyTracker.dailyReviewGoal }}
          </span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill progress-fill--reviewed"
            :style="{ width: `${dailyTracker.reviewGoalProgress}%` }"
          />
        </div>
        <span
          v-if="dailyTracker.reviewGoalMet"
          class="goal-badge goal-badge--complete"
        >
          ✓ Goal Met!
        </span>
      </div>
    </div>

    <!-- Streak Display -->
    <div v-if="dailyTracker.currentStreak > 0" class="streak-display">
      <span class="streak-icon">🔥</span>
      <span class="streak-count"
        >{{ dailyTracker.currentStreak }} day streak!</span
      >
    </div>

    <!-- Motivation Message -->
    <p class="tracker-motivation">{{ motivationMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { useDailyTrackerStore } from "~/stores/dailyTracker";

const dailyTracker = useDailyTrackerStore();

const formattedDate = computed(() => {
  const today = new Date();
  return today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
});

const motivationMessage = computed(() => {
  const answered = dailyTracker.questionsAnsweredToday;
  const reviewed = dailyTracker.questionsReviewedToday;
  const questionGoal = dailyTracker.dailyQuestionGoal;
  const reviewGoal = dailyTracker.dailyReviewGoal;

  if (dailyTracker.questionGoalMet && dailyTracker.reviewGoalMet) {
    return "🎉 Amazing! You crushed both goals today!";
  }

  if (dailyTracker.questionGoalMet) {
    const reviewsLeft = reviewGoal - reviewed;
    return `Questions done! ${reviewsLeft} more reviews to hit your goal.`;
  }

  if (dailyTracker.reviewGoalMet) {
    const questionsLeft = questionGoal - answered;
    return `Reviews complete! ${questionsLeft} more questions to go.`;
  }

  const questionsLeft = questionGoal - answered;
  const reviewsLeft = reviewGoal - reviewed;

  if (answered === 0 && reviewed === 0) {
    return "Start your day strong — every question counts!";
  }

  return `${questionsLeft} questions and ${reviewsLeft} reviews to reach today's goals.`;
});

// Initialize on mount
onMounted(() => {
  dailyTracker.initializeToday();
});
</script>

<style scoped>
.daily-tracker {
  padding: 16px;
  background: linear-gradient(
    135deg,
    rgba(27, 38, 59, 0.6) 0%,
    rgba(13, 27, 42, 0.8) 100%
  );
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 12px;
}

.tracker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tracker-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--solar-gold);
  margin: 0;
}

.tracker-date {
  font-size: 0.8rem;
  color: var(--star-silver);
}

.goals-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.goal-item {
  position: relative;
}

.goal-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.goal-label {
  font-size: 0.85rem;
  color: var(--lunar-white);
}

.goal-count {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--nebula-teal);
}

.progress-bar {
  height: 8px;
  background: rgba(65, 90, 119, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill--answered {
  background: linear-gradient(90deg, var(--nebula-teal) 0%, #4ade80 100%);
}

.progress-fill--reviewed {
  background: linear-gradient(90deg, var(--solar-gold) 0%, #fb923c 100%);
}

.goal-badge {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
}

.goal-badge--complete {
  background: rgba(0, 255, 200, 0.2);
  color: var(--nebula-teal);
  border: 1px solid var(--nebula-teal);
}

.streak-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 8px;
  background: linear-gradient(
    90deg,
    rgba(255, 215, 0, 0.1) 0%,
    rgba(255, 107, 53, 0.1) 100%
  );
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.streak-icon {
  font-size: 1.2rem;
}

.streak-count {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--solar-gold);
}

.tracker-motivation {
  margin-top: 12px;
  font-size: 0.8rem;
  color: var(--star-silver);
  text-align: center;
  line-height: 1.4;
}
</style>
