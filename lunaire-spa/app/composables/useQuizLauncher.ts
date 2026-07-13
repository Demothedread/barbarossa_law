import { useApi } from "~/composables/useApi";
import { useQuizStore } from "~/stores/quiz";

type QuestionType = "mix" | "mbe" | "generated";
const questionTypes: QuestionType[] = ["mix", "mbe", "generated"];
export const DEFAULT_QUIZ_OPTIONS = {
  count: 9,
  subject: "all",
  type: "mix" as QuestionType,
};

export const useQuizLauncher = () => {
  const api = useApi();
  const quizStore = useQuizStore();

  const launchQuiz = async ({
    count,
    subject,
    type,
  }: {
    count: number;
    subject: string;
    type: string;
  }) => {
    if (!questionTypes.includes(type as QuestionType)) {
      throw new Error(
        `Invalid question type '${type}'. Expected: mix, mbe, or generated.`,
      );
    }
    const questionType = type as QuestionType;
    const anonymousId =
      localStorage.getItem("monobloc_anonymous_id") || crypto.randomUUID();
    localStorage.setItem("monobloc_anonymous_id", anonymousId);

    const questions = await api.fetchQuestions(
      count,
      subject,
      questionType,
      undefined,
      anonymousId,
      true,
    );

    if (!questions.length) {
      throw new Error(
        `No questions available for subject='${subject}', type='${questionType}', count=${count}`,
      );
    }

    quizStore.updateSettings({
      subject,
      questionType,
      questionCount: questions.length,
      mode: "classic",
    });
    quizStore.setQuestions(questions);
  };

  return { launchQuiz };
};
