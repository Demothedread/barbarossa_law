<template>
  <div class="schedule-crash-course">
    <!-- Header -->
    <div class="schedule-header">
      <h1>21-Day Bar Review Crash Course</h1>
      <p class="subtitle">February 2 – 23, 2026 | Test Days: Feb 24–25</p>
    </div>

    <!-- View Toggle -->
    <div class="view-toggle">
      <div class="view-group">
        <span class="view-label">View:</span>
        <button
          v-for="view in ['week', '3week', 'day']"
          :key="view"
          @click="calendarView = view"
          :class="['toggle-btn', { active: calendarView === view }]"
        >
          {{
            view === "week"
              ? "📅 Week"
              : view === "3week"
                ? "🗓️ 3 Weeks"
                : "📋 Day"
          }}
        </button>
      </div>
      <div class="view-group nav-group" v-if="calendarView !== '3week'">
        <button
          @click="navigateView(-1)"
          class="nav-btn"
          :disabled="!canNavigateBack"
        >
          ← Prev
        </button>
        <span class="current-period">{{ currentPeriodLabel }}</span>
        <button
          @click="navigateView(1)"
          class="nav-btn"
          :disabled="!canNavigateForward"
        >
          Next →
        </button>
      </div>
      <button
        v-if="isAuthenticated"
        @click="showEditMode = !showEditMode"
        :class="['toggle-btn edit-btn', { active: showEditMode }]"
      >
        {{ showEditMode ? "✓ Done" : "✏️ Edit" }}
      </button>
    </div>

    <!-- Main Layout: Calendar + Task Sidebar -->
    <div class="main-layout">
      <!-- Calendar Grid -->
      <div class="calendar-section">
        <!-- Daily View -->
        <div v-if="calendarView === 'day'" class="daily-view">
          <div v-if="selectedDayData" class="day-detail">
            <div
              class="day-detail-header"
              :style="{ '--accent': getSubjectColor(selectedDayData.primary) }"
            >
              <div class="day-detail-date">
                <span class="day-num">Day {{ selectedDayData.dayNumber }}</span>
                <span class="full-date">{{
                  formatDateFull(selectedDayData.date)
                }}</span>
                <span
                  v-if="isToday(selectedDayData.date)"
                  class="today-badge-lg"
                  >TODAY</span
                >
              </div>
              <div class="day-detail-subject">
                <span
                  class="bullet-lg"
                  :style="{ color: getSubjectColor(selectedDayData.primary) }"
                >
                  {{ getBulletShape(selectedDayData.studyType) }}
                </span>
                <span class="subject-lg">{{ selectedDayData.primary }}</span>
              </div>
              <div class="day-detail-type">
                {{ formatStudyType(selectedDayData.studyType) }}
              </div>
              <div
                v-if="selectedDayData.secondary"
                class="day-detail-secondary"
              >
                Secondary: {{ selectedDayData.secondary }}
              </div>
            </div>
            <div class="day-tasks-full">
              <h4>Tasks for Day {{ selectedDayData.dayNumber }}</h4>
              <div class="task-list-full">
                <div
                  v-for="task in getTasksForDay(selectedDayData.dayNumber)"
                  :key="task.id"
                  @click="toggleTaskState(task)"
                  :class="['task-block-full', task.state]"
                  :style="{ '--task-color': getSubjectColor(task.subject) }"
                >
                  <div class="task-bullet-full">
                    {{
                      task.state === "done"
                        ? "✓"
                        : getBulletShape(task.studyType)
                    }}
                  </div>
                  <div class="task-content-full">
                    <div class="task-title-full">{{ task.title }}</div>
                    <div class="task-meta-full">
                      <span class="task-subject-full">{{ task.subject }}</span>
                      <span v-if="task.duration" class="task-duration-full">{{
                        task.duration
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Week / 3-Week View -->
        <div
          v-else
          class="calendar-grid"
          :class="{ 'week-view': calendarView === 'week' }"
        >
          <!-- Day headers -->
          <div
            v-for="dayName in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
            :key="dayName"
            class="day-header"
          >
            {{ dayName }}
          </div>

          <!-- Calendar cells -->
          <template v-for="(day, idx) in visibleCalendarDays" :key="idx">
            <!-- Empty cells for padding before Feb 2 (Monday) -->
            <div v-if="day.empty" class="calendar-cell empty"></div>

            <!-- Test Days -->
            <div
              v-else-if="day.isTestDay"
              class="calendar-cell test-day"
              :class="{ 'is-today': isToday(day.date) }"
            >
              <div class="cell-date">{{ formatDateShort(day.date) }}</div>
              <div class="test-label">{{ day.label }}</div>
            </div>

            <!-- Regular Study Days -->
            <div
              v-else
              @click="selectDay(day.dayNumber)"
              :class="[
                'calendar-cell',
                { selected: selectedDay === day.dayNumber },
                { 'is-today': isToday(day.date) },
              ]"
              :style="{
                '--cell-accent': getSubjectColor(day.primary),
              }"
            >
              <div class="cell-header">
                <span class="cell-date">{{ formatDateShort(day.date) }}</span>
                <span v-if="isToday(day.date)" class="today-badge">TODAY</span>
              </div>
              <div class="cell-day-number">Day {{ day.dayNumber }}</div>
              <div class="cell-subject">
                <span
                  class="bullet"
                  :style="{ color: getSubjectColor(day.primary) }"
                >
                  {{ getBulletShape(day.studyType) }}
                </span>
                <span class="subject-name">{{ day.primary }}</span>
              </div>
              <div class="cell-type">{{ formatStudyType(day.studyType) }}</div>
            </div>
          </template>
        </div>
      </div>
      <div class="task-sidebar">
        <div class="sidebar-panel">
          <h3 class="panel-title">
            <span>{{ formatDateFull(getCurrentDate()) }}</span>
            <span class="day-badge">Day {{ todayNumber }}</span>
          </h3>

          <!-- Add Task Input -->
          <div v-if="isAuthenticated && showEditMode" class="add-task-form">
            <input
              v-model="newTaskInput"
              @keyup.enter="addNewTask"
              placeholder="#subject /type task..."
              class="task-input"
            />
            <button @click="addNewTask" class="add-btn">+</button>
          </div>

          <!-- Combined Task List: Today's + Accumulated Unfinished -->
          <div class="task-section">
            <h4 class="section-label">📋 Today's Agenda</h4>
            <div class="task-list">
              <!-- Today's Tasks First -->
              <div
                v-for="task in todayTasks"
                :key="task.id"
                @click="cycleTaskState(task)"
                :class="['task-block', 'today-task', task.state]"
                :style="{
                  '--task-color': getSubjectColor(task.subject),
                  '--task-height': getTaskHeight(task.duration),
                }"
              >
                <div class="task-bullet" :class="task.studyType">
                  {{ getBulletShape(task.studyType) }}
                </div>
                <div class="task-content">
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-meta">
                    <span class="task-subject">{{ task.subject }}</span>
                    <span v-if="task.duration" class="task-duration">{{
                      task.duration
                    }}</span>
                  </div>
                </div>
                <div
                  v-if="showEditMode && isAuthenticated"
                  class="task-actions"
                >
                  <button @click.stop="editTask(task)" class="action-btn edit">
                    ✎
                  </button>
                  <button
                    @click.stop="deleteTask_(task.id)"
                    class="action-btn delete"
                  >
                    ×
                  </button>
                </div>
              </div>

              <!-- Accumulated Unfinished Tasks (older days, faded style) -->
              <div
                v-for="task in accumulatedUnfinishedTasks"
                :key="task.id"
                @click="cycleTaskState(task)"
                :class="['task-block', 'past-task', task.state]"
                :style="{
                  '--task-color': getSubjectColor(task.subject),
                  '--task-height': getTaskHeight(task.duration),
                }"
              >
                <div class="task-bullet" :class="task.studyType">
                  {{ getBulletShape(task.studyType) }}
                </div>
                <div class="task-content">
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-meta">
                    <span class="past-day-label">Day {{ task.day }}</span>
                    <span class="task-subject">{{ task.subject }}</span>
                  </div>
                </div>
                <div
                  v-if="showEditMode && isAuthenticated"
                  class="task-actions"
                >
                  <button @click.stop="editTask(task)" class="action-btn edit">
                    ✎
                  </button>
                  <button
                    @click.stop="deleteTask_(task.id)"
                    class="action-btn delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Panel -->
        <div class="sidebar-panel stats-panel">
          <h4 class="panel-title">Progress</h4>
          <div class="stat-row">
            <span>Completed</span>
            <span class="stat-value done">{{ completedCount }}/21</span>
          </div>
          <div class="stat-row">
            <span>In Progress</span>
            <span class="stat-value progress">{{ inProgressCount }}</span>
          </div>
          <div class="stat-row">
            <span>Pending</span>
            <span class="stat-value pending">{{ pendingCount }}</span>
          </div>
        </div>

        <!-- Subject Legend -->
        <div class="sidebar-panel legend-panel">
          <h4 class="panel-title">Subjects</h4>
          <div class="subject-list">
            <div v-for="subj in subjects" :key="subj.name" class="subject-item">
              <span
                class="subject-dot"
                :style="{ backgroundColor: subj.color }"
              ></span>
              <span class="subject-name">{{ subj.name }}</span>
            </div>
          </div>
          <div class="study-types">
            <div class="type-item"><span class="bullet">●</span> MBE</div>
            <div class="type-item"><span class="bullet">■</span> Essay</div>
            <div class="type-item"><span class="bullet">◆</span> Review</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showTaskEditModal"
      class="modal-overlay"
      @click.self="closeEditModal"
    >
      <div class="modal-content">
        <h3 class="modal-title">Edit Task</h3>
        <div class="modal-form">
          <div class="form-group">
            <label>Title</label>
            <input v-model="editingTask.title" class="form-input" />
          </div>
          <div class="form-group">
            <label>Subject</label>
            <select v-model="editingTask.subject" class="form-select">
              <option
                v-for="subj in subjects"
                :key="subj.name"
                :value="subj.name"
              >
                {{ subj.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Study Type</label>
            <select v-model="editingTask.studyType" class="form-select">
              <option value="mbe">MBE Practice</option>
              <option value="essay">Essay Practice</option>
              <option value="review">Subject Review</option>
            </select>
          </div>
          <div class="form-group">
            <label>Duration</label>
            <input
              v-model="editingTask.duration"
              placeholder="e.g., 1.5 hours"
              class="form-input"
            />
          </div>
          <div class="modal-actions">
            <button @click="saveTaskEdit" class="btn-save">Save</button>
            <button @click="closeEditModal" class="btn-cancel">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useScheduleManagement } from "../composables/useScheduleManagement";

// Use schedule management composable
const {
  tasks,
  loadSchedule,
  saveSchedule,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskState: toggleState,
  getOverdueTasks,
  stats,
} = useScheduleManagement();

// State
const currentView = ref("calendar");
const calendarView = ref("week"); // 'week', '3week', 'day'
const currentWeekStart = ref(0); // 0 = first week (days 1-7), 1 = second week, etc.
const selectedDay = ref(1);
const todayNumber = ref(1);
const showEditMode = ref(false);
const isAuthenticated = ref(false);
const newTaskInput = ref("");
const showTaskEditModal = ref(false);
const editingTask = ref(null);
const editingTaskId = ref(null);

// Course dates: Feb 2-23, 2026 (study) + Feb 24-25, 2026 (test)
const courseStartDate = new Date(2026, 1, 2); // Feb 2, 2026

// Theme detection - check for beach/low-contrast mode
const isBeachTheme = ref(false);

// Watch for theme changes
onMounted(() => {
  loadSchedule();
  initializeScheduleTasks();
  updateTodayFromDate();

  // Check initial theme
  isBeachTheme.value = document.body.classList.contains("low-contrast");

  // Watch for theme changes
  const observer = new MutationObserver(() => {
    isBeachTheme.value = document.body.classList.contains("low-contrast");
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
});

// Subject definitions - Intergalactic theme (default)
const intergalacticColors = {
  Evidence: "#00ffc8", // Nebula Teal
  "Civil Procedure": "#ffd700", // Solar Gold
  Contracts: "#b266ff", // Cosmic Purple
  "Constitutional Law": "#ff66b2", // Aurora Pink
  Torts: "#00d4ff", // Bright Cyan
  "Criminal Law & Procedure": "#ff6b35", // Plasma Orange
  "Real Property": "#66b2ff", // Sky Blue
  "Wills & Trusts": "#9966ff", // Violet
  "Community Property": "#ffb366", // Warm Gold
  "Professional Responsibility": "#66ffb2", // Mint Green
};

// Beach Boys theme colors (pale, warm, beachy)
const beachColors = {
  Evidence: "#7fdbda", // Seafoam
  "Civil Procedure": "#f4e4ba", // Sand
  Contracts: "#e8b4b8", // Coral Pink
  "Constitutional Law": "#b8d4e3", // Sky Blue
  Torts: "#f5c89a", // Pale Orange
  "Criminal Law & Procedure": "#d4a574", // Driftwood
  "Real Property": "#a8d8ea", // Ocean Blue
  "Wills & Trusts": "#ffcab0", // Peach
  "Community Property": "#fff1c9", // Butter Yellow
  "Professional Responsibility": "#c9e4de", // Mint Seafoam
};

const subjects = computed(() => {
  const colors = isBeachTheme.value ? beachColors : intergalacticColors;
  return Object.entries(colors).map(([name, color]) => ({ name, color }));
});

// 21-Day Schedule with actual dates
const scheduleData = ref([
  { number: 1, primary: "Evidence", secondary: "Evidence", studyType: "essay" },
  {
    number: 2,
    primary: "Civil Procedure",
    secondary: "Evidence",
    studyType: "essay",
  },
  {
    number: 3,
    primary: "Contracts",
    secondary: "Civil Procedure",
    studyType: "essay",
  },
  {
    number: 4,
    primary: "Constitutional Law",
    secondary: "Contracts",
    studyType: "essay",
  },
  { number: 5, primary: "Torts", secondary: "Evidence", studyType: "essay" },
  {
    number: 6,
    primary: "Criminal Law & Procedure",
    secondary: "Civil Procedure",
    studyType: "review",
  },
  {
    number: 7,
    primary: "Real Property",
    secondary: "Contracts",
    studyType: "mbe",
  },
  {
    number: 8,
    primary: "Community Property",
    secondary: "Evidence",
    studyType: "essay",
  },
  {
    number: 9,
    primary: "Wills & Trusts",
    secondary: "Civil Procedure",
    studyType: "essay",
  },
  {
    number: 10,
    primary: "Real Property",
    secondary: "Contracts",
    studyType: "essay",
  },
  {
    number: 11,
    primary: "Criminal Law & Procedure",
    secondary: "Evidence",
    studyType: "essay",
  },
  {
    number: 12,
    primary: "Torts",
    secondary: "Civil Procedure",
    studyType: "review",
  },
  {
    number: 13,
    primary: "Constitutional Law",
    secondary: "Contracts",
    studyType: "essay",
  },
  { number: 14, primary: "Contracts", secondary: "Evidence", studyType: "mbe" },
  {
    number: 15,
    primary: "Evidence",
    secondary: "Civil Procedure",
    studyType: "essay",
  },
  {
    number: 16,
    primary: "Civil Procedure",
    secondary: "Contracts",
    studyType: "essay",
  },
  {
    number: 17,
    primary: "Contracts",
    secondary: "Evidence",
    studyType: "essay",
  },
  {
    number: 18,
    primary: "Constitutional Law",
    secondary: "Civil Procedure",
    studyType: "essay",
  },
  { number: 19, primary: "Torts", secondary: "Evidence", studyType: "essay" },
  {
    number: 20,
    primary: "Criminal Law & Procedure",
    secondary: "Contracts",
    studyType: "review",
  },
  {
    number: 21,
    primary: "Evidence",
    secondary: "Civil Procedure",
    studyType: "mbe",
  },
]);

// Generate calendar days with dates
const calendarDays = computed(() => {
  const days = [];

  // Add study days (Feb 2-23)
  for (let i = 0; i < 21; i++) {
    const date = new Date(courseStartDate);
    date.setDate(date.getDate() + i);
    const dayData = scheduleData.value[i];
    days.push({
      ...dayData,
      dayNumber: i + 1,
      date: date,
      isTestDay: false,
    });
  }

  // Add test days (Feb 24-25)
  const testDay1 = new Date(2026, 1, 24);
  const testDay2 = new Date(2026, 1, 25);
  days.push({ date: testDay1, isTestDay: true, label: "TEST DAY 1" });
  days.push({ date: testDay2, isTestDay: true, label: "TEST DAY 2" });

  return days;
});

// Visible calendar days based on current view
const visibleCalendarDays = computed(() => {
  if (calendarView.value === "3week") {
    return calendarDays.value;
  }

  if (calendarView.value === "week") {
    // Get days for current week (7 days at a time)
    const startIdx = currentWeekStart.value * 7;
    const endIdx = Math.min(startIdx + 7, calendarDays.value.length);
    return calendarDays.value.slice(startIdx, endIdx);
  }

  // Day view returns empty - handled separately in template
  return [];
});

// Selected day data for daily view
const selectedDayData = computed(() => {
  return calendarDays.value.find(
    (d) => d.dayNumber === selectedDay.value && !d.isTestDay,
  );
});

// Navigation helpers
const canNavigateBack = computed(() => {
  if (calendarView.value === "week") {
    return currentWeekStart.value > 0;
  }
  if (calendarView.value === "day") {
    return selectedDay.value > 1;
  }
  return false;
});

const canNavigateForward = computed(() => {
  if (calendarView.value === "week") {
    return (currentWeekStart.value + 1) * 7 < calendarDays.value.length;
  }
  if (calendarView.value === "day") {
    return selectedDay.value < 21;
  }
  return false;
});

const currentPeriodLabel = computed(() => {
  if (calendarView.value === "week") {
    const weekNum = currentWeekStart.value + 1;
    const startDay = currentWeekStart.value * 7 + 1;
    const endDay = Math.min(startDay + 6, 21);
    const startDate = new Date(courseStartDate);
    startDate.setDate(startDate.getDate() + startDay - 1);
    const endDate = new Date(courseStartDate);
    endDate.setDate(endDate.getDate() + endDay - 1);
    return `Week ${weekNum}: ${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
  }
  if (calendarView.value === "day") {
    const date = new Date(courseStartDate);
    date.setDate(date.getDate() + selectedDay.value - 1);
    return `Day ${selectedDay.value}: ${formatDateFull(date)}`;
  }
  return "";
});

function navigateView(direction) {
  if (calendarView.value === "week") {
    const newWeek = currentWeekStart.value + direction;
    if (newWeek >= 0 && newWeek * 7 < calendarDays.value.length) {
      currentWeekStart.value = newWeek;
    }
  } else if (calendarView.value === "day") {
    const newDay = selectedDay.value + direction;
    if (newDay >= 1 && newDay <= 21) {
      selectedDay.value = newDay;
      todayNumber.value = newDay;
    }
  }
}

function getTasksForDay(dayNum) {
  return tasks.value.filter((t) => t.day === dayNum);
}

function updateTodayFromDate() {
  const today = new Date();
  const diffTime = today.getTime() - courseStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 0 && diffDays < 21) {
    todayNumber.value = diffDays + 1;
    selectedDay.value = diffDays + 1;
    // Set current week to show today's week
    currentWeekStart.value = Math.floor(diffDays / 7);
  } else {
    // Default to day 1 if outside course range
    todayNumber.value = 1;
    selectedDay.value = 1;
    currentWeekStart.value = 0;
  }
}

function getCurrentDate() {
  const date = new Date(courseStartDate);
  date.setDate(date.getDate() + (todayNumber.value - 1));
  return date;
}

function isToday(date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function formatDateShort(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Initialize tasks from schedule with proper durations
function initializeScheduleTasks() {
  if (tasks.value.length > 0) return; // Don't reinitialize if we have saved tasks

  tasks.value = scheduleData.value.flatMap((day) => [
    {
      id: `${day.number}-mbe-1`,
      day: day.number,
      title: `33 MBE Questions - ${day.primary}`,
      subject: day.primary,
      studyType: "mbe",
      duration: "1.5 hours",
      state: "pending",
    },
    {
      id: `${day.number}-mbe-2`,
      day: day.number,
      title: `Deep MBE Review - ${day.primary}`,
      subject: day.primary,
      studyType: "review",
      duration: "1.5 hours",
      state: "pending",
    },
    {
      id: `${day.number}-primary`,
      day: day.number,
      title: `Primary Rule Review - ${day.primary}`,
      subject: day.primary,
      studyType: "review",
      duration: "2 hours",
      state: "pending",
    },
    {
      id: `${day.number}-secondary`,
      day: day.number,
      title: `Secondary Review - ${day.secondary}`,
      subject: day.secondary,
      studyType: "review",
      duration: "1 hour",
      state: "pending",
    },
    {
      id: `${day.number}-essay`,
      day: day.number,
      title: `${day.studyType === "essay" ? "Essay Practice" : day.studyType === "mbe" ? "MBE Test" : "Deep Memorization"} - ${day.primary}`,
      subject: day.primary,
      studyType: day.studyType,
      duration: "1 hour",
      state: "pending",
    },
  ]);
  saveSchedule();
}

// Get task height based on duration (proportional sizing)
function getTaskHeight(duration) {
  if (!duration) return "48px";
  const hours = parseFloat(duration) || 1;
  // Base height of 40px per hour, min 40px
  return `${Math.max(40, hours * 40)}px`;
}

// Computed properties
const todayTasks = computed(() => {
  return tasks.value.filter(
    (t) => t.day === todayNumber.value && t.state !== "done",
  );
});

// Accumulated unfinished tasks from previous days (sorted by day descending - most recent first)
const accumulatedUnfinishedTasks = computed(() => {
  return tasks.value
    .filter((t) => t.day < todayNumber.value && t.state !== "done")
    .sort((a, b) => b.day - a.day); // Most recent day first
});

const overdueTasks = computed(() => {
  return tasks.value.filter(
    (t) => t.day < todayNumber.value && t.state !== "done",
  );
});

const completedCount = computed(() => {
  const completedDays = new Set();
  tasks.value.forEach((t) => {
    if (t.state === "done") completedDays.add(t.day);
  });
  return completedDays.size;
});

const inProgressCount = computed(() => {
  const progressDays = new Set();
  tasks.value.forEach((t) => {
    if (t.state === "inProgress") progressDays.add(t.day);
  });
  return progressDays.size;
});

const pendingCount = computed(() => {
  return 21 - completedCount.value - inProgressCount.value;
});

// Helper functions
function getSubjectColor(subjectName) {
  const colors = isBeachTheme.value ? beachColors : intergalacticColors;
  return colors[subjectName] || (isBeachTheme.value ? "#7fdbda" : "#00ffc8");
}

function getBulletShape(studyType) {
  switch (studyType) {
    case "mbe":
      return "●";
    case "essay":
      return "■";
    case "review":
      return "◆";
    default:
      return "•";
  }
}

function formatStudyType(studyType) {
  switch (studyType) {
    case "mbe":
      return "MBE Practice";
    case "essay":
      return "Essay Practice";
    case "review":
      return "Subject Review";
    default:
      return studyType;
  }
}

function selectDay(dayNum) {
  selectedDay.value = dayNum;
  todayNumber.value = dayNum;
}

// Cycle through task states: pending → inProgress (orange) → done (red, removed)
function cycleTaskState(task) {
  const idx = tasks.value.findIndex((t) => t.id === task.id);
  if (idx === -1) return;

  const currentState = tasks.value[idx].state;

  if (currentState === "pending") {
    // First click: start task (orange)
    tasks.value[idx].state = "inProgress";
  } else if (currentState === "inProgress") {
    // Second click: complete task (red, will be filtered out)
    tasks.value[idx].state = "done";
  }
  // Done tasks are filtered out, so no third state needed

  saveSchedule();
}

function toggleTaskState(task) {
  toggleState(task.id);
}

function addNewTask() {
  if (!newTaskInput.value.trim()) return;

  let title = newTaskInput.value;
  let subject = "Evidence";
  let studyType = "review";

  const subjectMatch = title.match(/#(\w+)/i);
  if (subjectMatch) {
    const found = subjects.value.find((s) =>
      s.name.toLowerCase().includes(subjectMatch[1].toLowerCase()),
    );
    if (found) {
      subject = found.name;
      title = title.replace(/#\w+/i, "").trim();
    }
  }

  const typeMatch = title.match(/\/(\w+)/i);
  if (typeMatch) {
    const t = typeMatch[1].toLowerCase();
    if (t.includes("mbe")) studyType = "mbe";
    else if (t.includes("essay")) studyType = "essay";
    else if (t.includes("review")) studyType = "review";
    title = title.replace(/\/\w+/i, "").trim();
  }

  addTask({
    day: todayNumber.value,
    title: title || "New Task",
    subject,
    studyType,
    duration: "1 hour",
    state: "pending",
  });
  newTaskInput.value = "";
}

function editTask(task) {
  editingTask.value = { ...task };
  editingTaskId.value = task.id;
  showTaskEditModal.value = true;
}

function saveTaskEdit() {
  if (editingTask.value && editingTaskId.value) {
    const idx = tasks.value.findIndex((t) => t.id === editingTaskId.value);
    if (idx !== -1) {
      tasks.value[idx] = editingTask.value;
      saveSchedule();
    }
  }
  closeEditModal();
}

function closeEditModal() {
  showTaskEditModal.value = false;
  editingTask.value = null;
  editingTaskId.value = null;
}

function deleteTask_(taskId) {
  deleteTask(taskId);
}
</script>

<style scoped>
.schedule-crash-course {
  font-family: var(--font-body, "Space Grotesk", sans-serif);
  color: var(--lunar-white, #e0e1dd);
  padding: 1.5rem;
  min-height: 100%;
}

/* Header */
.schedule-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.schedule-header h1 {
  font-family: var(--font-display, "Orbitron", sans-serif);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--lunar-white, #e0e1dd);
  margin-bottom: 0.25rem;
}

.schedule-header .subtitle {
  color: var(--nebula-teal, #00ffc8);
  font-size: 0.9rem;
  opacity: 0.9;
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
}

.view-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-label {
  font-size: 0.8rem;
  color: var(--star-silver, #778da9);
  margin-right: 0.25rem;
}

.nav-group {
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid rgba(65, 90, 119, 0.3);
}

.nav-btn {
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(27, 38, 59, 0.6);
  border: 1px solid rgba(65, 90, 119, 0.4);
  color: var(--star-silver, #778da9);
}

.nav-btn:hover:not(:disabled) {
  background: rgba(65, 90, 119, 0.4);
  border-color: var(--nebula-teal, #00ffc8);
  color: var(--lunar-white, #e0e1dd);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.current-period {
  font-size: 0.85rem;
  color: var(--lunar-white, #e0e1dd);
  font-weight: 600;
  padding: 0 0.5rem;
  min-width: 180px;
  text-align: center;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(27, 38, 59, 0.6);
  border: 1px solid rgba(65, 90, 119, 0.4);
  color: var(--star-silver, #778da9);
  backdrop-filter: blur(8px);
}

.toggle-btn:hover {
  background: rgba(65, 90, 119, 0.4);
  border-color: var(--nebula-teal, #00ffc8);
}

.toggle-btn.active {
  background: rgba(0, 255, 200, 0.15);
  border-color: var(--nebula-teal, #00ffc8);
  color: var(--nebula-teal, #00ffc8);
}

.toggle-btn.edit-btn {
  margin-left: auto;
}

.toggle-btn.edit-btn.active {
  background: rgba(255, 215, 0, 0.15);
  border-color: var(--solar-gold, #ffd700);
  color: var(--solar-gold, #ffd700);
}

/* Main Layout */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
}

/* Calendar Section */
.calendar-section {
  background: rgba(27, 38, 59, 0.4);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 16px;
  padding: 1rem;
  backdrop-filter: blur(12px);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.calendar-grid.week-view {
  /* Larger cells for week view */
}

.calendar-grid.week-view .calendar-cell {
  min-height: 100px;
}

/* Daily View */
.daily-view {
  min-height: 400px;
}

.day-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.day-detail-header {
  background: rgba(13, 27, 42, 0.6);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.day-detail-header::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--accent, #00ffc8);
}

.day-detail-date {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.day-num {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--lunar-white, #e0e1dd);
}

.full-date {
  font-size: 1.1rem;
  color: var(--star-silver, #778da9);
}

.today-badge-lg {
  font-size: 0.75rem;
  background: var(--nebula-teal, #00ffc8);
  color: var(--space-navy, #0d1b2a);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-weight: 700;
}

.day-detail-subject {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.bullet-lg {
  font-size: 1.5rem;
}

.subject-lg {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--lunar-white, #e0e1dd);
}

.day-detail-type {
  font-size: 0.9rem;
  color: var(--nebula-teal, #00ffc8);
  margin-bottom: 0.5rem;
}

.day-detail-secondary {
  font-size: 0.85rem;
  color: var(--star-silver, #778da9);
}

.day-tasks-full h4 {
  font-size: 1rem;
  color: var(--lunar-white, #e0e1dd);
  margin-bottom: 1rem;
}

.task-list-full {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-block-full {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(13, 27, 42, 0.6);
  border: 1px solid rgba(65, 90, 119, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.task-block-full::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--task-color, #00ffc8);
}

.task-block-full:hover {
  background: rgba(65, 90, 119, 0.3);
}

.task-block-full.done {
  opacity: 0.6;
  background: rgba(0, 200, 100, 0.1);
}

.task-block-full.done .task-title-full {
  text-decoration: line-through;
}

.task-block-full.inProgress {
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.3);
}

.task-bullet-full {
  font-size: 1.25rem;
  color: var(--task-color, #00ffc8);
  line-height: 1;
}

.task-block-full.done .task-bullet-full {
  color: var(--nebula-teal, #00ffc8);
}

.task-content-full {
  flex: 1;
}

.task-title-full {
  font-size: 0.95rem;
  color: var(--lunar-white, #e0e1dd);
  margin-bottom: 0.25rem;
}

.task-meta-full {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}

.task-subject-full {
  color: var(--task-color, #00ffc8);
}

.task-duration-full {
  color: var(--nebula-blue, #415a77);
}

.day-header {
  text-align: center;
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--star-silver, #778da9);
  padding: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Calendar Cells */
.calendar-cell {
  background: rgba(13, 27, 42, 0.6);
  border: 1px solid rgba(65, 90, 119, 0.2);
  border-radius: 10px;
  padding: 0.5rem;
  min-height: 80px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.calendar-cell::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--cell-accent, transparent);
  opacity: 0.8;
}

.calendar-cell:hover {
  background: rgba(65, 90, 119, 0.3);
  border-color: rgba(0, 255, 200, 0.4);
  transform: translateY(-2px);
}

.calendar-cell.selected {
  border-color: var(--nebula-teal, #00ffc8);
  box-shadow: 0 0 20px rgba(0, 255, 200, 0.2);
}

.calendar-cell.is-today {
  background: rgba(0, 255, 200, 0.1);
  border-color: var(--nebula-teal, #00ffc8);
}

.calendar-cell.empty {
  background: transparent;
  border: none;
  cursor: default;
}

.calendar-cell.test-day {
  background: linear-gradient(
    135deg,
    rgba(255, 107, 53, 0.2),
    rgba(255, 0, 0, 0.1)
  );
  border-color: rgba(255, 107, 53, 0.5);
  cursor: default;
}

.calendar-cell.test-day .cell-date {
  color: var(--plasma-orange, #ff6b35);
}

.test-label {
  font-weight: 700;
  font-size: 0.7rem;
  color: var(--plasma-orange, #ff6b35);
  text-align: center;
  margin-top: 0.5rem;
  letter-spacing: 0.05em;
}

.cell-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.cell-date {
  font-size: 0.7rem;
  color: var(--star-silver, #778da9);
}

.today-badge {
  font-size: 0.55rem;
  background: var(--nebula-teal, #00ffc8);
  color: var(--space-navy, #0d1b2a);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-weight: 700;
}

.cell-day-number {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--lunar-white, #e0e1dd);
  margin-bottom: 0.25rem;
}

.cell-subject {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
}

.cell-subject .bullet {
  font-size: 0.6rem;
}

.cell-subject .subject-name {
  color: var(--star-silver, #778da9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-type {
  font-size: 0.6rem;
  color: var(--nebula-blue, #415a77);
  margin-top: 0.25rem;
}

/* Task Sidebar */
.task-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-panel {
  background: rgba(27, 38, 59, 0.4);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(12px);
}

.panel-title {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--lunar-white, #e0e1dd);
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.day-badge {
  font-size: 0.7rem;
  background: rgba(0, 255, 200, 0.15);
  color: var(--nebula-teal, #00ffc8);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

/* Add Task Form */
.add-task-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.task-input {
  flex: 1;
  background: rgba(13, 27, 42, 0.8);
  border: 1px solid rgba(65, 90, 119, 0.4);
  border-radius: 6px;
  padding: 0.5rem;
  color: var(--lunar-white, #e0e1dd);
  font-size: 0.8rem;
}

.task-input::placeholder {
  color: var(--nebula-blue, #415a77);
}

.task-input:focus {
  outline: none;
  border-color: var(--nebula-teal, #00ffc8);
}

.add-btn {
  background: rgba(0, 255, 200, 0.2);
  border: 1px solid var(--nebula-teal, #00ffc8);
  border-radius: 6px;
  color: var(--nebula-teal, #00ffc8);
  width: 32px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: rgba(0, 255, 200, 0.3);
}

/* Task Sections */
.task-section {
  margin-bottom: 1rem;
}

.task-section.overdue {
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 107, 53, 0.3);
}

.section-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--star-silver, #778da9);
  margin-bottom: 0.5rem;
}

.section-label.overdue-label {
  color: var(--plasma-orange, #ff6b35);
}

/* Task List with Proportional Heights */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-block {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(13, 27, 42, 0.6);
  border: 1px solid rgba(65, 90, 119, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: var(--task-height, 48px);
  position: relative;
  overflow: hidden;
}

.task-block::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--task-color, #00ffc8);
}

.task-block:hover {
  background: rgba(65, 90, 119, 0.3);
}

/* Today's tasks - full color styling */
.task-block.today-task {
  background: rgba(13, 27, 42, 0.6);
}

.task-block.today-task .task-title {
  color: var(--lunar-white, #e0e1dd);
}

/* Past/accumulated tasks - faded gray, no background fill */
.task-block.past-task {
  background: transparent;
  border-color: rgba(65, 90, 119, 0.15);
}

.task-block.past-task::before {
  opacity: 0.4;
}

.task-block.past-task .task-title {
  color: rgba(119, 141, 169, 0.7);
}

.task-block.past-task .task-bullet {
  opacity: 0.5;
}

.task-block.past-task .task-subject {
  opacity: 0.6;
}

.past-day-label {
  color: rgba(119, 141, 169, 0.6);
  font-size: 0.6rem;
  font-style: italic;
}

/* Task State: In Progress - Orange */
.task-block.inProgress {
  background: rgba(255, 165, 0, 0.1);
  border-color: rgba(255, 165, 0, 0.4);
}

.task-block.inProgress .task-title {
  color: #ff9500;
  font-weight: 600;
}

.task-block.inProgress .task-bullet {
  color: #ff9500;
}

.task-block.inProgress::before {
  background: #ff9500;
}

/* Task State: Done - Red with strikethrough (will be filtered out) */
.task-block.done {
  opacity: 0.5;
  background: rgba(255, 59, 48, 0.1);
  border-color: rgba(255, 59, 48, 0.3);
}

.task-block.done .task-title {
  text-decoration: line-through;
  color: #ff3b30;
}

.task-block.done .task-bullet {
  color: #ff3b30;
}

.task-block.done::before {
  background: #ff3b30;
}

/* Bullet shapes by study type */
.task-bullet {
  font-size: 1rem;
  color: var(--task-color, #00ffc8);
  line-height: 1;
  margin-top: 0.1rem;
  min-width: 1rem;
  text-align: center;
}

.task-bullet.mbe {
  /* Circle for MBE/multiple choice */
}

.task-bullet.essay {
  /* Square for Essay */
}

.task-bullet.review {
  /* Diamond for Review */
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 0.8rem;
  color: var(--lunar-white, #e0e1dd);
  line-height: 1.3;
}

.task-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.65rem;
  margin-top: 0.25rem;
}

.task-subject {
  color: var(--task-color, #00ffc8);
}

.task-duration {
  color: var(--nebula-blue, #415a77);
}

.overdue-day {
  color: var(--plasma-orange, #ff6b35);
}

/* Task Actions */
.task-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.task-block:hover .task-actions {
  opacity: 1;
}

.action-btn {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.edit {
  background: rgba(102, 178, 255, 0.2);
  color: #66b2ff;
}

.action-btn.delete {
  background: rgba(255, 107, 53, 0.2);
  color: #ff6b35;
}

/* Stats Panel */
.stats-panel .stat-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(65, 90, 119, 0.2);
  font-size: 0.8rem;
}

.stats-panel .stat-row:last-child {
  border-bottom: none;
}

.stat-value {
  font-weight: 700;
}

.stat-value.done {
  color: var(--nebula-teal, #00ffc8);
}

.stat-value.progress {
  color: var(--solar-gold, #ffd700);
}

.stat-value.pending {
  color: var(--star-silver, #778da9);
}

/* Legend Panel */
.legend-panel .subject-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.subject-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
}

.subject-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.study-types {
  display: flex;
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(65, 90, 119, 0.2);
}

.type-item {
  font-size: 0.7rem;
  color: var(--star-silver, #778da9);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.type-item .bullet {
  font-size: 0.6rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: rgba(27, 38, 59, 0.95);
  border: 1px solid rgba(65, 90, 119, 0.5);
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(20px);
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--lunar-white, #e0e1dd);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.75rem;
  color: var(--star-silver, #778da9);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input,
.form-select {
  background: rgba(13, 27, 42, 0.8);
  border: 1px solid rgba(65, 90, 119, 0.4);
  border-radius: 8px;
  padding: 0.6rem;
  color: var(--lunar-white, #e0e1dd);
  font-size: 0.9rem;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--nebula-teal, #00ffc8);
}

.form-select {
  cursor: pointer;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-save,
.btn-cancel {
  flex: 1;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-save {
  background: rgba(0, 255, 200, 0.2);
  border: 1px solid var(--nebula-teal, #00ffc8);
  color: var(--nebula-teal, #00ffc8);
}

.btn-save:hover {
  background: rgba(0, 255, 200, 0.3);
}

.btn-cancel {
  background: rgba(65, 90, 119, 0.3);
  border: 1px solid rgba(65, 90, 119, 0.5);
  color: var(--star-silver, #778da9);
}

.btn-cancel:hover {
  background: rgba(65, 90, 119, 0.4);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(13, 27, 42, 0.5);
}

::-webkit-scrollbar-thumb {
  background: rgba(65, 90, 119, 0.5);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(65, 90, 119, 0.7);
}

/* ============================================
   Beach Boys Theme (Low Contrast Mode)
   ============================================ */
:global(body.low-contrast) .schedule-crash-course {
  --surface-bg: rgba(255, 248, 240, 0.9);
  --text-primary: #5a4a3a;
  --text-secondary: #8b7355;
  --accent-primary: #7fdbda;
  --accent-secondary: #f5c89a;
}

:global(body.low-contrast) .schedule-header h1 {
  color: #5a4a3a;
}

:global(body.low-contrast) .schedule-header .subtitle {
  color: #d4a574;
}

:global(body.low-contrast) .toggle-btn {
  background: rgba(255, 248, 240, 0.8);
  border-color: rgba(212, 165, 116, 0.4);
  color: #8b7355;
}

:global(body.low-contrast) .toggle-btn.active {
  background: rgba(127, 219, 218, 0.2);
  border-color: #7fdbda;
  color: #5a8a89;
}

:global(body.low-contrast) .calendar-section,
:global(body.low-contrast) .sidebar-panel {
  background: rgba(255, 248, 240, 0.7);
  border-color: rgba(212, 165, 116, 0.3);
}

:global(body.low-contrast) .calendar-cell {
  background: rgba(255, 252, 247, 0.8);
  border-color: rgba(212, 165, 116, 0.2);
}

:global(body.low-contrast) .calendar-cell:hover {
  background: rgba(127, 219, 218, 0.15);
  border-color: #7fdbda;
}

:global(body.low-contrast) .calendar-cell.selected {
  border-color: #7fdbda;
  box-shadow: 0 0 15px rgba(127, 219, 218, 0.3);
}

:global(body.low-contrast) .day-header {
  color: #8b7355;
}

:global(body.low-contrast) .cell-day-number,
:global(body.low-contrast) .panel-title {
  color: #5a4a3a;
}

:global(body.low-contrast) .cell-date,
:global(body.low-contrast) .cell-type {
  color: #8b7355;
}

:global(body.low-contrast) .today-badge,
:global(body.low-contrast) .today-badge-lg {
  background: #7fdbda;
  color: #2a3a3a;
}

:global(body.low-contrast) .task-block.today-task {
  background: rgba(255, 252, 247, 0.8);
}

:global(body.low-contrast) .task-block.today-task .task-title {
  color: #5a4a3a;
}

:global(body.low-contrast) .task-block.past-task .task-title {
  color: rgba(139, 115, 85, 0.6);
}

:global(body.low-contrast) .task-block.inProgress {
  background: rgba(245, 200, 154, 0.2);
  border-color: rgba(245, 200, 154, 0.5);
}

:global(body.low-contrast) .task-block.inProgress .task-title {
  color: #d4a574;
}

:global(body.low-contrast) .task-block.done .task-title {
  color: #e8b4b8;
}

:global(body.low-contrast) .section-label {
  color: #8b7355;
}

:global(body.low-contrast) .stat-value.done {
  color: #7fdbda;
}

:global(body.low-contrast) .stat-value.progress {
  color: #f5c89a;
}

:global(body.low-contrast) .test-day {
  background: linear-gradient(
    135deg,
    rgba(232, 180, 184, 0.3),
    rgba(245, 200, 154, 0.2)
  );
  border-color: rgba(232, 180, 184, 0.5);
}

:global(body.low-contrast) .test-label {
  color: #d4a574;
}
</style>
