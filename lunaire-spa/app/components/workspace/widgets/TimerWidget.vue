<template>
  <div class="timer-widget">
    <div class="timer-display">
      <div class="time-value">{{ formattedTime }}</div>
      <div class="time-label">{{ timerLabel }}</div>
    </div>

    <div class="timer-controls">
      <button class="control-btn control-btn--primary" @click="toggleTimer">
        {{ isRunning ? "⏸️ Pause" : "▶️ Start" }}
      </button>
      <button
        class="control-btn"
        @click="resetTimer"
        :disabled="timeElapsed === 0"
      >
        🔄 Reset
      </button>
    </div>

    <div class="timer-presets">
      <span class="presets-label">Quick Set:</span>
      <button
        v-for="preset in presets"
        :key="preset.minutes"
        class="preset-btn"
        @click="setPreset(preset.minutes)"
      >
        {{ preset.label }}
      </button>
    </div>

    <div class="timer-stats">
      <div class="stat">
        <span class="stat-label">Today's Study Time</span>
        <span class="stat-value">{{ formatDuration(todayTotal) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Sessions</span>
        <span class="stat-value">{{ sessionsToday }}</span>
      </div>
    </div>

    <!-- Pomodoro indicator -->
    <div v-if="pomodoroMode" class="pomodoro-indicator">
      <span
        v-for="i in 4"
        :key="i"
        class="pomodoro-dot"
        :class="{ completed: i <= completedPomodoros }"
      />
      <span class="pomodoro-text"> {{ completedPomodoros }}/4 Pomodoros </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const STORAGE_KEY = "monobloc-timer-stats";

// Timer state
const timeElapsed = ref(0);
const targetTime = ref(25 * 60); // Default 25 minutes (Pomodoro)
const isRunning = ref(false);
const pomodoroMode = ref(true);
const completedPomodoros = ref(0);

// Stats
const todayTotal = ref(0);
const sessionsToday = ref(0);

// Presets
const presets = [
  { label: "5m", minutes: 5 },
  { label: "15m", minutes: 15 },
  { label: "25m", minutes: 25 },
  { label: "45m", minutes: 45 },
  { label: "60m", minutes: 60 },
];

// Interval ref
let timerInterval: NodeJS.Timeout | null = null;

// Formatted time display
const formattedTime = computed(() => {
  const remaining = Math.max(0, targetTime.value - timeElapsed.value);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
});

// Timer label
const timerLabel = computed(() => {
  if (!isRunning.value && timeElapsed.value === 0) return "Ready to focus";
  if (isRunning.value) return "Studying...";
  return "Paused";
});

// Format duration helper
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Toggle timer
const toggleTimer = () => {
  if (isRunning.value) {
    pauseTimer();
  } else {
    startTimer();
  }
};

// Start timer
const startTimer = () => {
  isRunning.value = true;
  timerInterval = setInterval(() => {
    timeElapsed.value++;
    todayTotal.value++;
    saveStats();

    // Check if time is up
    if (timeElapsed.value >= targetTime.value) {
      completeSession();
    }
  }, 1000);
};

// Pause timer
const pauseTimer = () => {
  isRunning.value = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

// Reset timer
const resetTimer = () => {
  pauseTimer();
  timeElapsed.value = 0;
};

// Set preset time
const setPreset = (minutes: number) => {
  resetTimer();
  targetTime.value = minutes * 60;
  pomodoroMode.value = minutes === 25;
};

// Complete session
const completeSession = () => {
  pauseTimer();
  sessionsToday.value++;

  if (pomodoroMode.value) {
    completedPomodoros.value++;
    if (completedPomodoros.value >= 4) {
      // Long break after 4 pomodoros
      alert("🎉 Great job! Take a 15-30 minute break.");
      completedPomodoros.value = 0;
    } else {
      alert("✅ Pomodoro complete! Take a 5 minute break.");
    }
  } else {
    alert("⏰ Time's up! Great study session.");
  }

  resetTimer();
  saveStats();
};

// Save stats to localStorage
const saveStats = () => {
  const today = new Date().toDateString();
  const stats = {
    date: today,
    todayTotal: todayTotal.value,
    sessionsToday: sessionsToday.value,
    completedPomodoros: completedPomodoros.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

// Load stats from localStorage
const loadStats = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const stats = JSON.parse(saved);
      const today = new Date().toDateString();

      if (stats.date === today) {
        todayTotal.value = stats.todayTotal || 0;
        sessionsToday.value = stats.sessionsToday || 0;
        completedPomodoros.value = stats.completedPomodoros || 0;
      }
    }
  } catch (e) {
    // Ignore errors
  }
};

// Lifecycle
onMounted(() => {
  loadStats();
});

onUnmounted(() => {
  pauseTimer();
});
</script>

<style scoped>
.timer-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
}

.timer-display {
  text-align: center;
  margin-bottom: 24px;
}

.time-value {
  font-size: 3.5rem;
  font-weight: 700;
  font-family: monospace;
  color: #fff;
  letter-spacing: 2px;
}

.time-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

.timer-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.control-btn {
  padding: 12px 24px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: rgba(100, 116, 139, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.control-btn:hover:not(:disabled) {
  background: rgba(100, 116, 139, 0.2);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn--primary {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.control-btn--primary:hover {
  background: rgba(56, 189, 248, 0.3);
}

.timer-presets {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.presets-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.preset-btn {
  padding: 6px 12px;
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-btn:hover {
  background: rgba(100, 116, 139, 0.2);
  color: #fff;
}

.timer-stats {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  margin-bottom: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #38bdf8;
}

.pomodoro-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pomodoro-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(100, 116, 139, 0.3);
  transition: all 0.3s ease;
}

.pomodoro-dot.completed {
  background: #22c55e;
}

.pomodoro-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 8px;
}
</style>
