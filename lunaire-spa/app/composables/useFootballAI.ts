/**
 * Football Bar Review - AI Opponent Logic
 *
 * Handles AI decision making for play selection and answering questions.
 * Supports multiple difficulty levels.
 */

import type {
  AnswerTier,
  DefensePlay,
  OffensePlay,
} from "./useFootballScoring";

export type AIDifficulty = "easy" | "medium" | "hard";

interface AIDecision {
  play: OffensePlay | DefensePlay;
  answerChoice: string;
  answerTier: AnswerTier;
  thinkingTimeMs: number;
}

interface GameSituation {
  down: number;
  yardsToGo: number;
  ballPosition: number;
  clockSeconds: number;
  scoreDifferential: number; // positive = AI winning
  isOnOffense: boolean;
}

export function useFootballAI() {
  /**
   * Get AI's answer choice and tier based on difficulty
   */
  const getAIAnswer = (
    difficulty: AIDifficulty,
    correctAnswer: string,
    secondBestAnswer: string | null,
    allChoices: string[],
  ): { choice: string; tier: AnswerTier } => {
    const rand = Math.random();

    // Difficulty-based probabilities
    const probs = {
      easy: { best: 0.3, second: 0.4, worst: 0.3 },
      medium: { best: 0.55, second: 0.3, worst: 0.15 },
      hard: { best: 0.75, second: 0.2, worst: 0.05 },
    };

    const p = probs[difficulty];

    if (rand < p.best) {
      return { choice: correctAnswer, tier: "best" };
    } else if (rand < p.best + p.second && secondBestAnswer) {
      return { choice: secondBestAnswer, tier: "second" };
    } else {
      // Pick one of the worst answers
      const worstAnswers = allChoices.filter(
        (c) => c !== correctAnswer && c !== secondBestAnswer,
      );
      const choice =
        worstAnswers[Math.floor(Math.random() * worstAnswers.length)] ||
        allChoices[0] ||
        "A";
      return { choice, tier: "worst" as const };
    }
  };

  /**
   * Get AI's simulated thinking time based on difficulty
   */
  const getAIThinkingTime = (difficulty: AIDifficulty): number => {
    const ranges = {
      easy: { min: 25000, max: 55000 }, // 25-55 seconds
      medium: { min: 12000, max: 35000 }, // 12-35 seconds
      hard: { min: 6000, max: 20000 }, // 6-20 seconds
    };

    const r = ranges[difficulty];
    return r.min + Math.random() * (r.max - r.min);
  };

  /**
   * Get AI's play selection based on game situation
   */
  const getAIPlaySelection = (
    situation: GameSituation,
    difficulty: AIDifficulty,
  ): OffensePlay | DefensePlay => {
    if (situation.isOnOffense) {
      return getAIOffensivePlay(situation, difficulty);
    } else {
      return getAIDefensivePlay(situation, difficulty);
    }
  };

  /**
   * AI offensive play selection
   */
  const getAIOffensivePlay = (
    situation: GameSituation,
    difficulty: AIDifficulty,
  ): OffensePlay => {
    const { down, yardsToGo, ballPosition, clockSeconds, scoreDifferential } =
      situation;

    // Easy AI is more random
    if (difficulty === "easy") {
      const rand = Math.random();
      if (rand < 0.4) return "run";
      if (rand < 0.75) return "pass";
      return "deep";
    }

    // Medium/Hard AI considers situation

    // Goal line situation - run it in
    if (yardsToGo <= 3 && ballPosition >= 95) {
      return Math.random() < 0.7 ? "run" : "pass";
    }

    // Long yardage (3rd/4th and long)
    if (down >= 3 && yardsToGo > 7) {
      if (difficulty === "hard" && down === 4 && yardsToGo > 15) {
        return "deep"; // Go for it
      }
      return Math.random() < 0.7 ? "pass" : "deep";
    }

    // Short yardage
    if (yardsToGo <= 3) {
      return Math.random() < 0.6 ? "run" : "pass";
    }

    // Losing with little time - be aggressive
    if (scoreDifferential < 0 && clockSeconds < 300) {
      return Math.random() < 0.6 ? "deep" : "pass";
    }

    // Winning with little time - be conservative
    if (scoreDifferential > 0 && clockSeconds < 300) {
      return Math.random() < 0.8 ? "run" : "pass";
    }

    // Default balanced approach
    const rand = Math.random();
    if (rand < 0.35) return "run";
    if (rand < 0.75) return "pass";
    return "deep";
  };

  /**
   * AI defensive play selection
   */
  const getAIDefensivePlay = (
    situation: GameSituation,
    difficulty: AIDifficulty,
  ): DefensePlay => {
    const { down, yardsToGo, ballPosition, clockSeconds, scoreDifferential } =
      situation;

    // Easy AI is more random
    if (difficulty === "easy") {
      const rand = Math.random();
      if (rand < 0.33) return "blitz";
      if (rand < 0.66) return "cover2";
      return "prevent";
    }

    // Medium/Hard AI considers situation

    // Goal line - expect run, blitz
    if (yardsToGo <= 3 && ballPosition >= 95) {
      return Math.random() < 0.7 ? "blitz" : "cover2";
    }

    // Long yardage - expect pass, cover deep
    if (yardsToGo > 10) {
      return Math.random() < 0.6 ? "prevent" : "cover2";
    }

    // Short yardage - expect run, blitz
    if (yardsToGo <= 3) {
      return Math.random() < 0.6 ? "blitz" : "cover2";
    }

    // Winning with little time - prevent big play
    if (scoreDifferential > 0 && clockSeconds < 300) {
      return Math.random() < 0.7 ? "prevent" : "cover2";
    }

    // Losing - be aggressive
    if (scoreDifferential < 0 && clockSeconds < 300) {
      return Math.random() < 0.6 ? "blitz" : "cover2";
    }

    // Default balanced
    const rand = Math.random();
    if (rand < 0.3) return "blitz";
    if (rand < 0.7) return "cover2";
    return "prevent";
  };

  /**
   * Get full AI decision (play + answer + timing)
   */
  const getAIDecision = async (
    situation: GameSituation,
    difficulty: AIDifficulty,
    correctAnswer: string,
    secondBestAnswer: string | null,
    allChoices: string[],
  ): Promise<AIDecision> => {
    const play = getAIPlaySelection(situation, difficulty);
    const { choice, tier } = getAIAnswer(
      difficulty,
      correctAnswer,
      secondBestAnswer,
      allChoices,
    );
    const thinkingTimeMs = getAIThinkingTime(difficulty);

    return {
      play,
      answerChoice: choice,
      answerTier: tier,
      thinkingTimeMs,
    };
  };

  /**
   * Simulate AI "submitting" after a delay
   * Returns a promise that resolves after the thinking time
   */
  const simulateAISubmission = (thinkingTimeMs: number): Promise<number> => {
    return new Promise((resolve) => {
      // Add some randomness to make it feel more natural
      const variance = thinkingTimeMs * 0.2; // ±20%
      const actualTime = thinkingTimeMs + (Math.random() - 0.5) * variance;

      setTimeout(() => {
        resolve(actualTime);
      }, actualTime);
    });
  };

  /**
   * Get difficulty description
   */
  const getDifficultyDescription = (difficulty: AIDifficulty): string => {
    const descriptions = {
      easy: "Rookie - Learns the rules, takes their time",
      medium: "Veteran - Knows the game, solid fundamentals",
      hard: "Pro - Fast, accurate, and strategic",
    };
    return descriptions[difficulty];
  };

  /**
   * Get AI name based on difficulty
   */
  const getAIName = (difficulty: AIDifficulty): string => {
    const names = {
      easy: "Practice Squad AI",
      medium: "Starter AI",
      hard: "All-Pro AI",
    };
    return names[difficulty];
  };

  return {
    getAIAnswer,
    getAIThinkingTime,
    getAIPlaySelection,
    getAIDecision,
    simulateAISubmission,
    getDifficultyDescription,
    getAIName,
  };
}
