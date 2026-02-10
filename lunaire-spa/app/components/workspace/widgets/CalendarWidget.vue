<template>
  <div class="calendar-widget">
    <div class="calendar-header">
      <button class="nav-btn" @click="previousMonth">&lt;</button>
      <h3 class="month-title">{{ monthName }} {{ currentYear }}</h3>
      <button class="nav-btn" @click="nextMonth">&gt;</button>
    </div>

    <div class="calendar-grid">
      <div v-for="day in weekDays" :key="day" class="day-header">
        {{ day }}
      </div>
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        class="day-cell"
        :class="{
          'day-cell--other-month': !day.isCurrentMonth,
          'day-cell--today': day.isToday,
          'day-cell--has-study': day.studyMinutes > 0,
          'day-cell--selected': selectedDate === day.date,
        }"
        @click="selectDate(day)"
      >
        <span class="day-number">{{ day.dayNumber }}</span>
        <div v-if="day.studyMinutes > 0" class="study-indicator">
          <div
            class="study-bar"
            :style="{
              height: `${Math.min((day.studyMinutes / 60) * 100, 100)}%`,
            }"
          />
        </div>
      </div>
    </div>

    <div v-if="selectedDayData" class="day-details">
      <h4 class="details-title">{{ formatSelectedDate }}</h4>
      <div class="details-stats">
        <div class="detail-item">
          <span class="detail-label">Study Time</span>
          <span class="detail-value">{{
            formatMinutes(selectedDayData.studyMinutes)
          }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Questions</span>
          <span class="detail-value">{{ selectedDayData.questions }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Accuracy</span>
          <span class="detail-value">{{ selectedDayData.accuracy }}%</span>
        </div>
      </div>
    </div>

    <div class="calendar-legend">
      <div class="legend-item">
        <div class="legend-color legend-color--low" />
        <span>0-15 min</span>
      </div>
      <div class="legend-item">
        <div class="legend-color legend-color--medium" />
        <span>15-30 min</span>
      </div>
      <div class="legend-item">
        <div class="legend-color legend-color--high" />
        <span>30+ min</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  studyMinutes: number;
  questions: number;
  accuracy: number;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const currentDate = ref(new Date());
const selectedDate = ref<string | null>(null);

// Sample study data (would come from API in production)
const studyData = ref<
  Record<string, { minutes: number; questions: number; accuracy: number }>
>({
  "2025-01-15": { minutes: 45, questions: 20, accuracy: 75 },
  "2025-01-16": { minutes: 30, questions: 15, accuracy: 80 },
  "2025-01-17": { minutes: 60, questions: 28, accuracy: 71 },
  "2025-01-18": { minutes: 15, questions: 8, accuracy: 88 },
  "2025-01-20": { minutes: 25, questions: 12, accuracy: 67 },
  "2025-01-21": { minutes: 50, questions: 22, accuracy: 82 },
});

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

const monthName = computed(() => {
  return currentDate.value.toLocaleString("default", { month: "long" });
});

const calendarDays = computed<CalendarDay[]>(() => {
  const days: CalendarDay[] = [];
  const year = currentYear.value;
  const month = currentMonth.value;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();

  // Previous month days
  const prevMonth = new Date(year, month, 0);
  for (let i = startPadding - 1; i >= 0; i--) {
    const day = prevMonth.getDate() - i;
    const date = formatDate(year, month - 1, day);
    const data = studyData.value[date];
    days.push({
      date,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: false,
      studyMinutes: data?.minutes || 0,
      questions: data?.questions || 0,
      accuracy: data?.accuracy || 0,
    });
  }

  // Current month days
  const today = new Date();
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = formatDate(year, month, day);
    const data = studyData.value[date];
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    days.push({
      date,
      dayNumber: day,
      isCurrentMonth: true,
      isToday,
      studyMinutes: data?.minutes || 0,
      questions: data?.questions || 0,
      accuracy: data?.accuracy || 0,
    });
  }

  // Next month days
  const remaining = 42 - days.length;
  for (let day = 1; day <= remaining; day++) {
    const date = formatDate(year, month + 1, day);
    const data = studyData.value[date];
    days.push({
      date,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: false,
      studyMinutes: data?.minutes || 0,
      questions: data?.questions || 0,
      accuracy: data?.accuracy || 0,
    });
  }

  return days;
});

const selectedDayData = computed<CalendarDay | null>(() => {
  if (!selectedDate.value) return null;
  return calendarDays.value.find((d) => d.date === selectedDate.value) || null;
});

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return "";
  const date = new Date(selectedDate.value);
  return date.toLocaleDateString("default", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
});

const formatDate = (year: number, month: number, day: number): string => {
  const d = new Date(year, month, day);
  return d.toISOString().split("T")[0] ?? "";
};

const formatMinutes = (minutes: number): string => {
  if (minutes === 0) return "No study";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const previousMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
};

const selectDate = (day: CalendarDay) => {
  selectedDate.value = day.date;
};
</script>

<style scoped>
.calendar-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-btn:hover {
  background: rgba(100, 116, 139, 0.2);
  color: #fff;
}

.month-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 16px;
}

.day-header {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  padding: 8px 0;
}

.day-cell {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.day-cell:hover {
  background: rgba(100, 116, 139, 0.2);
}

.day-cell--other-month {
  opacity: 0.4;
}

.day-cell--today {
  background: rgba(56, 189, 248, 0.2);
  border: 1px solid rgba(56, 189, 248, 0.5);
}

.day-cell--selected {
  background: rgba(168, 85, 247, 0.3);
  border: 1px solid rgba(168, 85, 247, 0.5);
}

.day-number {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
}

.study-indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 12px;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.study-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: linear-gradient(180deg, #22c55e, #10b981);
  border-radius: 2px;
}

.day-details {
  padding: 12px;
  background: rgba(100, 116, 139, 0.1);
  border-radius: 8px;
  margin-bottom: 12px;
}

.details-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.details-stats {
  display: flex;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
}

.detail-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-color--low {
  background: rgba(34, 197, 94, 0.3);
}

.legend-color--medium {
  background: rgba(34, 197, 94, 0.6);
}

.legend-color--high {
  background: rgba(34, 197, 94, 1);
}
</style>
