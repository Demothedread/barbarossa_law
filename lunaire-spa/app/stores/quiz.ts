import { defineStore } from "pinia";
import { useApi } from "~/composables/useApi";
import { useDailyTrackerStore } from "./dailyTracker";

export interface Question {
  id: string;
  prompt?: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation?: string;
  subject?: string;
  subtopic?: string;
}

export interface QuizResult {
  id: string;
  date: string;
  subject: string;
  score: number;
  total: number;
  timeSpent: number;
  answers: { questionId: string; selected: string; correct: boolean }[];
}

interface QuizState {
  // Current quiz session
  currentQuestions: Question[];
  currentIndex: number;
  selectedAnswers: Map<number, string>;
  startTime: number | null;
  questionStartTimes: number[];

  // History
  quizHistory: QuizResult[];

  // Settings
  settings: {
    subject: string;
    questionType: "mix" | "mbe" | "generated";
    questionCount: number;
    mode: "classic" | "quizshow" | "baseball" | "golf" | "football";
  };
}

export const useQuizStore = defineStore("quiz", {
  state: (): QuizState => ({
    currentQuestions: [],
    currentIndex: 0,
    selectedAnswers: new Map(),
    startTime: null,
    questionStartTimes: [],
    quizHistory: [],
    settings: {
      subject: "all",
      questionType: "mix",
      questionCount: 9,
      mode: "classic",
    },
  }),

  getters: {
    currentQuestion: (state) => state.currentQuestions[state.currentIndex],

    totalQuestions: (state) => state.currentQuestions.length,

    progress: (state) =>
      state.currentQuestions.length > 0
        ? ((state.currentIndex + 1) / state.currentQuestions.length) * 100
        : 0,

    isComplete: (state) =>
      state.currentIndex >= state.currentQuestions.length - 1 &&
      state.selectedAnswers.has(state.currentIndex),

    averageScore(): number {
      if (this.quizHistory.length === 0) return 0;
      const total = this.quizHistory.reduce(
        (sum, quiz) => sum + (quiz.score / quiz.total) * 100,
        0,
      );
      return Math.round(total / this.quizHistory.length);
    },

    currentScore: (state) => {
      let correct = 0;
      state.selectedAnswers.forEach((answer, index) => {
        const question = state.currentQuestions[index];
        if (question && answer === question.answer) {
          correct++;
        }
      });
      return correct;
    },
  },

  actions: {
    setQuestions(questions: Question[]) {
      this.currentQuestions = questions;
      this.currentIndex = 0;
      this.selectedAnswers = new Map();
      this.startTime = Date.now();
      this.questionStartTimes = [Date.now()];
    },

    selectAnswer(answer: string) {
      this.selectedAnswers.set(this.currentIndex, answer);
    },

    nextQuestion() {
      if (this.currentIndex < this.currentQuestions.length - 1) {
        this.currentIndex++;
        this.questionStartTimes.push(Date.now());
      }
    },

    previousQuestion() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      }
    },

    goToQuestion(index: number) {
      if (index >= 0 && index < this.currentQuestions.length) {
        this.currentIndex = index;
      }
    },

    completeQuiz() {
      // Import daily tracker store dynamically to avoid circular deps
      const dailyTracker = useDailyTrackerStore();

      const result: QuizResult = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        subject: this.settings.subject,
        score: this.currentScore,
        total: this.totalQuestions,
        timeSpent: this.startTime ? Date.now() - this.startTime : 0,
        answers: Array.from(this.selectedAnswers.entries()).map(
          ([index, selected]) => ({
            questionId: this.currentQuestions[index].id,
            selected,
            correct: selected === this.currentQuestions[index].answer,
          }),
        ),
      };

      // Record each question answered in the daily tracker
      for (const [index, selected] of this.selectedAnswers.entries()) {
        const question = this.currentQuestions[index];
        const correct = selected === question.answer;
        const subject = question.subject || this.settings.subject || "General";
        const subtopic = question.subtopic || undefined;

        dailyTracker.recordQuestionAnswered(subject, subtopic, correct);
      }

      // Track question usage for smart selection (async, fire-and-forget)
      this.trackQuestionUsage(result.answers);

      this.quizHistory.unshift(result);
      return result;
    },

    // Track which questions the user has seen for smart question selection
    async trackQuestionUsage(
      answers: { questionId: string; selected: string; correct: boolean }[],
    ) {
      try {
        const { updateQuestionUsage } = useApi();
        const anonymousId =
          localStorage.getItem("barbarossa_anonymous_id") ||
          crypto.randomUUID();

        // Ensure we have an anonymous ID stored
        if (!localStorage.getItem("barbarossa_anonymous_id")) {
          localStorage.setItem("barbarossa_anonymous_id", anonymousId);
        }

        await updateQuestionUsage(
          answers.map((a) => ({
            question_id: a.questionId,
            selected: a.selected,
            correct: a.correct,
          })),
          undefined, // user_id (for logged-in users, future)
          anonymousId,
        );
      } catch (error) {
        console.warn("Failed to track question usage:", error);
      }
    },

    // Complete quiz with result from alternative game modes
    completeQuizWithResult(modeResult: {
      score: number;
      total: number;
      answers: {
        questionId: string;
        selected: string | null;
        correct: boolean;
      }[];
      [key: string]: any; // Allow additional mode-specific data
    }) {
      const dailyTracker = useDailyTrackerStore();

      const result: QuizResult = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        subject: this.settings.subject,
        score: modeResult.score,
        total: modeResult.total,
        timeSpent: this.startTime ? Date.now() - this.startTime : 0,
        answers: modeResult.answers.map((a) => ({
          questionId: a.questionId,
          selected: a.selected || "",
          correct: a.correct,
        })),
      };

      // Record each question answered in the daily tracker
      for (const answer of modeResult.answers) {
        const question = this.currentQuestions.find(
          (q) => q.id === answer.questionId,
        );
        if (question) {
          const subject =
            question.subject || this.settings.subject || "General";
          const subtopic = question.subtopic || undefined;
          dailyTracker.recordQuestionAnswered(
            subject,
            subtopic,
            answer.correct,
          );
        }
      }

      // Track question usage for smart selection
      this.trackQuestionUsage(
        modeResult.answers.map((a) => ({
          questionId: a.questionId,
          selected: a.selected || "",
          correct: a.correct,
        })),
      );

      this.quizHistory.unshift(result);
      return result;
    },

    updateSettings(settings: Partial<QuizState["settings"]>) {
      this.settings = { ...this.settings, ...settings };
    },

    reset() {
      this.currentQuestions = [];
      this.currentIndex = 0;
      this.selectedAnswers = new Map();
      this.startTime = null;
      this.questionStartTimes = [];
    },
  },

  persist: {
    pick: ["quizHistory", "settings"],
  },
});
