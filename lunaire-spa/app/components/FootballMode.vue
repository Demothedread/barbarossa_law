<template>
  <div class="football-mode">
    <!-- Intro Screen -->
    <Transition name="fade">
      <div v-if="gamePhase === 'intro'" class="intro-screen" @click="skipIntro">
        <div class="stars-bg"></div>
        <div class="intro-content">
          <div class="football-logo">
            <div class="helmet">🏈</div>
            <h1 class="title">BAR EXAM</h1>
            <h2 class="subtitle">OVERTIME</h2>
          </div>

          <div class="game-info">
            <p>Two players. One question at a time.</p>
            <p><strong>30 minutes</strong> of overtime football.</p>
            <p>Choose your plays. Answer correctly. Move the ball.</p>
          </div>

          <div class="mode-selection">
            <h3>Select Opponent</h3>
            <div class="opponent-options">
              <button
                class="opponent-btn"
                :class="{ active: opponentType === 'ai' }"
                @click.stop="opponentType = 'ai'"
              >
                <span class="icon">🤖</span>
                <span class="label">vs AI</span>
              </button>
              <button
                class="opponent-btn disabled"
                :class="{ active: opponentType === 'human' }"
                @click.stop="showComingSoon"
                disabled
              >
                <span class="icon">👥</span>
                <span class="label">vs Human</span>
                <span class="badge">Coming Soon</span>
              </button>
            </div>
          </div>

          <div v-if="opponentType === 'ai'" class="difficulty-selection">
            <h3>AI Difficulty</h3>
            <div class="difficulty-options">
              <button
                v-for="d in difficulties"
                :key="d.value"
                class="difficulty-btn"
                :class="{ active: aiDifficulty === d.value }"
                @click.stop="aiDifficulty = d.value"
              >
                <span class="name">{{ d.name }}</span>
                <span class="desc">{{ d.desc }}</span>
              </button>
            </div>
          </div>

          <button class="kickoff-btn" @click.stop="startGame">
            🏈 KICK OFF!
          </button>
          <div class="skip-hint">Press SPACE to start</div>
        </div>
      </div>
    </Transition>

    <!-- Coin Toss / Rule Question Speed Round -->
    <Transition name="fade">
      <div v-if="gamePhase === 'coin_toss'" class="coin-toss-screen">
        <div class="coin-toss-content">
          <h2>⚡ SPEED ROUND ⚡</h2>
          <p class="instruction">
            First correct answer chooses offense or defense!
          </p>

          <div class="speed-question" v-if="coinTossQuestion">
            <div class="question-text">{{ coinTossQuestion.question }}</div>
            <div class="answer-grid">
              <button
                v-for="choice in coinTossChoices"
                :key="choice.letter"
                class="speed-choice"
                :class="{
                  selected: coinTossAnswer === choice.letter,
                  disabled: coinTossSubmitted,
                }"
                :disabled="coinTossSubmitted"
                @click="selectCoinTossAnswer(choice.letter)"
              >
                <span class="letter">{{ choice.letter }}</span>
                <span class="text">{{ choice.text }}</span>
              </button>
            </div>

            <button
              v-if="coinTossAnswer && !coinTossSubmitted"
              class="submit-speed-btn"
              @click="submitCoinToss"
            >
              LOCK IN!
            </button>

            <div v-if="coinTossSubmitted" class="waiting-opponent">
              <div class="spinner"></div>
              <span>Waiting for opponent...</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Coin Toss Result -->
    <Transition name="fade">
      <div v-if="gamePhase === 'coin_toss_result'" class="coin-result-screen">
        <div class="result-content">
          <h2>
            {{ coinTossWinner === "player" ? "🎉 YOU WON!" : "😤 AI WINS!" }}
          </h2>
          <p class="result-detail">{{ coinTossResultMessage }}</p>

          <div v-if="coinTossWinner === 'player'" class="choice-buttons">
            <button
              class="choice-btn offense"
              @click="chooseStarting('offense')"
            >
              <span class="icon">⚔️</span>
              <span>START ON OFFENSE</span>
            </button>
            <button
              class="choice-btn defense"
              @click="chooseStarting('defense')"
            >
              <span class="icon">🛡️</span>
              <span>START ON DEFENSE</span>
            </button>
          </div>

          <div v-else class="ai-choosing">
            <p>AI is choosing...</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Main Game Interface -->
    <div v-if="gamePhase === 'playing'" class="game-interface">
      <!-- Scoreboard Header -->
      <div class="scoreboard">
        <div
          class="team home"
          :class="{ possession: gameState.possession === 'home' }"
        >
          <span class="icon">{{ playerIcon }}</span>
          <span class="name">YOU</span>
          <span class="score">{{ gameState.homeScore }}</span>
        </div>
        <div class="game-info">
          <div class="clock">{{ formatClock(gameState.clockSeconds) }}</div>
          <div class="quarter">OT</div>
        </div>
        <div
          class="team away"
          :class="{ possession: gameState.possession === 'away' }"
        >
          <span class="score">{{ gameState.awayScore }}</span>
          <span class="name">{{ opponentName }}</span>
          <span class="icon">{{ opponentIcon }}</span>
        </div>
      </div>

      <!-- Field Visualization -->
      <div class="field-container">
        <div class="field">
          <div class="endzone home-endzone">
            <span>END ZONE</span>
          </div>
          <div class="yard-markers">
            <div
              v-for="yard in [10, 20, 30, 40, 50, 40, 30, 20, 10]"
              :key="yard"
              class="yard-line"
            >
              <span>{{ yard }}</span>
            </div>
          </div>
          <div class="endzone away-endzone">
            <span>END ZONE</span>
          </div>

          <!-- Ball marker -->
          <div
            class="ball-marker"
            :style="{ left: `${gameState.ballPosition}%` }"
          >
            🏈
          </div>

          <!-- First down marker -->
          <div
            v-if="firstDownMarker !== null"
            class="first-down-marker"
            :style="{ left: `${firstDownMarker}%` }"
          ></div>
        </div>
      </div>

      <!-- Down & Distance -->
      <div class="situation">
        <span class="down-distance">{{ getDownAndDistance(gameState) }}</span>
        <span class="field-pos">at {{ getFieldPosition(gameState) }}</span>
        <span class="possession-indicator">
          {{ isPlayerOnOffense ? "⚔️ Your ball" : "🛡️ Defense" }}
        </span>
      </div>

      <!-- Play Selection Phase -->
      <div v-if="playPhase === 'select_play'" class="play-selection">
        <h3>
          {{ isPlayerOnOffense ? "CHOOSE YOUR PLAY" : "CHOOSE YOUR DEFENSE" }}
        </h3>
        <p class="subject-hint">
          Subject: <strong>{{ currentQuestion?.subject || "General" }}</strong>
        </p>

        <div class="play-options">
          <template v-if="isPlayerOnOffense">
            <button
              v-for="play in offensePlays"
              :key="play.value"
              class="play-btn"
              :class="{ selected: selectedPlay === play.value }"
              @click="selectPlay(play.value)"
            >
              <span class="play-icon">{{ play.icon }}</span>
              <span class="play-name">{{ play.name }}</span>
              <span class="play-desc">{{ play.desc }}</span>
            </button>
          </template>
          <template v-else>
            <button
              v-for="play in defensePlays"
              :key="play.value"
              class="play-btn"
              :class="{ selected: selectedPlay === play.value }"
              @click="selectPlay(play.value)"
            >
              <span class="play-icon">{{ play.icon }}</span>
              <span class="play-name">{{ play.name }}</span>
              <span class="play-desc">{{ play.desc }}</span>
            </button>
          </template>
        </div>

        <button
          v-if="selectedPlay"
          class="confirm-play-btn"
          @click="confirmPlay"
        >
          CONFIRM PLAY
        </button>
      </div>

      <!-- Question Phase -->
      <div v-if="playPhase === 'question'" class="question-phase">
        <div class="play-badges">
          <span class="your-play"
            >Your play: {{ selectedPlay?.toUpperCase() }}</span
          >
          <span v-if="opponentSubmitted" class="opponent-status"
            >✓ Opponent submitted</span
          >
          <span v-else class="opponent-status waiting"
            >⏳ Opponent thinking...</span
          >
        </div>

        <div class="question-card" v-if="currentQuestion">
          <div v-if="currentQuestion.prompt" class="question-prompt">
            {{ currentQuestion.prompt }}
          </div>
          <div class="question-text">{{ currentQuestion.question }}</div>
        </div>

        <div class="answer-choices">
          <button
            v-for="choice in questionChoices"
            :key="choice.letter"
            class="answer-btn"
            :class="{
              selected: selectedAnswer === choice.letter,
              disabled: playerSubmitted,
            }"
            :disabled="playerSubmitted"
            @click="selectAnswer(choice.letter)"
          >
            <span class="letter">{{ choice.letter }}</span>
            <span class="text">{{ choice.text }}</span>
          </button>
        </div>

        <div class="timer-bar">
          <div class="timer-fill" :style="{ width: `${timerPercent}%` }"></div>
          <span class="timer-text"
            >{{ Math.ceil(questionTimeRemaining / 1000) }}s</span
          >
        </div>

        <button
          v-if="selectedAnswer && !playerSubmitted"
          class="submit-answer-btn"
          @click="submitAnswer"
        >
          🏈 SNAP IT!
        </button>

        <div
          v-if="playerSubmitted && !opponentSubmitted"
          class="waiting-message"
        >
          <div class="spinner"></div>
          <span>Answer locked! Waiting for opponent...</span>
        </div>
      </div>

      <!-- Result Phase -->
      <div v-if="playPhase === 'result'" class="result-phase">
        <div class="result-reveal">
          <div class="play-comparison">
            <div class="player-play">
              <span class="label"
                >Your {{ isPlayerOnOffense ? "Play" : "Defense" }}</span
              >
              <span class="value">{{ selectedPlay?.toUpperCase() }}</span>
            </div>
            <div class="vs">VS</div>
            <div class="opponent-play">
              <span class="label"
                >Opponent {{ !isPlayerOnOffense ? "Play" : "Defense" }}</span
              >
              <span class="value">{{ opponentPlay?.toUpperCase() }}</span>
            </div>
          </div>

          <div class="answer-comparison">
            <div class="player-answer" :class="playerAnswerClass">
              <span class="label">Your Answer</span>
              <span class="value"
                >{{ selectedAnswer }} -
                {{ playerAnswerTier?.toUpperCase() }}</span
              >
            </div>
            <div class="opponent-answer" :class="opponentAnswerClass">
              <span class="label">Opponent</span>
              <span class="value"
                >{{ opponentAnswer }} -
                {{ opponentAnswerTier?.toUpperCase() }}</span
              >
            </div>
          </div>

          <div class="correct-answer">
            Correct: <strong>{{ currentQuestion?.answer }}</strong>
          </div>

          <div class="outcome-display" :class="outcomeClass">
            <div class="outcome-icon">{{ outcomeIcon }}</div>
            <div class="outcome-text">{{ lastOutcome?.description }}</div>
            <div
              class="yards-gained"
              v-if="
                lastOutcome &&
                !lastOutcome.isTurnover &&
                !lastOutcome.isIncomplete
              "
            >
              {{ lastOutcome.yards > 0 ? "+" : ""
              }}{{ lastOutcome.yards }} yards
            </div>
          </div>
        </div>

        <button class="next-play-btn" @click="nextPlay">NEXT PLAY →</button>
      </div>
    </div>

    <!-- Scoring Animation -->
    <Transition name="zoom">
      <div v-if="showScoringAnimation" class="scoring-overlay">
        <div class="scoring-content">
          <div class="scoring-type">{{ scoringType }}</div>
          <div class="scoring-team">{{ scoringTeam }}</div>
        </div>
      </div>
    </Transition>

    <!-- Game Over Screen -->
    <Transition name="fade">
      <div v-if="gamePhase === 'game_over'" class="game-over-screen">
        <div class="game-over-content">
          <h1 class="final-result">{{ finalResultMessage }}</h1>

          <div class="final-score">
            <div class="team">
              <span class="name">YOU</span>
              <span class="score">{{ gameState.homeScore }}</span>
            </div>
            <div class="divider">-</div>
            <div class="team">
              <span class="score">{{ gameState.awayScore }}</span>
              <span class="name">{{ opponentName }}</span>
            </div>
          </div>

          <div class="game-stats">
            <div class="stat">
              <span class="label">Questions Answered</span>
              <span class="value">{{ totalQuestionsAnswered }}</span>
            </div>
            <div class="stat">
              <span class="label">Correct Answers</span>
              <span class="value">{{ correctAnswers }}</span>
            </div>
            <div class="stat">
              <span class="label">Accuracy</span>
              <span class="value">{{ accuracyPercent }}%</span>
            </div>
          </div>

          <div class="game-over-actions">
            <button class="btn btn--primary" @click="viewReview">
              View Detailed Results
            </button>
            <button class="btn btn--secondary" @click="playAgain">
              Play Again
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useFootballAI, type AIDifficulty } from "~/composables/useFootballAI";
import {
  useFootballScoring,
  type AnswerTier,
  type DefensePlay,
  type GameState,
  type OffensePlay,
  type PlayOutcome,
} from "~/composables/useFootballScoring";
import { useGameAudio } from "~/composables/useGameAudio";
import type { Question } from "~/stores/quiz";

const props = defineProps<{
  questions: Question[];
}>();

const emit = defineEmits<{
  complete: [result: any];
  restart: [];
}>();

const {
  calculatePlayOutcome,
  getAnswerTier,
  scoreTouchdown,
  deductClock,
  isGameOver,
  createInitialState,
  formatClock,
  getDownAndDistance,
  getFieldPosition,
} = useFootballScoring();

const { getAIDecision, simulateAISubmission, getAIName } = useFootballAI();

const { playSound } = useGameAudio();

// Game phases
type GamePhase =
  | "intro"
  | "coin_toss"
  | "coin_toss_result"
  | "playing"
  | "rule_bonus"
  | "game_over";
type PlayPhase = "select_play" | "question" | "result" | "waiting";

const gamePhase = ref<GamePhase>("intro");
const playPhase = ref<PlayPhase>("select_play");

// Settings
const opponentType = ref<"ai" | "human">("ai");
const aiDifficulty = ref<AIDifficulty>("medium");

const difficulties = [
  { value: "easy" as AIDifficulty, name: "Rookie", desc: "Learning the rules" },
  {
    value: "medium" as AIDifficulty,
    name: "Veteran",
    desc: "Solid fundamentals",
  },
  { value: "hard" as AIDifficulty, name: "All-Pro", desc: "Fast & accurate" },
];

// Game state
const gameState = ref<GameState>(createInitialState("home"));
const questionIndex = ref(0);
const currentQuestion = ref<Question | null>(null);

// Coin toss
const coinTossQuestion = ref<Question | null>(null);
const coinTossAnswer = ref<string | null>(null);
const coinTossSubmitted = ref(false);
const coinTossWinner = ref<"player" | "ai" | null>(null);
const coinTossResultMessage = ref("");
const coinTossStartTime = ref(0);
const coinTossPlayerTime = ref(0);
const coinTossAITime = ref(0);

// Play selection
const selectedPlay = ref<OffensePlay | DefensePlay | null>(null);
const opponentPlay = ref<OffensePlay | DefensePlay | null>(null);

// Question answering
const selectedAnswer = ref<string | null>(null);
const opponentAnswer = ref<string | null>(null);
const playerSubmitted = ref(false);
const opponentSubmitted = ref(false);
const questionStartTime = ref(0);
const playerSubmitTime = ref(0);
const opponentSubmitTime = ref(0);
const playerAnswerTier = ref<AnswerTier | null>(null);
const opponentAnswerTier = ref<AnswerTier | null>(null);

// Timer
const questionTimeRemaining = ref(150000); // 150 seconds max
const timerInterval = ref<NodeJS.Timeout | null>(null);

// Result
const lastOutcome = ref<PlayOutcome | null>(null);

// Scoring animation
const showScoringAnimation = ref(false);
const scoringType = ref("");
const scoringTeam = ref("");

// Stats
const totalQuestionsAnswered = ref(0);
const correctAnswers = ref(0);
const playerAnswerHistory = ref<Array<{ correct: boolean; time: number }>>([]);

// Icons
const playerIcon = "👤";
const opponentIcon = computed(() =>
  opponentType.value === "ai" ? "🤖" : "👥",
);
const opponentName = computed(() =>
  opponentType.value === "ai" ? getAIName(aiDifficulty.value) : "Opponent",
);

// Plays
const offensePlays = [
  {
    value: "run" as OffensePlay,
    name: "RUN",
    icon: "🏃",
    desc: "Low risk, steady gains",
  },
  {
    value: "pass" as OffensePlay,
    name: "PASS",
    icon: "📡",
    desc: "Medium risk & reward",
  },
  {
    value: "deep" as OffensePlay,
    name: "DEEP THROW",
    icon: "🚀",
    desc: "High risk, big play",
  },
];

const defensePlays = [
  {
    value: "blitz" as DefensePlay,
    name: "BLITZ",
    icon: "⚡",
    desc: "Aggressive, stops run",
  },
  {
    value: "cover2" as DefensePlay,
    name: "COVER-2",
    icon: "🛡️",
    desc: "Balanced coverage",
  },
  {
    value: "prevent" as DefensePlay,
    name: "PREVENT",
    icon: "🏰",
    desc: "Limits big plays",
  },
];

// Computed
const isPlayerOnOffense = computed(() => gameState.value.possession === "home");

const firstDownMarker = computed(() => {
  if (gameState.value.possession === "home") {
    return Math.min(
      100,
      gameState.value.ballPosition + gameState.value.yardsToGo,
    );
  } else {
    return Math.max(
      0,
      gameState.value.ballPosition - gameState.value.yardsToGo,
    );
  }
});

const timerPercent = computed(
  () => (questionTimeRemaining.value / 150000) * 100,
);

const coinTossChoices = computed(() => {
  if (!coinTossQuestion.value) return [];
  return [
    { letter: "A", text: coinTossQuestion.value.choice_a },
    { letter: "B", text: coinTossQuestion.value.choice_b },
    { letter: "C", text: coinTossQuestion.value.choice_c },
    { letter: "D", text: coinTossQuestion.value.choice_d },
  ];
});

const questionChoices = computed(() => {
  if (!currentQuestion.value) return [];
  return [
    { letter: "A", text: currentQuestion.value.choice_a },
    { letter: "B", text: currentQuestion.value.choice_b },
    { letter: "C", text: currentQuestion.value.choice_c },
    { letter: "D", text: currentQuestion.value.choice_d },
  ];
});

const playerAnswerClass = computed(() => {
  if (!playerAnswerTier.value) return "";
  return `answer-${playerAnswerTier.value}`;
});

const opponentAnswerClass = computed(() => {
  if (!opponentAnswerTier.value) return "";
  return `answer-${opponentAnswerTier.value}`;
});

const outcomeClass = computed(() => {
  if (!lastOutcome.value) return "";
  if (lastOutcome.value.isTouchdown) return "touchdown";
  if (lastOutcome.value.isTurnover) return "turnover";
  if (lastOutcome.value.isBigPlay) return "big-play";
  if (lastOutcome.value.yards > 0) return "gain";
  if (lastOutcome.value.yards < 0) return "loss";
  return "neutral";
});

const outcomeIcon = computed(() => {
  if (!lastOutcome.value) return "";
  if (lastOutcome.value.isTouchdown) return "🎉";
  if (lastOutcome.value.isTurnover) return "😱";
  if (lastOutcome.value.isBigPlay) return "💥";
  if (lastOutcome.value.yards > 0) return "✓";
  if (lastOutcome.value.yards < 0) return "✗";
  return "•";
});

const finalResultMessage = computed(() => {
  if (gameState.value.homeScore > gameState.value.awayScore) {
    return "🏆 VICTORY! 🏆";
  } else if (gameState.value.homeScore < gameState.value.awayScore) {
    return "DEFEAT";
  }
  return "IT'S A TIE";
});

const accuracyPercent = computed(() => {
  if (totalQuestionsAnswered.value === 0) return 0;
  return Math.round(
    (correctAnswers.value / totalQuestionsAnswered.value) * 100,
  );
});

// Methods
const skipIntro = () => {
  startGame();
};

const showComingSoon = () => {
  // Could show a toast here
};

const startGame = () => {
  // playSound('intro');

  // Set up coin toss question
  coinTossQuestion.value = props.questions[0] ?? null;
  questionIndex.value = 1;

  gamePhase.value = "coin_toss";
  coinTossStartTime.value = Date.now();

  // Start AI coin toss
  if (opponentType.value === "ai") {
    startAICoinToss();
  }
};

const startAICoinToss = async () => {
  if (!coinTossQuestion.value) return;

  const decision = await getAIDecision(
    {
      down: 1,
      yardsToGo: 10,
      ballPosition: 50,
      clockSeconds: 1800,
      scoreDifferential: 0,
      isOnOffense: true,
    },
    aiDifficulty.value,
    coinTossQuestion.value.answer,
    null, // No second best for speed round
    ["A", "B", "C", "D"],
  );

  // Simulate AI thinking
  await simulateAISubmission(decision.thinkingTimeMs);

  coinTossAITime.value = decision.thinkingTimeMs;

  // Check if player already submitted
  if (coinTossSubmitted.value) {
    resolveCoinToss(decision.answerChoice);
  } else {
    // AI submitted first, wait for player
    opponentSubmitted.value = true;
  }
};

const selectCoinTossAnswer = (letter: string) => {
  if (coinTossSubmitted.value) return;
  coinTossAnswer.value = letter;
};

const submitCoinToss = () => {
  if (!coinTossAnswer.value || coinTossSubmitted.value) return;

  coinTossSubmitted.value = true;
  coinTossPlayerTime.value = Date.now() - coinTossStartTime.value;

  // Check if AI already submitted
  if (opponentSubmitted.value) {
    // We need the AI answer - get it again
    if (coinTossQuestion.value) {
      const aiAnswer =
        coinTossAnswer.value === coinTossQuestion.value.answer
          ? "B"
          : coinTossQuestion.value.answer;
      resolveCoinToss(aiAnswer);
    }
  }
};

const resolveCoinToss = (aiAnswer: string) => {
  if (!coinTossQuestion.value) return;

  const correctAnswer = coinTossQuestion.value.answer;
  const playerCorrect = coinTossAnswer.value === correctAnswer;
  const aiCorrect = aiAnswer === correctAnswer;

  if (playerCorrect && !aiCorrect) {
    coinTossWinner.value = "player";
    coinTossResultMessage.value = "You answered correctly first!";
  } else if (!playerCorrect && aiCorrect) {
    coinTossWinner.value = "ai";
    coinTossResultMessage.value = "AI answered correctly!";
  } else if (playerCorrect && aiCorrect) {
    // Both correct - faster wins
    if (coinTossPlayerTime.value < coinTossAITime.value) {
      coinTossWinner.value = "player";
      coinTossResultMessage.value = `Both correct, but you were ${Math.round((coinTossAITime.value - coinTossPlayerTime.value) / 1000)}s faster!`;
    } else {
      coinTossWinner.value = "ai";
      coinTossResultMessage.value = `Both correct, but AI was ${Math.round((coinTossPlayerTime.value - coinTossAITime.value) / 1000)}s faster!`;
    }
  } else {
    // Neither correct - random
    coinTossWinner.value = Math.random() < 0.5 ? "player" : "ai";
    coinTossResultMessage.value =
      "Neither answered correctly - coin flip decides!";
  }

  gamePhase.value = "coin_toss_result";

  // If AI won, have them choose after delay
  if (coinTossWinner.value === "ai") {
    setTimeout(() => {
      // AI prefers offense on medium/hard, defense on easy
      const aiChoice = aiDifficulty.value === "easy" ? "defense" : "offense";
      startMainGame(aiChoice === "offense" ? "away" : "home");
    }, 2000);
  }
};

const chooseStarting = (choice: "offense" | "defense") => {
  startMainGame(choice === "offense" ? "home" : "away");
};

const startMainGame = (startingPossession: "home" | "away") => {
  gameState.value = createInitialState(startingPossession);
  gamePhase.value = "playing";
  playPhase.value = "select_play";
  loadNextQuestion();
};

const loadNextQuestion = () => {
  if (questionIndex.value >= props.questions.length) {
    // Wrap around if we run out
    questionIndex.value = 0;
  }
  currentQuestion.value = props.questions[questionIndex.value] ?? null;
  questionIndex.value++;
};

const selectPlay = (play: OffensePlay | DefensePlay) => {
  selectedPlay.value = play;
  playSound("click");
};

const confirmPlay = () => {
  if (!selectedPlay.value) return;

  playPhase.value = "question";
  questionStartTime.value = Date.now();
  questionTimeRemaining.value = 150000;
  playerSubmitted.value = false;
  opponentSubmitted.value = false;
  selectedAnswer.value = null;
  opponentAnswer.value = null;

  startQuestionTimer();

  // Start AI decision
  if (opponentType.value === "ai") {
    startAIPlay();
  }
};

const startQuestionTimer = () => {
  if (timerInterval.value) clearInterval(timerInterval.value);

  timerInterval.value = setInterval(() => {
    questionTimeRemaining.value = Math.max(
      0,
      150000 - (Date.now() - questionStartTime.value),
    );

    if (questionTimeRemaining.value <= 0) {
      // Time's up - auto submit
      if (!playerSubmitted.value) {
        submitAnswer();
      }
    }
  }, 100);
};

const startAIPlay = async () => {
  if (!currentQuestion.value) return;

  const situation = {
    down: gameState.value.down,
    yardsToGo: gameState.value.yardsToGo,
    ballPosition: gameState.value.ballPosition,
    clockSeconds: gameState.value.clockSeconds,
    scoreDifferential: gameState.value.awayScore - gameState.value.homeScore,
    isOnOffense: !isPlayerOnOffense.value,
  };

  const decision = await getAIDecision(
    situation,
    aiDifficulty.value,
    currentQuestion.value.answer,
    null, // TODO: Get second best from API
    ["A", "B", "C", "D"],
  );

  opponentPlay.value = decision.play;

  // Simulate AI thinking
  const actualTime = await simulateAISubmission(decision.thinkingTimeMs);

  opponentAnswer.value = decision.answerChoice;
  opponentAnswerTier.value = decision.answerTier;
  opponentSubmitTime.value = actualTime;
  opponentSubmitted.value = true;

  // Check if both submitted
  if (playerSubmitted.value) {
    resolvePlay();
  }
};

const selectAnswer = (letter: string) => {
  if (playerSubmitted.value) return;
  selectedAnswer.value = letter;
  playSound("click");
};

const submitAnswer = () => {
  if (playerSubmitted.value) return;

  playerSubmitted.value = true;
  playerSubmitTime.value = Date.now() - questionStartTime.value;

  if (!selectedAnswer.value) {
    selectedAnswer.value = "A"; // Default if timed out
  }

  // Determine player answer tier
  if (currentQuestion.value) {
    playerAnswerTier.value = getAnswerTier(
      selectedAnswer.value,
      currentQuestion.value.answer,
      null, // TODO: Get second best
    );

    totalQuestionsAnswered.value++;
    if (selectedAnswer.value === currentQuestion.value.answer) {
      correctAnswers.value++;
    }

    playerAnswerHistory.value.push({
      correct: selectedAnswer.value === currentQuestion.value.answer,
      time: playerSubmitTime.value,
    });
  }

  playSound("click");

  // Check if both submitted
  if (opponentSubmitted.value) {
    resolvePlay();
  }
};

const resolvePlay = () => {
  if (timerInterval.value) clearInterval(timerInterval.value);

  if (!currentQuestion.value || !selectedPlay.value) return;

  // Calculate outcome
  const offensePlay = isPlayerOnOffense.value
    ? (selectedPlay.value as OffensePlay)
    : (opponentPlay.value as OffensePlay);
  const defensePlay = isPlayerOnOffense.value
    ? (opponentPlay.value as DefensePlay)
    : (selectedPlay.value as DefensePlay);
  const offenseAnswer = isPlayerOnOffense.value
    ? playerAnswerTier.value!
    : opponentAnswerTier.value!;
  const defenseAnswer = isPlayerOnOffense.value
    ? opponentAnswerTier.value!
    : playerAnswerTier.value!;
  const offenseTime = isPlayerOnOffense.value
    ? playerSubmitTime.value
    : opponentSubmitTime.value;
  const defenseTime = isPlayerOnOffense.value
    ? opponentSubmitTime.value
    : playerSubmitTime.value;

  const result = calculatePlayOutcome(
    offensePlay,
    defensePlay,
    offenseAnswer,
    defenseAnswer,
    offenseTime,
    defenseTime,
    gameState.value,
  );

  lastOutcome.value = result.outcome;

  // Deduct clock
  gameState.value = deductClock(
    result.newGameState,
    playerSubmitTime.value,
    opponentSubmitTime.value,
  );

  // Check for touchdown
  if (result.outcome.isTouchdown) {
    const scoringTeamIsHome = gameState.value.possession === "home";
    gameState.value = scoreTouchdown(gameState.value);

    // Show scoring animation
    scoringType.value = "TOUCHDOWN!";
    scoringTeam.value = scoringTeamIsHome
      ? "YOU SCORED!"
      : `${opponentName.value} SCORES`;
    showScoringAnimation.value = true;

    setTimeout(() => {
      showScoringAnimation.value = false;
    }, 3000);
  }

  playPhase.value = "result";

  // Play appropriate sound
  if (result.outcome.isTouchdown) {
    playSound("winner");
  } else if (result.outcome.isTurnover) {
    playSound("wrong");
  } else if (result.outcome.isBigPlay) {
    playSound("correct");
  }
};

const nextPlay = () => {
  // Check if game is over
  if (isGameOver(gameState.value)) {
    gamePhase.value = "game_over";
    return;
  }

  // Reset for next play
  selectedPlay.value = null;
  opponentPlay.value = null;
  selectedAnswer.value = null;
  opponentAnswer.value = null;
  playerSubmitted.value = false;
  opponentSubmitted.value = false;
  playerAnswerTier.value = null;
  opponentAnswerTier.value = null;
  lastOutcome.value = null;

  loadNextQuestion();
  playPhase.value = "select_play";
};

const viewReview = () => {
  emit("complete", {
    score: gameState.value.homeScore,
    total: totalQuestionsAnswered.value,
    opponentScore: gameState.value.awayScore,
    answers: playerAnswerHistory.value,
    accuracy: accuracyPercent.value,
  });
};

const playAgain = () => {
  emit("restart");
};

// Keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  if (gamePhase.value === "intro" && e.code === "Space") {
    e.preventDefault();
    startGame();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  if (timerInterval.value) clearInterval(timerInterval.value);
});
</script>

<style scoped>
.football-mode {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a2744 0%, #0d1520 100%);
  color: #fff;
  font-family: var(--font-body);
}

/* Intro Screen */
.intro-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #0a1628 0%, #1a2744 50%, #0d1520 100%);
  z-index: 100;
}

.stars-bg {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 20px 30px, #fff, transparent),
    radial-gradient(
      2px 2px at 40px 70px,
      rgba(255, 255, 255, 0.5),
      transparent
    ),
    radial-gradient(1px 1px at 90px 40px, #fff, transparent),
    radial-gradient(
      2px 2px at 160px 120px,
      rgba(255, 255, 255, 0.7),
      transparent
    );
  background-size: 200px 200px;
  animation: twinkle 4s infinite;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.intro-content {
  position: relative;
  text-align: center;
  padding: 40px;
  max-width: 600px;
}

.football-logo {
  margin-bottom: 30px;
}

.helmet {
  font-size: 64px;
  margin-bottom: 10px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.title {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: 4px;
  margin: 0;
  color: #f0c14b;
  text-shadow: 0 0 20px rgba(240, 193, 75, 0.5);
}

.subtitle {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 8px;
  margin: 0;
  color: #00ffc8;
}

.game-info {
  margin: 30px 0;
  font-size: 1.1rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);
}

.mode-selection,
.difficulty-selection {
  margin: 30px 0;
}

.mode-selection h3,
.difficulty-selection h3 {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 15px;
}

.opponent-options,
.difficulty-options {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.opponent-btn,
.difficulty-btn {
  padding: 20px 30px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.opponent-btn:hover:not(.disabled),
.difficulty-btn:hover {
  border-color: #00ffc8;
  background: rgba(0, 255, 200, 0.1);
}

.opponent-btn.active,
.difficulty-btn.active {
  border-color: #00ffc8;
  background: rgba(0, 255, 200, 0.2);
}

.opponent-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.opponent-btn .icon {
  font-size: 32px;
}

.opponent-btn .badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f0c14b;
  color: #000;
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.difficulty-btn .name {
  font-weight: 600;
  font-size: 1.1rem;
}

.difficulty-btn .desc {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.kickoff-btn {
  margin-top: 30px;
  padding: 18px 48px;
  font-size: 1.3rem;
  font-weight: 700;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #f0c14b 0%, #e6a700 100%);
  color: #000;
  cursor: pointer;
  transition: all 0.3s;
}

.kickoff-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(240, 193, 75, 0.5);
}

.skip-hint {
  margin-top: 20px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
}

/* Coin Toss Screen */
.coin-toss-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1a2744 0%, #0d1520 100%);
  z-index: 100;
}

.coin-toss-content {
  text-align: center;
  padding: 40px;
  max-width: 700px;
}

.coin-toss-content h2 {
  font-size: 2rem;
  color: #f0c14b;
  margin-bottom: 10px;
}

.instruction {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 30px;
}

.speed-question .question-text {
  font-size: 1.2rem;
  margin-bottom: 20px;
  line-height: 1.6;
}

.answer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.speed-choice {
  padding: 15px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  display: flex;
  gap: 10px;
}

.speed-choice:hover:not(.disabled) {
  border-color: #00ffc8;
}

.speed-choice.selected {
  border-color: #00ffc8;
  background: rgba(0, 255, 200, 0.2);
}

.speed-choice .letter {
  font-weight: 700;
  color: #00ffc8;
}

.submit-speed-btn {
  padding: 15px 40px;
  font-size: 1.1rem;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  background: #00ffc8;
  color: #000;
  cursor: pointer;
}

.waiting-opponent {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #00ffc8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Coin Result Screen */
.coin-result-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1a2744 0%, #0d1520 100%);
  z-index: 100;
}

.result-content {
  text-align: center;
  padding: 40px;
}

.result-content h2 {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.result-detail {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 30px;
}

.choice-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.choice-btn {
  padding: 30px 40px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.choice-btn .icon {
  font-size: 40px;
}

.choice-btn.offense:hover {
  border-color: #f0c14b;
  background: rgba(240, 193, 75, 0.2);
}

.choice-btn.defense:hover {
  border-color: #00ffc8;
  background: rgba(0, 255, 200, 0.2);
}

/* Game Interface */
.game-interface {
  padding: 20px;
}

.scoreboard {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  margin-bottom: 20px;
}

.scoreboard .team {
  display: flex;
  align-items: center;
  gap: 15px;
}

.scoreboard .team.possession {
  background: rgba(0, 255, 200, 0.1);
  padding: 10px 15px;
  border-radius: 8px;
}

.scoreboard .icon {
  font-size: 28px;
}

.scoreboard .name {
  font-weight: 600;
  font-size: 1.1rem;
}

.scoreboard .score {
  font-size: 2rem;
  font-weight: 800;
  color: #f0c14b;
}

.scoreboard .game-info {
  text-align: center;
}

.scoreboard .clock {
  font-size: 2rem;
  font-weight: 700;
  font-family: monospace;
}

.scoreboard .quarter {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Field */
.field-container {
  margin: 20px 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.field {
  position: relative;
  height: 80px;
  background: linear-gradient(90deg, #1a5a1a 0%, #2d7d2d 50%, #1a5a1a 100%);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
}

.endzone {
  width: 10%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.7rem;
  writing-mode: vertical-rl;
}

.home-endzone {
  background: rgba(0, 150, 255, 0.3);
}

.away-endzone {
  background: rgba(255, 100, 100, 0.3);
}

.yard-markers {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: relative;
}

.yard-line {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.ball-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  transition: left 0.5s ease;
  z-index: 10;
}

.first-down-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #f0c14b;
  transform: translateX(-50%);
}

/* Situation */
.situation {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 20px;
}

.down-distance {
  font-weight: 700;
  font-size: 1.2rem;
}

.field-pos {
  color: rgba(255, 255, 255, 0.7);
}

.possession-indicator {
  color: #00ffc8;
  font-weight: 600;
}

/* Play Selection */
.play-selection {
  text-align: center;
  padding: 30px;
}

.play-selection h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.subject-hint {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 25px;
}

.play-options {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 25px;
}

.play-btn {
  padding: 25px 30px;
  min-width: 180px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.play-btn:hover {
  border-color: #00ffc8;
  background: rgba(0, 255, 200, 0.1);
}

.play-btn.selected {
  border-color: #00ffc8;
  background: rgba(0, 255, 200, 0.2);
}

.play-icon {
  font-size: 32px;
}

.play-name {
  font-weight: 700;
  font-size: 1.1rem;
}

.play-desc {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.confirm-play-btn {
  padding: 15px 40px;
  font-size: 1.1rem;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  background: #00ffc8;
  color: #000;
  cursor: pointer;
  transition: all 0.3s;
}

.confirm-play-btn:hover {
  transform: scale(1.05);
}

/* Question Phase */
.question-phase {
  padding: 20px;
}

.play-badges {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.your-play {
  background: rgba(0, 255, 200, 0.2);
  padding: 8px 15px;
  border-radius: 20px;
  font-weight: 600;
}

.opponent-status {
  padding: 8px 15px;
  border-radius: 20px;
  color: #00ffc8;
}

.opponent-status.waiting {
  color: rgba(255, 255, 255, 0.5);
}

.question-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
}

.question-prompt {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15px;
  font-style: italic;
}

.question-text {
  font-size: 1.15rem;
  line-height: 1.6;
}

.answer-choices {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.answer-btn {
  padding: 18px 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  text-align: left;
}

.answer-btn:hover:not(.disabled) {
  border-color: rgba(255, 255, 255, 0.5);
}

.answer-btn.selected {
  border-color: #00ffc8;
  background: rgba(0, 255, 200, 0.15);
}

.answer-btn .letter {
  font-weight: 700;
  color: #00ffc8;
  min-width: 25px;
}

.timer-bar {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 20px;
  overflow: hidden;
}

.timer-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #00ffc8 0%, #f0c14b 50%, #ff6b6b 100%);
  transition: width 0.1s linear;
}

.timer-text {
  position: absolute;
  right: 10px;
  top: -20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.submit-answer-btn {
  width: 100%;
  padding: 18px;
  font-size: 1.2rem;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #f0c14b 0%, #e6a700 100%);
  color: #000;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-answer-btn:hover {
  transform: scale(1.02);
}

.waiting-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  color: rgba(255, 255, 255, 0.6);
}

/* Result Phase */
.result-phase {
  padding: 20px;
}

.result-reveal {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
}

.play-comparison,
.answer-comparison {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 20px;
}

.player-play,
.opponent-play,
.player-answer,
.opponent-answer {
  text-align: center;
}

.player-play .label,
.opponent-play .label,
.player-answer .label,
.opponent-answer .label {
  display: block;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 5px;
}

.player-play .value,
.opponent-play .value {
  font-size: 1.3rem;
  font-weight: 700;
}

.vs {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
}

.player-answer .value,
.opponent-answer .value {
  font-size: 1.1rem;
  font-weight: 600;
}

.answer-best .value {
  color: #00ffc8;
}
.answer-second .value {
  color: #f0c14b;
}
.answer-worst .value {
  color: #ff6b6b;
}

.correct-answer {
  text-align: center;
  padding: 10px;
  background: rgba(0, 255, 200, 0.1);
  border-radius: 8px;
  margin-bottom: 20px;
}

.outcome-display {
  text-align: center;
  padding: 25px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.outcome-display.touchdown {
  background: linear-gradient(
    135deg,
    rgba(240, 193, 75, 0.3) 0%,
    rgba(0, 255, 200, 0.2) 100%
  );
}

.outcome-display.turnover {
  background: rgba(255, 100, 100, 0.2);
}

.outcome-display.big-play {
  background: rgba(0, 255, 200, 0.2);
}

.outcome-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.outcome-text {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.yards-gained {
  font-size: 2rem;
  font-weight: 800;
  color: #00ffc8;
}

.next-play-btn {
  width: 100%;
  padding: 18px;
  font-size: 1.2rem;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  background: #00ffc8;
  color: #000;
  cursor: pointer;
}

/* Scoring Overlay */
.scoring-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 200;
}

.scoring-content {
  text-align: center;
  animation: scoreZoom 0.5s ease-out;
}

@keyframes scoreZoom {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.scoring-type {
  font-size: 4rem;
  font-weight: 900;
  color: #f0c14b;
  text-shadow: 0 0 50px rgba(240, 193, 75, 0.5);
}

.scoring-team {
  font-size: 2rem;
  color: #fff;
  margin-top: 15px;
}

/* Game Over Screen */
.game-over-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1a2744 0%, #0d1520 100%);
  z-index: 100;
}

.game-over-content {
  text-align: center;
  padding: 40px;
}

.final-result {
  font-size: 3rem;
  margin-bottom: 30px;
}

.final-score {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin-bottom: 40px;
}

.final-score .team {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.final-score .name {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
}

.final-score .score {
  font-size: 4rem;
  font-weight: 900;
  color: #f0c14b;
}

.final-score .divider {
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.3);
}

.game-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 40px;
}

.game-stats .stat {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.game-stats .label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
}

.game-stats .value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #00ffc8;
}

.game-over-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.btn {
  padding: 15px 35px;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn--primary {
  background: #00ffc8;
  color: #000;
}

.btn--secondary {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: #fff;
}

.btn--secondary:hover {
  border-color: #00ffc8;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.zoom-enter-active {
  animation: scoreZoom 0.5s ease-out;
}

.zoom-leave-active {
  animation: scoreZoom 0.3s ease-in reverse;
}
</style>
