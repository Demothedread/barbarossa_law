/**
 * Football Bar Review - Scoring and Game Logic Composable
 *
 * Handles the complex outcome matrix for the football-themed quiz game:
 * - Play type interactions (Run/Pass/Deep vs Blitz/Cover2/Prevent)
 * - Answer quality tiers (Best/Second/Worst)
 * - Time differential accelerants
 * - Down and distance tracking
 */

export type OffensePlay = "run" | "pass" | "deep";
export type DefensePlay = "blitz" | "cover2" | "prevent";
export type AnswerTier = "best" | "second" | "worst";

export interface PlayOutcome {
  yards: number;
  description: string;
  isTurnover: boolean;
  turnoverType?: "interception" | "fumble";
  isSack: boolean;
  isIncomplete: boolean;
  isTouchdown: boolean;
  isBigPlay: boolean; // 20+ yards
  animationType:
    | "gain"
    | "loss"
    | "turnover"
    | "sack"
    | "incomplete"
    | "touchdown";
}

export interface GameState {
  // Score
  homeScore: number;
  awayScore: number;

  // Possession
  possession: "home" | "away";
  ballPosition: number; // 0-100, 0 = home endzone, 100 = away endzone
  down: number; // 1-4
  yardsToGo: number;

  // Clock
  clockSeconds: number; // Counting down from 1800 (30 min)

  // Game state
  homeHasPossessed: boolean;
  awayHasPossessed: boolean;
  isOvertime: boolean;
  quarter: number;
}

export interface PlayResult {
  outcome: PlayOutcome;
  newGameState: GameState;
  offenseWon: boolean;
  defenseWon: boolean;
  timeAccelerant: number;
  baseYards: number;
  finalYards: number;
}

// Base yard outcomes for each play combination
// Format: [offenseAnswer][defenseAnswer] = yards
// Negative = loss, 'INT' = interception, 'SACK' = sack, 'INC' = incomplete
type YardValue = number | "INT" | "SACK" | "INC";

const BASE_OUTCOMES: Record<
  OffensePlay,
  Record<DefensePlay, Record<AnswerTier, Record<AnswerTier, YardValue>>>
> = {
  run: {
    blitz: {
      best: { best: 5, second: 8, worst: 12 },
      second: { best: -3, second: 2, worst: 5 },
      worst: { best: -5, second: -3, worst: -2 },
    },
    cover2: {
      best: { best: 6, second: 8, worst: 10 },
      second: { best: 1, second: 3, worst: 4 },
      worst: { best: -2, second: -1, worst: 0 },
    },
    prevent: {
      best: { best: 10, second: 12, worst: 15 },
      second: { best: 4, second: 5, worst: 7 },
      worst: { best: 0, second: 1, worst: 3 },
    },
  },
  pass: {
    blitz: {
      best: { best: 8, second: 15, worst: 22 },
      second: { best: "SACK", second: 3, worst: 10 },
      worst: { best: "INT", second: "SACK", worst: "INC" },
    },
    cover2: {
      best: { best: 10, second: 14, worst: 18 },
      second: { best: 2, second: 5, worst: 8 },
      worst: { best: "INT", second: "INC", worst: "INC" },
    },
    prevent: {
      best: { best: 8, second: 11, worst: 14 },
      second: { best: 3, second: 5, worst: 7 },
      worst: { best: "INC", second: "INC", worst: "INC" },
    },
  },
  deep: {
    blitz: {
      best: { best: 30, second: 38, worst: 45 },
      second: { best: "INT", second: "INT", worst: 12 },
      worst: { best: "INT", second: "INT", worst: "INT" },
    },
    cover2: {
      best: { best: 20, second: 25, worst: 30 },
      second: { best: 5, second: 8, worst: 12 },
      worst: { best: "INT", second: "INT", worst: "INC" },
    },
    prevent: {
      best: { best: 12, second: 15, worst: 18 },
      second: { best: 5, second: 7, worst: 10 },
      worst: { best: "INC", second: "INC", worst: "INC" },
    },
  },
};

// Outcome descriptions for commentary
const OUTCOME_DESCRIPTIONS: Record<string, string[]> = {
  bigGain: [
    "HUGE PLAY! The offense breaks free!",
    "What a play! Big yardage!",
    "The defense is left in the dust!",
    "That's going to move the chains!",
  ],
  moderateGain: [
    "Nice gain on the play.",
    "Solid execution by the offense.",
    "First down territory!",
    "The offense is moving the ball.",
  ],
  smallGain: [
    "Short gain on the play.",
    "The defense limits the damage.",
    "A few yards, but not much more.",
    "Grinding it out.",
  ],
  noGain: [
    "Stuffed at the line!",
    "The defense holds strong.",
    "No gain on the play.",
    "Going nowhere fast.",
  ],
  loss: [
    "Loss on the play!",
    "The defense gets into the backfield!",
    "Negative yardage for the offense.",
    "Bad play call there.",
  ],
  sack: [
    "SACK! The QB goes down!",
    "Pressure gets home! Big loss!",
    "The blitz gets there!",
    "Down behind the line of scrimmage!",
  ],
  interception: [
    "INTERCEPTED! Turnover!",
    "The defense makes a huge play!",
    "Ball hawk! That's a pick!",
    "The QB made a costly mistake!",
  ],
  incomplete: [
    "Incomplete pass.",
    "The ball falls to the turf.",
    "No connection on that one.",
    "The coverage was too tight.",
  ],
  touchdown: [
    "TOUCHDOWN!!!",
    "SIX POINTS! What a play!",
    "INTO THE END ZONE!",
    "THAT'S A SCORE!",
  ],
};

function randomChoice<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error("Cannot pick from empty array");
  }
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export function useFootballScoring() {
  /**
   * Calculate the time accelerant based on submission time differential
   * Faster + correct = bigger bonus, slower + wrong = bigger penalty
   */
  const calculateTimeAccelerant = (
    offenseTimeMs: number,
    defenseTimeMs: number,
    offenseWon: boolean,
  ): number => {
    const timeDiffSeconds = Math.abs(offenseTimeMs - defenseTimeMs) / 1000;
    const offenseWasFaster = offenseTimeMs < defenseTimeMs;

    // Base accelerant: 1 + (time_diff / 30), capped at 4x
    const baseAccelerant = 1 + Math.min(timeDiffSeconds / 30, 3);

    if (offenseWon && offenseWasFaster) {
      // Fast + correct = full bonus
      return baseAccelerant;
    } else if (offenseWon && !offenseWasFaster) {
      // Slow + correct = reduced bonus
      return Math.max(1, 2 - baseAccelerant / 2);
    } else if (!offenseWon && !offenseWasFaster) {
      // Slow + wrong = full penalty
      return baseAccelerant;
    } else {
      // Fast + wrong = reduced penalty
      return Math.max(1, 2 - baseAccelerant / 2);
    }
  };

  /**
   * Determine answer tier from the selected answer and correct answer
   */
  const getAnswerTier = (
    selectedAnswer: string,
    correctAnswer: string,
    secondBestAnswer: string | null,
  ): AnswerTier => {
    if (selectedAnswer === correctAnswer) {
      return "best";
    }
    if (secondBestAnswer && selectedAnswer === secondBestAnswer) {
      return "second";
    }
    return "worst";
  };

  /**
   * Calculate the outcome of a play
   */
  const calculatePlayOutcome = (
    offensePlay: OffensePlay,
    defensePlay: DefensePlay,
    offenseAnswer: AnswerTier,
    defenseAnswer: AnswerTier,
    offenseTimeMs: number,
    defenseTimeMs: number,
    currentState: GameState,
  ): PlayResult => {
    // Get base outcome from matrix
    const baseOutcome =
      BASE_OUTCOMES[offensePlay][defensePlay][offenseAnswer][defenseAnswer];

    // Determine if offense "won" the exchange
    const answerRank = { best: 0, second: 1, worst: 2 };
    const offenseWon = answerRank[offenseAnswer] <= answerRank[defenseAnswer];
    const defenseWon = answerRank[defenseAnswer] < answerRank[offenseAnswer];

    // Calculate time accelerant
    const timeAccelerant = calculateTimeAccelerant(
      offenseTimeMs,
      defenseTimeMs,
      offenseWon,
    );

    // Process the outcome
    let outcome: PlayOutcome;
    let baseYards = 0;
    let finalYards = 0;

    if (baseOutcome === "INT") {
      outcome = {
        yards: 0,
        description: randomChoice(
          OUTCOME_DESCRIPTIONS.interception ?? ["Interception!"],
        ),
        isTurnover: true,
        turnoverType: "interception",
        isSack: false,
        isIncomplete: false,
        isTouchdown: false,
        isBigPlay: false,
        animationType: "turnover",
      };
    } else if (baseOutcome === "SACK") {
      baseYards = -8;
      finalYards = Math.round(baseYards * timeAccelerant);
      outcome = {
        yards: finalYards,
        description: randomChoice(OUTCOME_DESCRIPTIONS.sack ?? ["Sacked!"]),
        isTurnover: false,
        isSack: true,
        isIncomplete: false,
        isTouchdown: false,
        isBigPlay: false,
        animationType: "sack",
      };
    } else if (baseOutcome === "INC") {
      outcome = {
        yards: 0,
        description: randomChoice(
          OUTCOME_DESCRIPTIONS.incomplete ?? ["Incomplete!"],
        ),
        isTurnover: false,
        isSack: false,
        isIncomplete: true,
        isTouchdown: false,
        isBigPlay: false,
        animationType: "incomplete",
      };
    } else {
      // Numeric yards
      baseYards = baseOutcome as number;
      finalYards = Math.round(baseYards * timeAccelerant);

      // Determine description based on yards
      let descType: string;
      let animType: PlayOutcome["animationType"];

      if (finalYards >= 20) {
        descType = "bigGain";
        animType = "gain";
      } else if (finalYards >= 8) {
        descType = "moderateGain";
        animType = "gain";
      } else if (finalYards > 0) {
        descType = "smallGain";
        animType = "gain";
      } else if (finalYards === 0) {
        descType = "noGain";
        animType = "incomplete";
      } else {
        descType = "loss";
        animType = "loss";
      }

      outcome = {
        yards: finalYards,
        description: randomChoice(
          OUTCOME_DESCRIPTIONS[
            descType as keyof typeof OUTCOME_DESCRIPTIONS
          ] ?? ["Play complete."],
        ),
        isTurnover: false,
        isSack: false,
        isIncomplete: false,
        isTouchdown: false,
        isBigPlay: finalYards >= 20,
        animationType: animType,
      };
    }

    // Calculate new game state
    const newState = updateGameState(currentState, outcome);

    // Check for touchdown
    if (newState.ballPosition >= 100 || newState.ballPosition <= 0) {
      outcome.isTouchdown = true;
      outcome.description = randomChoice(
        OUTCOME_DESCRIPTIONS.touchdown ?? ["Touchdown!"],
      );
      outcome.animationType = "touchdown";
    }

    return {
      outcome,
      newGameState: newState,
      offenseWon,
      defenseWon,
      timeAccelerant,
      baseYards,
      finalYards,
    };
  };

  /**
   * Update game state after a play
   */
  const updateGameState = (
    currentState: GameState,
    outcome: PlayOutcome,
  ): GameState => {
    const newState = { ...currentState };

    if (outcome.isTurnover) {
      // Turnover - flip possession, ball stays at current position
      newState.possession =
        currentState.possession === "home" ? "away" : "home";
      newState.down = 1;
      newState.yardsToGo = 10;
      // Mark possession
      if (newState.possession === "home") {
        newState.homeHasPossessed = true;
      } else {
        newState.awayHasPossessed = true;
      }
    } else {
      // Move the ball
      const direction = currentState.possession === "home" ? 1 : -1;
      newState.ballPosition = Math.max(
        0,
        Math.min(100, currentState.ballPosition + outcome.yards * direction),
      );

      // Update downs
      if (outcome.isIncomplete || outcome.yards <= 0) {
        // No forward progress
        newState.down = currentState.down + 1;
      } else if (outcome.yards >= currentState.yardsToGo) {
        // First down!
        newState.down = 1;
        newState.yardsToGo = 10;
      } else {
        // Partial progress
        newState.down = currentState.down + 1;
        newState.yardsToGo = currentState.yardsToGo - outcome.yards;
      }

      // Check for turnover on downs
      if (newState.down > 4) {
        newState.possession =
          currentState.possession === "home" ? "away" : "home";
        newState.down = 1;
        newState.yardsToGo = 10;
        if (newState.possession === "home") {
          newState.homeHasPossessed = true;
        } else {
          newState.awayHasPossessed = true;
        }
      }

      // Check for safety
      if (
        (currentState.possession === "home" && newState.ballPosition <= 0) ||
        (currentState.possession === "away" && newState.ballPosition >= 100)
      ) {
        // Safety! Other team scores 2
        if (currentState.possession === "home") {
          newState.awayScore += 2;
        } else {
          newState.homeScore += 2;
        }
        // Flip possession to 25 yard line
        newState.possession =
          currentState.possession === "home" ? "away" : "home";
        newState.ballPosition = newState.possession === "home" ? 25 : 75;
        newState.down = 1;
        newState.yardsToGo = 10;
      }
    }

    return newState;
  };

  /**
   * Score a touchdown and reset for next possession
   */
  const scoreTouchdown = (state: GameState): GameState => {
    const newState = { ...state };

    // Add 7 points (TD + extra point assumed)
    if (state.possession === "home") {
      newState.homeScore += 7;
    } else {
      newState.awayScore += 7;
    }

    // Flip possession to 25 yard line
    newState.possession = state.possession === "home" ? "away" : "home";
    newState.ballPosition = newState.possession === "home" ? 25 : 75;
    newState.down = 1;
    newState.yardsToGo = 10;

    // Mark possession
    if (newState.possession === "home") {
      newState.homeHasPossessed = true;
    } else {
      newState.awayHasPossessed = true;
    }

    return newState;
  };

  /**
   * Score a field goal and reset for next possession
   */
  const scoreFieldGoal = (state: GameState): GameState => {
    const newState = { ...state };

    // Add 3 points
    if (state.possession === "home") {
      newState.homeScore += 3;
    } else {
      newState.awayScore += 3;
    }

    // Flip possession to 25 yard line
    newState.possession = state.possession === "home" ? "away" : "home";
    newState.ballPosition = newState.possession === "home" ? 25 : 75;
    newState.down = 1;
    newState.yardsToGo = 10;

    return newState;
  };

  /**
   * Deduct time from clock based on play duration
   */
  const deductClock = (
    state: GameState,
    offenseMs: number,
    defenseMs: number,
  ): GameState => {
    const newState = { ...state };
    // Use max of both times, capped at 150 seconds
    const playDurationSeconds = Math.min(
      Math.max(offenseMs, defenseMs) / 1000,
      150,
    );
    newState.clockSeconds = Math.max(
      0,
      state.clockSeconds - playDurationSeconds,
    );
    return newState;
  };

  /**
   * Check if game is over
   */
  const isGameOver = (state: GameState): boolean => {
    // Game over when clock expires AND both teams have possessed
    return (
      state.clockSeconds <= 0 &&
      state.homeHasPossessed &&
      state.awayHasPossessed
    );
  };

  /**
   * Get play risk/reward description
   */
  const getPlayDescription = (play: OffensePlay | DefensePlay): string => {
    const descriptions: Record<string, string> = {
      run: "Run - Low risk, steady gains. Must get right answer to advance.",
      pass: "Pass - Medium risk, medium reward. Sack risk if wrong vs blitz.",
      deep: "Deep Throw - High risk, huge reward. Must be correct or risk INT.",
      blitz:
        "Blitz - Aggressive. Stops run, big sack potential, but exposed to deep.",
      cover2: "Cover-2 - Balanced. Solid against pass, moderate vs run.",
      prevent:
        "Prevent - Conservative. Limits big plays, weak against the run.",
    };
    return descriptions[play] || play;
  };

  /**
   * Create initial game state
   */
  const createInitialState = (
    startingPossession: "home" | "away",
  ): GameState => {
    return {
      homeScore: 0,
      awayScore: 0,
      possession: startingPossession,
      ballPosition: startingPossession === "home" ? 25 : 75,
      down: 1,
      yardsToGo: 10,
      clockSeconds: 1800, // 30 minutes
      homeHasPossessed: startingPossession === "home",
      awayHasPossessed: startingPossession === "away",
      isOvertime: true,
      quarter: 5, // Overtime
    };
  };

  /**
   * Format clock for display
   */
  const formatClock = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Get down and distance string
   */
  const getDownAndDistance = (state: GameState): string => {
    const ordinals = ["", "1st", "2nd", "3rd", "4th"];
    const down = ordinals[state.down] || `${state.down}th`;

    // Calculate yards to goal
    const yardsToGoal =
      state.possession === "home"
        ? 100 - state.ballPosition
        : state.ballPosition;

    if (state.yardsToGo >= yardsToGoal) {
      return `${down} & Goal`;
    }
    return `${down} & ${state.yardsToGo}`;
  };

  /**
   * Get field position string
   */
  const getFieldPosition = (state: GameState): string => {
    const position = state.ballPosition;

    if (position === 50) return "the 50";
    if (position < 50) {
      // Home side
      return `OWN ${position}`;
    } else {
      // Away side
      return `OPP ${100 - position}`;
    }
  };

  return {
    calculatePlayOutcome,
    getAnswerTier,
    calculateTimeAccelerant,
    scoreTouchdown,
    scoreFieldGoal,
    deductClock,
    isGameOver,
    getPlayDescription,
    createInitialState,
    formatClock,
    getDownAndDistance,
    getFieldPosition,
    updateGameState,
  };
}
