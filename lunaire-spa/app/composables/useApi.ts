import type { Question } from "~/stores/quiz";

export interface DailyProgressResponse {
  progress: {
    user_id: string;
    date: string;
    questions_answered: number;
    questions_reviewed: number;
    question_ids: string[];
    reviewed_ids: string[];
  };
}

export interface SubtopicStat {
  subtopic: string;
  subject: string;
  total_questions: number;
  correct_answers: number;
  accuracy_percent: number;
  avg_time_per_question: number;
  quiz_count: number;
  needs_practice: boolean;
}

export interface ExplanationFeedbackResponse {
  user_feedback: boolean | null;
  stats: {
    up_count: number;
    down_count: number;
  };
}

export const useApi = () => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase;

  const fetchQuestions = async (
    count: number,
    subject: string,
    type: string,
  ): Promise<Question[]> => {
    const params = new URLSearchParams({
      n: count.toString(),
      subject: subject === "all" ? "" : subject,
      type,
    });

    const response = await fetch(`${baseUrl}/questions?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch questions");
    }

    const data = await response.json();
    return data.questions || data;
  };

  const fetchSubjects = async (): Promise<string[]> => {
    const response = await fetch(`${baseUrl}/subjects`);
    if (!response.ok) {
      throw new Error("Failed to fetch subjects");
    }

    const data = await response.json();
    return data.subjects || data;
  };

  const fetchExplanation = async (
    questionId: string,
  ): Promise<Record<string, string> | null> => {
    try {
      const response = await fetch(
        `${baseUrl}/explanations?question_id=${questionId}`,
      );
      if (!response.ok) return null;

      const data = await response.json();
      return data.explanation;
    } catch {
      return null;
    }
  };

  const submitQuizResult = async (result: {
    subject: string;
    score: number;
    total: number;
    answers: { questionId: string; correct: boolean }[];
  }) => {
    try {
      await fetch(`${baseUrl}/quiz-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
    } catch (error) {
      console.error("Failed to submit quiz result:", error);
    }
  };

  // Daily Progress Tracking
  const getDailyProgress = async (
    userId: string = "anonymous",
    date?: string,
  ): Promise<DailyProgressResponse["progress"]> => {
    const params = new URLSearchParams({ user_id: userId });
    if (date) params.append("date", date);

    const response = await fetch(`${baseUrl}/daily-progress?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch daily progress");
    }

    const data = await response.json();
    return data.progress;
  };

  const updateDailyProgress = async (
    questionIds: string[] = [],
    reviewedIds: string[] = [],
    userId: string = "anonymous",
  ): Promise<DailyProgressResponse["progress"]> => {
    const response = await fetch(`${baseUrl}/daily-progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        question_ids: questionIds,
        reviewed_ids: reviewedIds,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update daily progress");
    }

    const data = await response.json();
    return data.progress;
  };

  const getDailyProgressHistory = async (
    userId: string = "anonymous",
    days: number = 30,
  ): Promise<{
    history: DailyProgressResponse["progress"][];
    total_days: number;
    goals_met: number;
  }> => {
    const params = new URLSearchParams({
      user_id: userId,
      days: days.toString(),
    });

    const response = await fetch(`${baseUrl}/daily-progress/history?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch daily progress history");
    }

    return response.json();
  };

  // Track when a question's explanation is viewed
  const trackReview = async (
    questionId: string,
    userId: string = "anonymous",
  ): Promise<{
    success: boolean;
    already_reviewed: boolean;
    reviews_today: number;
    goal_met: boolean;
  }> => {
    const response = await fetch(`${baseUrl}/track-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: questionId,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to track review");
    }

    return response.json();
  };

  // Explanation Feedback (thumbs up/down)
  const saveExplanationFeedback = async (
    questionId: string,
    thumbsUp: boolean,
    userId: string = "anonymous",
  ): Promise<{
    success: boolean;
    stats: { up_count: number; down_count: number };
  }> => {
    const response = await fetch(`${baseUrl}/explanation-feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: questionId,
        thumbs_up: thumbsUp,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save feedback");
    }

    return response.json();
  };

  const getExplanationFeedback = async (
    questionId: string,
    userId: string = "anonymous",
  ): Promise<ExplanationFeedbackResponse> => {
    const params = new URLSearchParams({ user_id: userId });
    const response = await fetch(
      `${baseUrl}/explanation-feedback/${questionId}?${params}`,
    );

    if (!response.ok) {
      throw new Error("Failed to get feedback");
    }

    return response.json();
  };

  // Subtopic Statistics
  const getSubtopicStats = async (
    userId: string = "anonymous",
    subject?: string,
  ): Promise<{
    subtopic_stats: SubtopicStat[];
    subtopics: string[];
    total_subtopics: number;
  }> => {
    const params = new URLSearchParams({ user_id: userId });
    if (subject) params.append("subject", subject);

    const response = await fetch(`${baseUrl}/subtopic-stats?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch subtopic stats");
    }

    return response.json();
  };

  // Generate AI explanations for a batch of questions
  const generateExplanations = async (
    questionIds: string[],
  ): Promise<Record<string, Record<string, string>>> => {
    const response = await fetch(`${baseUrl}/explanations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_ids: questionIds }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate explanations");
    }

    const data = await response.json();
    return data.explanations;
  };

  // Check which questions already have explanations stored
  const checkExistingExplanations = async (
    questionIds: string[],
  ): Promise<{
    explanations_exist: Record<string, boolean>;
    total_existing: number;
  }> => {
    const response = await fetch(`${baseUrl}/explanations/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_ids: questionIds }),
    });

    if (!response.ok) {
      throw new Error("Failed to check explanations");
    }

    return response.json();
  };

  // Store explanations in database (after user approval via no thumbs down)
  const storeExplanations = async (
    explanations: Record<string, Record<string, string>>,
  ): Promise<{ success: boolean; stored_count: number }> => {
    const response = await fetch(`${baseUrl}/explanations/store`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ explanations }),
    });

    if (!response.ok) {
      throw new Error("Failed to store explanations");
    }

    return response.json();
  };

  // Advanced Analytics
  const getAdvancedAnalytics = async (
    userId: string = "anonymous",
    days: number = 30,
  ): Promise<{
    period_days: number;
    recent_performance: Record<string, unknown>;
    all_time_performance: Record<string, unknown>;
    learning_velocity: Record<string, unknown>;
    study_patterns: Record<string, unknown>;
    predictions: Record<string, unknown>;
    recommendations: Array<{
      type: string;
      priority: string;
      message: string;
      action: string;
    }>;
  }> => {
    const params = new URLSearchParams({
      user_id: userId,
      days: days.toString(),
    });

    const response = await fetch(`${baseUrl}/analytics/advanced?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch advanced analytics");
    }

    return response.json();
  };

  return {
    fetchQuestions,
    fetchSubjects,
    fetchExplanation,
    submitQuizResult,
    // Daily progress
    getDailyProgress,
    updateDailyProgress,
    getDailyProgressHistory,
    trackReview,
    // Explanation feedback
    saveExplanationFeedback,
    getExplanationFeedback,
    // Subtopic stats
    getSubtopicStats,
    // AI Explanations
    generateExplanations,
    checkExistingExplanations,
    storeExplanations,
    // Analytics
    getAdvancedAnalytics,
  };
};
