/**
 * Game Audio Composable
 * Manages sound effects and music for quiz game modes
 */

export interface AudioConfig {
  volume: number;
  enabled: boolean;
}

export type SoundType =
  | "click"
  | "correct"
  | "wrong"
  | "intro"
  | "transition"
  | "timer"
  | "timerWarning"
  | "winner"
  | "loser"
  | "calculating";

export type ThemeType = "classic" | "quizshow" | "baseball" | "golf";

// Audio paths for different themes
const themeSounds: Record<ThemeType, Partial<Record<SoundType, string>>> = {
  classic: {
    click: "/audio/theme/classic/click.mp3",
    correct: "/audio/theme/classic/correct.mp3",
    wrong: "/audio/theme/classic/wrong.mp3",
    intro: "/audio/theme/classic/intro.mp3",
    transition: "/audio/theme/classic/transition.mp3",
    timer: "/audio/theme/classic/timer.mp3",
    timerWarning: "/audio/theme/classic/timer-answer.mp3",
    winner: "/audio/theme/classic/winner.wav",
    loser: "/audio/theme/classic/loser.mp3",
    calculating: "/audio/theme/classic/calculating.wav",
  },
  quizshow: {
    click: "/audio/theme/quiz-show/click.wav",
    correct: "/audio/theme/quiz-show/correct.mp3",
    wrong: "/audio/theme/quiz-show/wrong.mp3",
    intro: "/audio/theme/quiz-show/intro.mp3",
    transition: "/audio/theme/quiz-show/transition.mp3",
    timerWarning: "/audio/theme/quiz-show/timer.wav",
  },
  baseball: {
    click: "/audio/theme/baseball/click.wav",
    correct: "/audio/theme/baseball/correct.mp3",
    wrong: "/audio/theme/baseball/wrong.mp3",
    intro: "/audio/theme/baseball/intro.mp3",
    transition: "/audio/theme/baseball/transition.wav",
  },
  golf: {
    click: "/audio/theme/classic/click.mp3",
    correct: "/audio/theme/classic/correct.mp3",
    wrong: "/audio/theme/classic/wrong.mp3",
    intro: "/audio/theme/classic/intro.mp3",
    transition: "/audio/theme/classic/transition.mp3",
  },
};

// Fun winner/loser sounds
const winnerSounds = [
  "/audio/winner/Excellente.wav",
  "/audio/winner/johncena.mp3",
];

const loserSounds = [
  "/audio/loser/sad.wav",
  "/audio/loser/noo.wav",
  "/audio/loser/MyDernNoodleDontWorksoGood.wav",
];

export function useGameAudio() {
  const config = ref<AudioConfig>({
    volume: 0.5,
    enabled: true,
  });

  const currentTheme = ref<ThemeType>("classic");
  const audioCache = new Map<string, HTMLAudioElement>();

  // Preload sounds for current theme
  const preloadThemeSounds = (theme: ThemeType) => {
    const sounds = themeSounds[theme];
    if (!sounds) return;

    Object.values(sounds).forEach((path) => {
      if (path && !audioCache.has(path)) {
        const audio = new Audio(path);
        audio.preload = "auto";
        audioCache.set(path, audio);
      }
    });
  };

  // Play a sound
  const playSound = async (type: SoundType, volumeOverride?: number) => {
    if (!config.value.enabled) return;

    const sounds = themeSounds[currentTheme.value];
    const path = sounds?.[type];

    if (!path) {
      // Fallback to classic theme
      const fallbackPath = themeSounds.classic[type];
      if (fallbackPath) {
        return playAudioFile(fallbackPath, volumeOverride);
      }
      return;
    }

    return playAudioFile(path, volumeOverride);
  };

  // Play audio file directly
  const playAudioFile = async (path: string, volumeOverride?: number) => {
    if (!config.value.enabled) return;

    try {
      let audio = audioCache.get(path);
      if (!audio) {
        audio = new Audio(path);
        audioCache.set(path, audio);
      }

      // Clone for overlapping plays
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = volumeOverride ?? config.value.volume;
      await clone.play();
      return clone;
    } catch (error) {
      console.warn(`Failed to play audio: ${path}`, error);
    }
  };

  // Play random winner sound
  const playWinnerSound = () => {
    const sound = winnerSounds[Math.floor(Math.random() * winnerSounds.length)];
    return playAudioFile(sound);
  };

  // Play random loser sound
  const playLoserSound = () => {
    const sound = loserSounds[Math.floor(Math.random() * loserSounds.length)];
    return playAudioFile(sound);
  };

  // Set theme and preload sounds
  const setTheme = (theme: ThemeType) => {
    currentTheme.value = theme;
    preloadThemeSounds(theme);
  };

  // Toggle audio on/off
  const toggleAudio = () => {
    config.value.enabled = !config.value.enabled;
  };

  // Set volume (0-1)
  const setVolume = (volume: number) => {
    config.value.volume = Math.max(0, Math.min(1, volume));
  };

  // Initialize with classic theme
  onMounted(() => {
    preloadThemeSounds("classic");
  });

  return {
    config: readonly(config),
    currentTheme: readonly(currentTheme),
    playSound,
    playAudioFile,
    playWinnerSound,
    playLoserSound,
    setTheme,
    toggleAudio,
    setVolume,
    preloadThemeSounds,
  };
}
