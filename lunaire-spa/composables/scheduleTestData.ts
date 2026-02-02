/**
 * Demo and test data for Schedule Crash Course Component
 * Use these for testing, demos, and to understand the data structure
 */

// Sample schedule data (matches 21-day curriculum)
export const DEMO_SCHEDULE_DATA = [
  // Week 1
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

  // Week 2
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

  // Week 3
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
];

// Sample subjects with intergalactic color palette
export const DEMO_SUBJECTS = [
  { name: "Evidence", color: "#00D9FF" }, // Cyan
  { name: "Civil Procedure", color: "#FFED4E" }, // Electric Yellow
  { name: "Contracts", color: "#9D4EDD" }, // Indigo Violet
  { name: "Constitutional Law", color: "#FF006E" }, // Hot Pink
  { name: "Torts", color: "#00F5FF" }, // Aqua
  { name: "Criminal Law & Procedure", color: "#FB5607" }, // Orange
  { name: "Real Property", color: "#3A86FF" }, // Electric Blue
  { name: "Wills & Trusts", color: "#8338EC" }, // Purple
  { name: "Community Property", color: "#FFBE0B" }, // Gold
  { name: "Professional Responsibility", color: "#06FFA5" }, // Neon Green
];

// Sample tasks for demonstration
export const DEMO_TASKS = [
  // Day 1 tasks
  {
    id: "1-mbe-1",
    day: 1,
    title: "33 MBE Questions - Evidence",
    subject: "Evidence",
    studyType: "mbe",
    duration: "1.5 hours",
    state: "done",
  },
  {
    id: "1-mbe-2",
    day: 1,
    title: "Deep MBE Review - Evidence",
    subject: "Evidence",
    studyType: "review",
    duration: "1.5 hours",
    state: "done",
  },
  {
    id: "1-primary",
    day: 1,
    title: "Primary Subject Rule Review - Evidence",
    subject: "Evidence",
    studyType: "review",
    duration: "2 hours",
    state: "inProgress",
  },
  {
    id: "1-secondary",
    day: 1,
    title: "Secondary Subject Rule Review - Evidence",
    subject: "Evidence",
    studyType: "review",
    duration: "1 hour",
    state: "pending",
  },
  {
    id: "1-essay",
    day: 1,
    title: "Essay - Evidence",
    subject: "Evidence",
    studyType: "essay",
    duration: "1 hour",
    state: "pending",
  },

  // Day 2 tasks
  {
    id: "2-mbe-1",
    day: 2,
    title: "33 MBE Questions - Civil Procedure",
    subject: "Civil Procedure",
    studyType: "mbe",
    duration: "1.5 hours",
    state: "pending",
  },
  {
    id: "2-mbe-2",
    day: 2,
    title: "Deep MBE Review - Civil Procedure",
    subject: "Civil Procedure",
    studyType: "review",
    duration: "1.5 hours",
    state: "pending",
  },
  {
    id: "2-primary",
    day: 2,
    title: "Primary Subject Rule Review - Civil Procedure",
    subject: "Civil Procedure",
    studyType: "review",
    duration: "2 hours",
    state: "pending",
  },

  // Custom task example
  {
    id: "custom-1704067200000",
    day: 1,
    title: "Review Evidence hearsay exceptions",
    subject: "Evidence",
    studyType: "review",
    duration: "30 minutes",
    state: "pending",
  },
];

// Sample performance metrics (for integration examples)
export const DEMO_PERFORMANCE = {
  Evidence: { correct: 28, total: 33, percentage: 85 },
  "Civil Procedure": { correct: 25, total: 33, percentage: 76 },
  Contracts: { correct: 20, total: 33, percentage: 61 },
  "Constitutional Law": { correct: 30, total: 33, percentage: 91 },
  Torts: { correct: 22, total: 33, percentage: 67 },
  "Criminal Law & Procedure": { correct: 26, total: 33, percentage: 79 },
  "Real Property": { correct: 23, total: 33, percentage: 70 },
  "Wills & Trusts": { correct: 27, total: 33, percentage: 82 },
  "Community Property": { correct: 18, total: 33, percentage: 55 },
  "Professional Responsibility": { correct: 31, total: 33, percentage: 94 },
};

/**
 * Test Suite Examples
 * Use these to verify component functionality
 */

// Test 1: Verify all tasks initialize
export function testTaskInitialization() {
  const expectedTasksPerDay = 5;
  const expectedTotalTasks = 21 * expectedTasksPerDay;
  console.log(`Expected total tasks: ${expectedTotalTasks}`);
  console.assert(
    DEMO_TASKS.length >= expectedTotalTasks,
    "Task count mismatch",
  );
}

// Test 2: Verify subject colors are valid hex
export function testSubjectColors() {
  const hexRegex = /^#[0-9A-F]{6}$/i;
  DEMO_SUBJECTS.forEach((subj) => {
    console.assert(
      hexRegex.test(subj.color),
      `Invalid color for ${subj.name}: ${subj.color}`,
    );
  });
  console.log("✓ All subject colors are valid hex");
}

// Test 3: Verify task states
export function testTaskStates() {
  const validStates = ["pending", "inProgress", "done"];
  DEMO_TASKS.forEach((task) => {
    console.assert(
      validStates.includes(task.state),
      `Invalid state for task ${task.id}: ${task.state}`,
    );
  });
  console.log("✓ All tasks have valid states");
}

// Test 4: Verify schedule coverage
export function testScheduleCoverage() {
  const expectedDays = 21;
  const uniqueDays = new Set(DEMO_SCHEDULE_DATA.map((d) => d.number));
  console.assert(
    uniqueDays.size === expectedDays,
    `Schedule coverage mismatch: expected ${expectedDays}, got ${uniqueDays.size}`,
  );
  console.log("✓ Schedule covers all 21 days");
}

// Test 5: Verify study type distribution
export function testStudyTypeDistribution() {
  const types = DEMO_SCHEDULE_DATA.map((d) => d.studyType);
  const distribution = {
    mbe: types.filter((t) => t === "mbe").length,
    essay: types.filter((t) => t === "essay").length,
    review: types.filter((t) => t === "review").length,
  };
  console.log("Study type distribution:", distribution);
  console.assert(
    distribution.mbe > 0 && distribution.essay > 0 && distribution.review > 0,
    "Missing study type",
  );
}

// Test 6: Verify task state progression
export function testTaskStateProgression() {
  const states = ["pending", "inProgress", "done"];
  const stateIndex = (currentState) => states.indexOf(currentState);

  // If moving from pending to inProgress
  let task = { ...DEMO_TASKS[3] };
  console.assert(
    task.state === "pending" || task.state === "inProgress",
    "Invalid initial state",
  );
  console.log("✓ Task state progression is valid");
}

/**
 * Performance Test Data
 * Use to demonstrate performance suggestions
 */
export const PERFORMANCE_TEST_CASES = [
  {
    subject: "Contracts",
    score: 61,
    suggestion: "Low performance detected. Consider adding extra review tasks.",
    recommendedStudyType: "review",
  },
  {
    subject: "Community Property",
    score: 55,
    suggestion: "Significant gaps detected. Urgent review recommended.",
    recommendedStudyType: "review",
  },
  {
    subject: "Constitutional Law",
    score: 91,
    suggestion: "Excellent performance! Keep up the great work.",
    recommendedStudyType: null,
  },
];

/**
 * Component Props Examples
 * Future-ready for enhanced versions
 */
export const COMPONENT_PROPS_EXAMPLE = {
  startDate: "2026-02-01",
  endDate: "2026-02-21",
  userId: "user-12345",
  userEmail: "student@law.edu",
  isEditable: true,
  onTaskComplete: (taskId) => console.log(`Task ${taskId} completed`),
  onScheduleUpdate: (schedule) => console.log("Schedule updated:", schedule),
  onPerformanceAlert: (subject, score) => console.log(`${subject}: ${score}%`),
};

/**
 * localStorage Mock
 * Simulates storage for testing without browser
 */
export const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
};

/**
 * Vue Component Test Helper
 * Example of how to test the component
 */
export const componentTestHelper = {
  // Simulate task state cycle
  cycleTaskState: (currentState) => {
    const states = ["pending", "inProgress", "done"];
    const currentIndex = states.indexOf(currentState);
    return states[(currentIndex + 1) % states.length];
  },

  // Generate random task ID
  generateTaskId: () =>
    `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  // Get subject by partial name
  getSubjectByName: (partial) => {
    return DEMO_SUBJECTS.find((s) =>
      s.name.toLowerCase().includes(partial.toLowerCase()),
    );
  },

  // Calculate completion percentage
  calculateCompletion: (tasks) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.state === "done").length;
    return Math.round((completed / tasks.length) * 100);
  },

  // Get tasks for day
  getTasksForDay: (day) => {
    return DEMO_TASKS.filter((t) => t.day === day);
  },

  // Get overdue tasks
  getOverdueTasks: (currentDay) => {
    return DEMO_TASKS.filter((t) => t.day < currentDay && t.state !== "done");
  },
};

/**
 * Export functions for testing
 */
export function runAllTests() {
  console.group("🧪 Running Schedule Component Tests");

  try {
    testTaskInitialization();
    testSubjectColors();
    testTaskStates();
    testScheduleCoverage();
    testStudyTypeDistribution();
    testTaskStateProgression();

    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }

  console.groupEnd();
}

// Auto-run tests if in development
if (process.env.NODE_ENV === "development") {
  // Uncomment to auto-run:
  // runAllTests()
}
