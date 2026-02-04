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
    userId?: string,
    anonymousId?: string,
    smart: boolean = false,
  ): Promise<Question[]> => {
    const params = new URLSearchParams({
      n: count.toString(),
      subject: subject === "all" ? "" : subject,
      type,
    });

    // Add user tracking for smart selection
    if (smart) {
      if (userId) params.append("user_id", userId);
      if (anonymousId) params.append("anonymous_id", anonymousId);
    }

    const endpoint = smart ? "/questions/smart" : "/questions";
    const response = await fetch(`${baseUrl}${endpoint}?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch questions");
    }

    const data = await response.json();
    return data.questions || data;
  };

  // Track question usage after quiz completion (for smart selection)
  const updateQuestionUsage = async (
    answers: { question_id: string; selected: string; correct: boolean }[],
    userId?: string,
    anonymousId?: string,
  ): Promise<{ success: boolean; updated: number }> => {
    const response = await fetch(`${baseUrl}/questions/usage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        anonymous_id: anonymousId,
        answers,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update question usage");
    }

    return response.json();
  };

  // Get second-best answer analysis for a question
  const getSecondBestAnalysis = async (
    questionId: string,
  ): Promise<{
    question_id: string;
    second_best_choice: string;
    analysis: string;
    confidence: number;
    cached: boolean;
  } | null> => {
    try {
      const response = await fetch(
        `${baseUrl}/questions/${questionId}/second-best`,
      );
      if (!response.ok) return null;

      return response.json();
    } catch {
      return null;
    }
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

  // ==================== Essay API Functions ====================

  interface EssayPrompt {
    id: number;
    exam_id: string;
    exam_year: number;
    exam_month: string;
    question_number: number;
    subject: string | null;
    prompt_text?: string;
    model_answer?: string | null;
    source_pdf: string;
    created_at: string;
    prompt_length?: number;
    has_model_answer?: number;
  }

  interface EssayGrade {
    grade_id: number;
    score: number;
    max_score: number;
    overall_feedback: string;
    rubric_points: Array<{
      criterion: string;
      points_possible: number;
      points_awarded: number;
      justification: string;
    }>;
    line_feedback?: Array<{
      line: number;
      text: string;
      score_delta: number;
      feedback: string;
    }>;
    grader_model: string;
  }

  interface UserEssay {
    id: number;
    prompt_id: number;
    essay_text: string;
    word_count: number;
    submitted_at: string;
    grades?: EssayGrade[];
  }

  const fetchEssayPrompts = async (params?: {
    subject?: string;
    year?: number;
    month?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ prompts: EssayPrompt[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.subject) queryParams.append("subject", params.subject);
    if (params?.year) queryParams.append("year", params.year.toString());
    if (params?.month) queryParams.append("month", params.month);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${baseUrl}/essay-prompts?${queryParams.toString()}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch essay prompts");
    }

    return response.json();
  };

  const fetchEssayPrompt = async (
    promptId: number,
  ): Promise<{ prompt: EssayPrompt }> => {
    const response = await fetch(`${baseUrl}/essay-prompts/${promptId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch essay prompt");
    }

    return response.json();
  };

  const fetchEssaySubjects = async (): Promise<
    { subject: string; count: number }[]
  > => {
    const response = await fetch(`${baseUrl}/essay-prompts/subjects`);
    if (!response.ok) {
      throw new Error("Failed to fetch essay subjects");
    }

    const data = await response.json();
    return data.subjects;
  };

  const fetchEssayYears = async (): Promise<
    { year: number; month: string; count: number }[]
  > => {
    const response = await fetch(`${baseUrl}/essay-prompts/years`);
    if (!response.ok) {
      throw new Error("Failed to fetch essay years");
    }

    const data = await response.json();
    return data.years;
  };

  const submitEssay = async (params: {
    prompt_id: number;
    essay_text: string;
    user_id?: string;
    anonymous_id?: string;
    auto_grade?: boolean;
  }): Promise<{
    success: boolean;
    essay_id: number;
    word_count: number;
    grade?: EssayGrade;
    grade_error?: string;
  }> => {
    const response = await fetch(`${baseUrl}/essays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error("Failed to submit essay");
    }

    return response.json();
  };

  const gradeEssay = async (
    essayId: number,
  ): Promise<EssayGrade & { model_answer?: string }> => {
    const response = await fetch(`${baseUrl}/essays/${essayId}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to grade essay");
    }

    return response.json();
  };

  const fetchUserEssays = async (params: {
    user_id?: string;
    anonymous_id?: string;
    limit?: number;
  }): Promise<{ essays: UserEssay[] }> => {
    const queryParams = new URLSearchParams();
    if (params.user_id) queryParams.append("user_id", params.user_id);
    if (params.anonymous_id)
      queryParams.append("anonymous_id", params.anonymous_id);
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(
      `${baseUrl}/user-essays?${queryParams.toString()}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch user essays");
    }

    return response.json();
  };

  const fetchEssayStats = async (params?: {
    user_id?: string;
    anonymous_id?: string;
  }): Promise<{
    total_prompts: number;
    total_subjects?: number;
    user_essays: number;
    graded_count?: number;
    avg_score: number | null;
    best_score?: number;
    subjects?: { subject: string; count: number; avg_score: number | null }[];
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append("user_id", params.user_id);
    if (params?.anonymous_id)
      queryParams.append("anonymous_id", params.anonymous_id);

    const response = await fetch(
      `${baseUrl}/essay-stats?${queryParams.toString()}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch essay stats");
    }

    return response.json();
  };

  // ==========================================================================
  // MBE QUESTION GENERATION
  // ==========================================================================

  interface GenerationResult {
    success: boolean;
    batch_id: string;
    requested: number;
    generated: number;
    saved: number;
    fallback_used: boolean;
    source: "mbe_extraction" | "outline_based" | "hybrid";
    questions: Question[];
    errors?: string[];
  }

  interface VoteResult {
    success: boolean;
    question_id: string;
    vote: "up" | "down";
    counts: {
      up: number;
      down: number;
    };
  }

  interface GenerationStats {
    total_generated: number;
    model_questions: number;
    pending_review: number;
    rejected: number;
    by_source: Record<string, number>;
    by_subject: Record<string, number>;
    recent_batches: Array<{
      batch_id: string;
      subject: string;
      subtopic: string | null;
      requested: number;
      generated: number;
      fallback_used: boolean;
      source: string;
      created_at: string;
    }>;
  }

  interface QuestionVoteStatus {
    question_id: string;
    is_generated: boolean;
    is_model_question: boolean;
    approval_status: "approved" | "rejected" | null;
    vote_counts: {
      up: number;
      down: number;
    };
    user_vote: "up" | "down" | null;
  }

  /**
   * Generate MBE questions using the advanced dual-vector-store system.
   * Includes deduplication and fallback to outline-based generation.
   */
  const generateMBEQuestions = async (
    subject: string,
    options?: {
      subtopic?: string;
      count?: number;
      user_id?: string;
    },
  ): Promise<GenerationResult> => {
    const response = await fetch(`${baseUrl}/generate-mbe-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        subtopic: options?.subtopic,
        count: options?.count ?? 5,
        user_id: options?.user_id,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate questions");
    }

    return response.json();
  };

  /**
   * Vote on an AI-generated question quality.
   * 'up' = approve as model question
   * 'down' = reject/exclude
   */
  const voteOnQuestion = async (
    questionId: string,
    vote: "up" | "down",
    userId?: string,
    anonymousId?: string,
  ): Promise<VoteResult> => {
    const response = await fetch(`${baseUrl}/questions/${questionId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vote,
        user_id: userId,
        anonymous_id: anonymousId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to vote");
    }

    return response.json();
  };

  /**
   * Approve a question as a model question (shortcut for up vote).
   */
  const approveQuestion = async (
    questionId: string,
    userId?: string,
    anonymousId?: string,
  ): Promise<VoteResult & { status: string }> => {
    const response = await fetch(`${baseUrl}/questions/${questionId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        anonymous_id: anonymousId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to approve question");
    }

    return response.json();
  };

  /**
   * Get generation statistics.
   */
  const getGenerationStats = async (): Promise<GenerationStats> => {
    const response = await fetch(`${baseUrl}/generation-stats`);
    if (!response.ok) {
      throw new Error("Failed to fetch generation stats");
    }
    return response.json();
  };

  /**
   * Get subtopic probability weights for a subject.
   */
  const getSubtopicWeights = async (
    subject: string,
  ): Promise<{ subject: string; weights: Record<string, number> }> => {
    const response = await fetch(
      `${baseUrl}/subtopic-weights?subject=${encodeURIComponent(subject)}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch subtopic weights");
    }
    return response.json();
  };

  /**
   * Get vote status for a specific question.
   */
  const getQuestionVoteStatus = async (
    questionId: string,
    userId?: string,
    anonymousId?: string,
  ): Promise<QuestionVoteStatus> => {
    const params = new URLSearchParams();
    if (userId) params.append("user_id", userId);
    if (anonymousId) params.append("anonymous_id", anonymousId);

    const response = await fetch(
      `${baseUrl}/questions/${questionId}/vote-status?${params.toString()}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch vote status");
    }
    return response.json();
  };

  return {
    fetchQuestions,
    updateQuestionUsage,
    getSecondBestAnalysis,
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
    // Essays
    fetchEssayPrompts,
    fetchEssayPrompt,
    fetchEssaySubjects,
    fetchEssayYears,
    submitEssay,
    gradeEssay,
    fetchUserEssays,
    fetchEssayStats,
    // MBE Question Generation
    generateMBEQuestions,
    voteOnQuestion,
    approveQuestion,
    getGenerationStats,
    getSubtopicWeights,
    getQuestionVoteStatus,
  };
};
