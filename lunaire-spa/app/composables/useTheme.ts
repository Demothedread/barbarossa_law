import { useQuizStore } from "~/stores/quiz";

export const useTheme = () => {
  const quizStore = useQuizStore();

  const currentMode = computed(() => quizStore.settings.mode);

  // Mode-specific class names for styling
  const modeClass = computed(() => {
    return `mode--${currentMode.value}`;
  });

  // Mode-specific terminology
  const terminology = computed(() => {
    switch (currentMode.value) {
      case "golf":
        return {
          question: "Hole",
          session: "Round",
          start: "Tee Off",
          finish: "Finish Round",
          score: "Scorecard",
          correct: "Birdie",
          wrong: "Bogey",
          fast: "Eagle",
        };
      case "baseball":
        return {
          question: "At-Bat",
          session: "Inning",
          start: "Play Ball",
          finish: "Final Score",
          score: "Box Score",
          correct: "Hit",
          wrong: "Strikeout",
          fast: "Home Run",
        };
      case "quizshow":
        return {
          question: "Question",
          session: "Game",
          start: "Start Game",
          finish: "Final Answer",
          score: "Winnings",
          correct: "Correct!",
          wrong: "Wrong!",
          fast: "Bonus!",
        };
      default: // classic
        return {
          question: "Question",
          session: "Session",
          start: "Begin Session",
          finish: "Finish",
          score: "Results",
          correct: "Correct",
          wrong: "Wrong",
          fast: "Quick Answer",
        };
    }
  });

  // Mode-specific color accents
  const modeColors = computed(() => {
    switch (currentMode.value) {
      case "golf":
        return {
          primary: "var(--golf-green)",
          accent: "var(--clubhouse-gold)",
          background: "var(--fairway-emerald)",
        };
      case "baseball":
        return {
          primary: "var(--diamond-red)",
          accent: "var(--chalk-white)",
          background: "var(--grass-green)",
        };
      case "quizshow":
        return {
          primary: "var(--game-gold)",
          accent: "var(--stage-purple)",
          background: "var(--spotlight-blue)",
        };
      default:
        return {
          primary: "var(--nebula-teal)",
          accent: "var(--solar-gold)",
          background: "var(--deep-space)",
        };
    }
  });

  return {
    currentMode,
    modeClass,
    terminology,
    modeColors,
  };
};
