import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface DailyProgress {
  date: string;
  questionsAnswered: number;
  questionsReviewed: number;
  questionIds: string[];
  reviewedIds: string[];
}

export interface SubtopicStats {
  correct: number;
  total: number;
  accuracy: number;
}

export interface SubjectPerformance {
  subject: string;
  subtopics: Record<string, SubtopicStats>;
  totalCorrect: number;
  totalQuestions: number;
  avgScore: number;
}

const getTodayKey = (): string => {
  const today = new Date();
  return today.toISOString().split("T")[0] || new Date().toDateString(); // YYYY-MM-DD
};

export const useDailyTrackerStore = defineStore(
  "dailyTracker",
  () => {
    // State
    const dailyProgress = ref<DailyProgress[]>([]);
    const currentDay = ref<DailyProgress | null>(null);
    const dailyQuestionGoal = ref(50);
    const dailyReviewGoal = ref(50);
    const subjectPerformance = ref<Record<string, SubjectPerformance>>({});
    const explanationFeedback = ref<
      Record<string, { thumbsUp: boolean; timestamp: string } | null>
    >({});

    // Initialize today's progress
    const initializeToday = () => {
      const today = getTodayKey();
      if (currentDay.value?.date !== today) {
        // Save previous day if exists
        if (currentDay.value && currentDay.value.date !== today) {
          saveTodayProgress();
        }

        // Find or create today's entry
        const existingToday = dailyProgress.value.find((p) => p.date === today);
        if (existingToday) {
          currentDay.value = { ...existingToday };
        } else {
          currentDay.value = {
            date: today,
            questionsAnswered: 0,
            questionsReviewed: 0,
            questionIds: [],
            reviewedIds: [],
          };
        }
      }
    };

    // Getters as computed
    const todayProgress = computed((): DailyProgress => {
      initializeToday();
      return (
        currentDay.value || {
          date: getTodayKey(),
          questionsAnswered: 0,
          questionsReviewed: 0,
          questionIds: [],
          reviewedIds: [],
        }
      );
    });

    const questionsAnsweredToday = computed(
      () => todayProgress.value.questionsAnswered,
    );
    const questionsReviewedToday = computed(
      () => todayProgress.value.questionsReviewed,
    );

    const questionGoalProgress = computed(() =>
      Math.min(
        (questionsAnsweredToday.value / dailyQuestionGoal.value) * 100,
        100,
      ),
    );

    const reviewGoalProgress = computed(() =>
      Math.min(
        (questionsReviewedToday.value / dailyReviewGoal.value) * 100,
        100,
      ),
    );

    const questionGoalMet = computed(
      () => questionsAnsweredToday.value >= dailyQuestionGoal.value,
    );
    const reviewGoalMet = computed(
      () => questionsReviewedToday.value >= dailyReviewGoal.value,
    );

    const currentStreak = computed(() => {
      let streak = 0;
      const today = new Date();

      for (let i = 0; i < 90; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateKey = checkDate.toISOString().split("T")[0];

        // For today, check current day
        if (i === 0) {
          if (questionGoalMet.value && reviewGoalMet.value) {
            streak++;
          } else {
            // Today not complete yet, don't break the streak
            continue;
          }
        } else {
          const dayProgress = dailyProgress.value.find(
            (p) => p.date === dateKey,
          );
          if (
            dayProgress &&
            dayProgress.questionsAnswered >= dailyQuestionGoal.value &&
            dayProgress.questionsReviewed >= dailyReviewGoal.value
          ) {
            streak++;
          } else {
            break;
          }
        }
      }

      return streak;
    });

    const allSubtopicPerformance = computed(() => {
      const result: Array<{
        subject: string;
        subtopic: string;
        accuracy: number;
        total: number;
      }> = [];

      for (const [subject, data] of Object.entries(subjectPerformance.value)) {
        if (data.subtopics) {
          for (const [subtopicName, subtopicData] of Object.entries(
            data.subtopics,
          )) {
            result.push({
              subject,
              subtopic: subtopicName,
              accuracy: subtopicData.accuracy,
              total: subtopicData.total,
            });
          }
        }
      }

      return result;
    });

    const weakestSubtopics = computed(() => {
      return allSubtopicPerformance.value
        .filter((s) => s.total >= 3) // Only include if enough data
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 10);
    });

    // Actions
    const saveTodayProgress = () => {
      if (!currentDay.value) return;

      const existingIdx = dailyProgress.value.findIndex(
        (p) => p.date === currentDay.value!.date,
      );

      if (existingIdx >= 0) {
        dailyProgress.value[existingIdx] = { ...currentDay.value };
      } else {
        dailyProgress.value.push({ ...currentDay.value });
      }

      // Keep only last 30 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      const cutoffKey = cutoffDate.toISOString().split("T")[0] || "";
      dailyProgress.value = dailyProgress.value.filter(
        (p) => p.date >= cutoffKey,
      );
    };

    const updateSubjectPerformance = (
      subject: string,
      subtopic: string | undefined,
      isCorrect: boolean,
    ) => {
      if (!subjectPerformance.value[subject]) {
        subjectPerformance.value[subject] = {
          subject,
          subtopics: {},
          totalCorrect: 0,
          totalQuestions: 0,
          avgScore: 0,
        };
      }

      const perf = subjectPerformance.value[subject];
      perf.totalQuestions++;
      if (isCorrect) perf.totalCorrect++;
      perf.avgScore = Math.round(
        (perf.totalCorrect / perf.totalQuestions) * 100,
      );

      if (subtopic) {
        if (!perf.subtopics[subtopic]) {
          perf.subtopics[subtopic] = {
            correct: 0,
            total: 0,
            accuracy: 0,
          };
        }

        const sub = perf.subtopics[subtopic];
        sub.total++;
        if (isCorrect) sub.correct++;
        sub.accuracy = Math.round((sub.correct / sub.total) * 100);
      }
    };

    const recordQuestionAnswered = (
      subject: string,
      subtopic?: string,
      isCorrect: boolean = false,
    ) => {
      initializeToday();

      if (currentDay.value) {
        currentDay.value.questionsAnswered++;
        saveTodayProgress();
        updateSubjectPerformance(subject, subtopic, isCorrect);
      }
    };

    const recordQuestionReviewed = (
      subject: string,
      subtopic?: string,
      isCorrect: boolean = false,
    ) => {
      initializeToday();

      if (currentDay.value) {
        currentDay.value.questionsReviewed++;
        saveTodayProgress();
        // Update performance tracking on review as well
        if (subject) {
          updateSubjectPerformance(subject, subtopic, isCorrect);
        }
      }
    };

    const recordExplanationFeedback = (
      questionId: string,
      thumbsUp: boolean,
      _subject: string,
    ) => {
      explanationFeedback.value[questionId] = {
        thumbsUp,
        timestamp: new Date().toISOString(),
      };
    };

    const getSubjectStats = (subject?: string) => {
      if (subject) {
        return subjectPerformance.value[subject] || null;
      }
      return subjectPerformance.value;
    };

    const getWeeklyProgress = () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoKey = weekAgo.toISOString().split("T")[0] || "";

      return dailyProgress.value
        .filter((p) => p.date >= weekAgoKey)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
    };

    const resetDailyProgress = () => {
      currentDay.value = {
        date: getTodayKey(),
        questionsAnswered: 0,
        questionsReviewed: 0,
        questionIds: [],
        reviewedIds: [],
      };
      saveTodayProgress();
    };

    return {
      // State
      dailyProgress,
      currentDay,
      dailyQuestionGoal,
      dailyReviewGoal,
      subjectPerformance,
      explanationFeedback,
      // Getters
      todayProgress,
      questionsAnsweredToday,
      questionsReviewedToday,
      questionGoalProgress,
      reviewGoalProgress,
      questionGoalMet,
      reviewGoalMet,
      currentStreak,
      allSubtopicPerformance,
      weakestSubtopics,
      // Actions
      initializeToday,
      recordQuestionAnswered,
      recordQuestionReviewed,
      recordExplanationFeedback,
      getSubjectStats,
      getWeeklyProgress,
      resetDailyProgress,
    };
  },
  {
    persist: {
      key: "dailyTracker",
      pick: [
        "dailyProgress",
        "currentDay",
        "subjectPerformance",
        "explanationFeedback",
      ],
    },
  } as any,
);
