import { useApi } from "~/composables/useApi";
import { useQuizStore } from "~/stores/quiz";

type QuestionType = "mix" | "mbe" | "generated";

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
    type: QuestionType;
  }) => {
    const anonymousId =
      localStorage.getItem("monobloc_anonymous_id") || crypto.randomUUID();
    localStorage.setItem("monobloc_anonymous_id", anonymousId);

    const questions = await api.fetchQuestions(
      count,
      subject,
      type,
      undefined,
      anonymousId,
      true,
    );

    if (!questions.length) {
      throw new Error(
        `No questions available for subject='${subject}', type='${type}', count=${count}`,
      );
    }

    quizStore.updateSettings({
      subject,
      questionType: type,
      questionCount: questions.length,
      mode: "classic",
    });
    quizStore.setQuestions(questions);
  };

  return { launchQuiz };
};
