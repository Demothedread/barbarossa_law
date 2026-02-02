# 21-Day Bar Review Crash Course Schedule Component

An interactive, editable schedule component for managing a comprehensive 21-day bar exam preparation program.

## Features

### Core Functionality

- **Three View Modes**: Week view, 21-day calendar, and task list
- **Interactive Tasks**: Click states for pending → in-progress → done
- **Smart Task Management**: Automatic advancement of incomplete tasks to the next day
- **Persistent Storage**: LocalStorage integration for schedule persistence
- **Subject-Based Organization**: 10 color-coded subject areas with distinctive intergalactic palette
- **Study Type Classification**: MBE Questions (●), Essays (■), Subject Review (◆)

### User Features

- **Create Custom Tasks**: Quick task creation with natural language shortcuts
- **Edit & Delete**: Modify existing tasks or remove them entirely
- **Keyboard Shortcuts**:
  - `#subject` - Set subject area (e.g., `#evidence`)
  - `/studyType` - Set study type (e.g., `/mbe`)
- **Progress Tracking**: Visual stats showing completion, in-progress, and pending days
- **Task Prioritization**: Today's tasks shown first, followed by overdue items

### Color Scheme (Intergalactic Palette)

- Evidence: **Cyan** (#00D9FF)
- Civil Procedure: **Electric Yellow** (#FFED4E)
- Contracts: **Indigo Violet** (#9D4EDD)
- Constitutional Law: **Hot Pink** (#FF006E)
- Torts: **Aqua** (#00F5FF)
- Criminal Law & Procedure: **Orange** (#FB5607)
- Real Property: **Electric Blue** (#3A86FF)
- Wills & Trusts: **Purple** (#8338EC)
- Community Property: **Gold** (#FFBE0B)
- Professional Responsibility: **Neon Green** (#06FFA5)

## Daily Structure (~7 hours)

- 1.5 hr → 33 MBE Questions
- 1.5 hr → Deep MBE Review
- 2.0 hr → Primary Subject Rule Review
- 1.0 hr → Secondary Subject Rule Review
- 1.0 hr → Essay / CPT / Memorization

## Installation

### 1. Add Component to Your Project

```bash
cp components/ScheduleCrashCourse.vue lunaire-spa/components/
cp composables/useScheduleManagement.ts lunaire-spa/composables/
```

### 2. Import in Your Page/Layout

```vue
<script setup>
import ScheduleCrashCourse from "@/components/ScheduleCrashCourse.vue";
</script>

<template>
  <ScheduleCrashCourse />
</template>
```

### 3. Ensure Tailwind CSS is Configured

The component uses Tailwind CSS utilities. Verify your `tailwind.config.js` includes the component paths.

## Usage

### View Modes

- **Week View**: See the 21-day course organized into three weeks
- **Calendar View**: Grid layout of all 21 days with quick stats
- **Task List**: Detailed daily tasks with progress tracking

### Task States

1. **Pending** (default): Neutral styling
2. **In Progress** (click once): Orange font + orange bullet
3. **Done** (click twice): Red strikethrough + checkmark

### Creating Tasks

1. Enter task in input field
2. Optional: Use shortcuts
   - `Study contracts #contracts /essay` → Creates essay task for Contracts
   - `MBE practice /mbe` → Creates MBE practice task

### Editing Mode

- Toggle "Edit Schedule" button (authenticated users only)
- Hover over tasks to reveal Edit/Delete buttons
- Click "Edit" to modify task details in modal

## API Reference

### Component Props

None currently (can be extended for:)

- `startDate` - Course start date
- `userId` - For user-specific schedules
- `onTaskComplete` - Callback for task completion

### Composable: `useScheduleManagement()`

```typescript
const {
  tasks, // Ref<Task[]> - All tasks
  scheduleData, // Ref<ScheduleDay[]> - Schedule configuration
  loadSchedule, // () => void - Load from localStorage
  saveSchedule, // () => void - Save to localStorage
  addTask, // (task: Task) => Task
  updateTask, // (id: string, updates: Partial<Task>) => Task | null
  deleteTask, // (id: string) => boolean
  toggleTaskState, // (id: string) => Task | null
  getTasksByDay, // (day: number) => Task[]
  getIncompleteTasksByDay, // (day: number) => Task[]
  getOverdueTasks, // (currentDay: number) => Task[]
  getCompletedTasks, // () => Task[]
  stats, // Computed<Stats> - Completion stats
  resetToDefaultSchedule, // (defaultData: ScheduleDay[]) => void
} = useScheduleManagement();
```

### Data Types

```typescript
interface Task {
  id: string;
  day: number; // 1-21
  title: string;
  subject: string; // Subject area
  studyType: "mbe" | "essay" | "review";
  duration?: string; // e.g., "1.5 hours"
  state: "pending" | "inProgress" | "done";
}

interface ScheduleDay {
  number: number; // 1-21
  primary: string; // Primary subject
  secondary: string; // Secondary subject
  studyType: "mbe" | "essay" | "review";
}

interface Subject {
  name: string;
  color: string; // Hex color code
}

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: string; // Percentage as string
}
```

## Styling Customization

### Theme Colors

Edit subject color palette in component:

```vue
const subjects = ref([ { name: 'Evidence', color: '#00D9FF' }, // ... more
subjects ])
```

### Tailwind Classes

All styling uses Tailwind utilities. Key classes:

- `bg-slate-900` - Dark background
- `bg-gradient-to-br` - Day cards gradient
- `ring-2 ring-blue-500` - Selected state
- Text colors: `text-orange-300`, `text-red-400`, etc.

## Advanced Features

### Integration with Quiz Performance

(To be implemented)

```typescript
// Suggest study based on quiz results
function suggestStudyFromPerformance(quizResults) {
  // Low performance in subject X → suggest more review tasks
  // Can add tasks automatically based on performance
}
```

### User Authentication

Connect to your auth system:

```vue
// In component const { user } = useAuth() const isAuthenticated = computed(()
=> !!user.value) // Save schedule to backend const saveToBackend = async () => {
await api.post('/user/schedule', { tasks, schedule }) }
```

### Export/Import

```typescript
// Export schedule as JSON
const exportSchedule = () => {
  const data = JSON.stringify({
    tasks: tasks.value,
    schedule: scheduleData.value,
  });
  downloadJSON(data, "schedule.json");
};

// Import from CSV or JSON
const importSchedule = (file) => {
  const data = JSON.parse(file);
  tasks.value = data.tasks;
  scheduleData.value = data.schedule;
  saveSchedule();
};
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 14+)
- Uses: ES6+, CSS Grid, CSS Custom Properties

## Performance Notes

- Component handles 100+ tasks efficiently
- LocalStorage limit ~5-10MB (sufficient for schedule data)
- Re-renders optimized with Vue 3 composition API
- Computed properties cached

## Troubleshooting

### Tasks Not Saving

- Check browser LocalStorage is enabled
- Check browser console for errors
- Try `resetToDefaultSchedule()` to reinitialize

### Colors Not Displaying

- Verify Tailwind CSS is loaded
- Check browser devtools for CSS conflicts
- Ensure hex color format is correct

### Edit Mode Not Available

- Verify `isAuthenticated` is set to `true`
- Check auth system integration
- Set `isAuthenticated = ref(true)` temporarily for testing

## Future Enhancements

- [ ] Drag-and-drop task reordering
- [ ] Recurring task templates
- [ ] Time tracking integration
- [ ] Performance analytics dashboard
- [ ] Team collaboration features
- [ ] Mobile app sync
- [ ] PDF export/print
- [ ] Calendar integration (Google Calendar, etc.)
- [ ] Adaptive scheduling based on performance
- [ ] Notification reminders

## License

Barbarossa Law Quiz Platform - 2026

## Support

For issues or feature requests, contact the development team.
