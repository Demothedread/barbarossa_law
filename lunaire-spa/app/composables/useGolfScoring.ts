/**
 * Golf Scoring Composable
 * Implements Deez' Eazy-Breezy Crater Golf Club scoring system
 *
 * Scoring:
 * - Birdie (-1): Correct + under 90 seconds
 * - Par (0): Correct answer (>= 90s)
 * - Bogey (+1): Best wrong answer (if ranking available)
 * - Double Bogey (+2): Wrong answer / Timeout
 */

import type { Question } from "~/stores/quiz";

export interface GolfScore {
  type: "birdie" | "par" | "bogey" | "double-bogey";
  value: number;
  label: string;
  description: string;
  cssClass: string;
}

export interface RoundSummary {
  totalScore: number;
  rating: string;
  description: string;
  birdies: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  correctCount: number;
  totalQuestions: number;
  percentage: string;
}

export function useGolfScoring() {
  /**
   * Calculate the golf score type based on answer correctness and time
   */
  const calculateScore = (
    question: Question,
    userAnswer: string | null,
    timeSpentMs: number,
  ): GolfScore => {
    const correctAnswer = question.answer.toUpperCase();
    const userAnswerUpper = userAnswer?.toUpperCase() || null;
    const isCorrect = userAnswerUpper === correctAnswer;
    const timeSpentSeconds = (timeSpentMs || 90000) / 1000;

    if (isCorrect) {
      if (timeSpentSeconds < 90) {
        return {
          type: "birdie",
          value: -1,
          label: "Birdie",
          description: "Under par! Correct in under 90s",
          cssClass: "score--birdie",
        };
      } else {
        return {
          type: "par",
          value: 0,
          label: "Par",
          description: "On target. Correct answer.",
          cssClass: "score--par",
        };
      }
    } else {
      // No answer submitted = Double Bogey
      if (!userAnswerUpper) {
        return {
          type: "double-bogey",
          value: 2,
          label: "Double Bogey",
          description: "No answer submitted",
          cssClass: "score--double-bogey",
        };
      }

      // Wrong answer = Bogey (benefit of doubt)
      return {
        type: "bogey",
        value: 1,
        label: "Bogey",
        description: "One over par",
        cssClass: "score--bogey",
      };
    }
  };

  /**
   * Calculate overall round score summary
   */
  const calculateRoundScore = (scores: GolfScore[]): RoundSummary => {
    const total = scores.reduce((sum, s) => sum + s.value, 0);
    const birdies = scores.filter((s) => s.type === "birdie").length;
    const pars = scores.filter((s) => s.type === "par").length;
    const bogeys = scores.filter((s) => s.type === "bogey").length;
    const doubleBogeys = scores.filter((s) => s.type === "double-bogey").length;

    let rating = "";
    let description = "";

    if (total <= -scores.length * 0.5) {
      rating = "TOURNAMENT CHAMPION";
      description = "A truly spectacular round. You crushed it.";
    } else if (total < 0) {
      rating = "UNDER PAR";
      description = "Excellent play. Below par for the round.";
    } else if (total === 0) {
      rating = "EVEN PAR";
      description = "A solid round. Right on target.";
    } else if (total <= scores.length * 0.5) {
      rating = "OVER PAR";
      description = "A few rough patches, but respectable.";
    } else if (total <= scores.length) {
      rating = "STRUGGLING";
      description = "Time to hit the driving range.";
    } else {
      rating = "ROUGH DAY";
      description = "Everyone has off days. Come back stronger.";
    }

    const correctCount = birdies + pars;

    return {
      totalScore: total,
      rating,
      description,
      birdies,
      pars,
      bogeys,
      doubleBogeys,
      correctCount,
      totalQuestions: scores.length,
      percentage: ((correctCount / scores.length) * 100).toFixed(1),
    };
  };

  /**
   * Get score display color
   */
  const getScoreColor = (score: GolfScore): string => {
    switch (score.type) {
      case "birdie":
        return "var(--color-success, #22c55e)";
      case "par":
        return "var(--color-info, #3b82f6)";
      case "bogey":
        return "var(--color-warning, #f59e0b)";
      case "double-bogey":
        return "var(--color-error, #ef4444)";
    }
  };

  /**
   * Get score emoji
   */
  const getScoreEmoji = (score: GolfScore): string => {
    switch (score.type) {
      case "birdie":
        return "🐦";
      case "par":
        return "⛳";
      case "bogey":
        return "😬";
      case "double-bogey":
        return "💀";
    }
  };

  return {
    calculateScore,
    calculateRoundScore,
    getScoreColor,
    getScoreEmoji,
  };
}
