import { computed, ref } from "vue";

export function useScheduleManagement() {
  const tasks = ref([]);
  const scheduleData = ref([]);

  // Load schedule from localStorage
  function loadSchedule() {
    const stored = localStorage.getItem("barReviewSchedule");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        tasks.value = data.tasks || [];
        scheduleData.value = data.schedule || [];
      } catch (e) {
        console.error("Failed to load schedule:", e);
      }
    }
  }

  // Save schedule to localStorage
  function saveSchedule() {
    localStorage.setItem(
      "barReviewSchedule",
      JSON.stringify({
        tasks: tasks.value,
        schedule: scheduleData.value,
        savedAt: new Date().toISOString(),
      }),
    );
  }

  // Add task
  function addTask(task) {
    task.id = task.id || `task-${Date.now()}`;
    task.state = task.state || "pending";
    tasks.value.push(task);
    saveSchedule();
    return task;
  }

  // Update task
  function updateTask(taskId, updates) {
    const index = tasks.value.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...updates };
      saveSchedule();
      return tasks.value[index];
    }
    return null;
  }

  // Delete task
  function deleteTask(taskId) {
    const index = tasks.value.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      tasks.value.splice(index, 1);
      saveSchedule();
      return true;
    }
    return false;
  }

  // Toggle task state
  function toggleTaskState(taskId) {
    const task = tasks.value.find((t) => t.id === taskId);
    if (task) {
      const states = ["pending", "inProgress", "done"];
      const currentIndex = states.indexOf(task.state);
      task.state = states[(currentIndex + 1) % states.length];
      saveSchedule();
      return task;
    }
    return null;
  }

  // Move incomplete tasks to next day
  function promoteIncompleteTasksToNextDay(fromDay, toDay) {
    tasks.value.forEach((task) => {
      if (task.day === fromDay && task.state !== "done") {
        task.day = toDay;
      }
    });
    saveSchedule();
  }

  // Get tasks by day
  function getTasksByDay(day) {
    return tasks.value.filter((t) => t.day === day);
  }

  // Get incomplete tasks by day
  function getIncompleteTasksByDay(day) {
    return tasks.value.filter((t) => t.day === day && t.state !== "done");
  }

  // Get overdue tasks (from previous days, not completed)
  function getOverdueTasks(currentDay) {
    return tasks.value.filter((t) => t.day < currentDay && t.state !== "done");
  }

  // Get completed tasks
  function getCompletedTasks() {
    return tasks.value.filter((t) => t.state === "done");
  }

  // Get stats
  const stats = computed(() => {
    return {
      total: tasks.value.length,
      completed: tasks.value.filter((t) => t.state === "done").length,
      inProgress: tasks.value.filter((t) => t.state === "inProgress").length,
      pending: tasks.value.filter((t) => t.state === "pending").length,
      completionRate:
        tasks.value.length > 0
          ? (
              (tasks.value.filter((t) => t.state === "done").length /
                tasks.value.length) *
              100
            ).toFixed(1)
          : 0,
    };
  });

  // Reset to default schedule
  function resetToDefaultSchedule(defaultData) {
    scheduleData.value = JSON.parse(JSON.stringify(defaultData));
    tasks.value = [];
    saveSchedule();
  }

  return {
    tasks,
    scheduleData,
    loadSchedule,
    saveSchedule,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskState,
    promoteIncompleteTasksToNextDay,
    getTasksByDay,
    getIncompleteTasksByDay,
    getOverdueTasks,
    getCompletedTasks,
    stats,
    resetToDefaultSchedule,
  };
}
