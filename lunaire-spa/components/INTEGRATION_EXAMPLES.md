/\*\*

- Example integration of the Schedule Crash Course component
- Add this to your page/layout file
  \*/

// Example 1: Basic setup in a page component
<template>

  <div class="page-schedule">
    <ScheduleCrashCourse />
  </div>
</template>

<script setup>
import ScheduleCrashCourse from '@/components/ScheduleCrashCourse.vue'
</script>

---

// Example 2: With auth integration
<template>

  <div v-if="user" class="page-schedule">
    <div class="schedule-header">
      <h1>{{ user.name }}'s 21-Day Bar Review</h1>
      <div class="schedule-actions">
        <button @click="exportSchedule" class="btn-secondary">
          Download Schedule
        </button>
        <button @click="syncToBackend" class="btn-primary">
          Save to Account
        </button>
      </div>
    </div>
    <ScheduleCrashCourse ref="scheduleComponent" />
  </div>
  <div v-else class="alert-warning">
    Please log in to access your schedule
  </div>
</template>

<script setup>
import ScheduleCrashCourse from '@/components/ScheduleCrashCourse.vue'
import { useAuth } from '@/composables/useAuth'
import { useScheduleManagement } from '@/composables/useScheduleManagement'
import { ref } from 'vue'

const { user } = useAuth()
const scheduleComponent = ref(null)
const { tasks, scheduleData, saveSchedule } = useScheduleManagement()

const exportSchedule = () => {
  const data = JSON.stringify({
    user: user.value.id,
    tasks: tasks.value,
    schedule: scheduleData.value,
    exportedAt: new Date().toISOString()
  }, null, 2)
  
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bar-review-schedule-${new Date().toISOString().split('T')[0]}.json`
  a.click()
}

const syncToBackend = async () => {
  try {
    const response = await fetch('/api/user/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: tasks.value,
        schedule: scheduleData.value,
        updatedAt: new Date().toISOString()
      })
    })
    
    if (response.ok) {
      alert('Schedule saved to your account!')
    }
  } catch (error) {
    console.error('Failed to sync schedule:', error)
    alert('Error saving schedule. Please try again.')
  }
}
</script>

---

// Example 3: With quiz performance integration
<template>

  <div class="page-schedule-with-performance">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Main Schedule -->
      <div class="lg:col-span-3">
        <ScheduleCrashCourse ref="scheduleComponent" />
      </div>
      
      <!-- Performance Metrics Sidebar -->
      <div class="performance-sidebar">
        <h3>Performance Insights</h3>
        <div v-for="subject in performanceBySubject" :key="subject.name" class="performance-card">
          <div class="subject-name">{{ subject.name }}</div>
          <div class="performance-bar">
            <div 
              class="bar-fill" 
              :style="{ 
                width: subject.correctPercentage + '%',
                backgroundColor: subject.color
              }"
            ></div>
          </div>
          <div class="performance-text">
            {{ subject.correct }}/{{ subject.total }} ({{ subject.correctPercentage }}%)
          </div>
          <button 
            v-if="subject.correctPercentage < 70"
            @click="suggestMoreStudy(subject.name)"
            class="btn-small btn-warning"
          >
            Need Review
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ScheduleCrashCourse from '@/components/ScheduleCrashCourse.vue'
import { useScheduleManagement } from '@/composables/useScheduleManagement'
import { ref, computed } from 'vue'

const scheduleComponent = ref(null)
const { addTask } = useScheduleManagement()

// Mock quiz results
const quizPerformance = ref({
  Evidence: { correct: 28, total: 33 },
  'Civil Procedure': { correct: 25, total: 33 },
  Contracts: { correct: 20, total: 33 },
  'Constitutional Law': { correct: 30, total: 33 },
  Torts: { correct: 22, total: 33 },
  // ... more subjects
})

const performanceBySubject = computed(() => {
  const subjects = [
    { name: 'Evidence', color: '#00D9FF' },
    { name: 'Civil Procedure', color: '#FFED4E' },
    { name: 'Contracts', color: '#9D4EDD' },
    // ... all subjects
  ]
  
  return subjects.map(subj => {
    const perf = quizPerformance.value[subj.name] || { correct: 0, total: 0 }
    return {
      ...subj,
      correct: perf.correct,
      total: perf.total,
      correctPercentage: perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0
    }
  })
})

const suggestMoreStudy = (subjectName) => {
  // Add extra review task for weak subject
  addTask({
    day: new Date().getDate(), // Today
    title: `Extra Review - ${subjectName}`,
    subject: subjectName,
    studyType: 'review',
    duration: '1.5 hours',
    state: 'pending'
  })
}
</script>

---

// Example 4: Mobile responsive wrapper
<template>

  <div class="schedule-mobile-wrapper">
    <div class="mobile-header sticky top-0 bg-slate-900 z-10">
      <button 
        @click="currentTab = 'schedule'"
        :class="['tab', { active: currentTab === 'schedule' }]"
      >
        📅 Schedule
      </button>
      <button 
        @click="currentTab = 'tasks'"
        :class="['tab', { active: currentTab === 'tasks' }]"
      >
        ✓ Tasks
      </button>
      <button 
        @click="currentTab = 'progress'"
        :class="['tab', { active: currentTab === 'progress' }]"
      >
        📊 Progress
      </button>
    </div>
    
    <div class="mobile-content">
      <ScheduleCrashCourse v-if="currentTab === 'schedule'" />
      <div v-else-if="currentTab === 'tasks'" class="mobile-tasks">
        <!-- Tasks view optimized for mobile -->
      </div>
      <div v-else class="mobile-progress">
        <!-- Progress view optimized for mobile -->
      </div>
    </div>
  </div>
</template>

<script setup>
import ScheduleCrashCourse from '@/components/ScheduleCrashCourse.vue'
import { ref } from 'vue'

const currentTab = ref('schedule')
</script>

<style scoped>
.mobile-header {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}

.tab {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: #1e293b;
  color: #94a3b8;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.tab.active {
  background: #3b82f6;
  color: white;
}
</style>

---

// Example 5: Backend API endpoints (Node.js/Express example)

import express from 'express'
import { Schedule } from './models/Schedule'
import { Task } from './models/Task'
import { auth } from './middleware/auth'

const router = express.Router()

// Get user's schedule
router.get('/api/user/schedule', auth, async (req, res) => {
try {
const schedule = await Schedule.findOne({ userId: req.user.id })
const tasks = await Task.find({ userId: req.user.id })
res.json({ schedule, tasks })
} catch (error) {
res.status(500).json({ error: error.message })
}
})

// Save user's schedule
router.post('/api/user/schedule', auth, async (req, res) => {
try {
const { tasks, schedule } = req.body

    // Upsert schedule
    await Schedule.updateOne(
      { userId: req.user.id },
      { $set: { data: schedule, updatedAt: new Date() } },
      { upsert: true }
    )

    // Update tasks
    await Task.deleteMany({ userId: req.user.id })
    await Task.insertMany(
      tasks.map(t => ({ ...t, userId: req.user.id }))
    )

    res.json({ success: true, message: 'Schedule saved' })

} catch (error) {
res.status(500).json({ error: error.message })
}
})

// Add task suggestion based on quiz performance
router.post('/api/user/suggest-study', auth, async (req, res) => {
try {
const { subjectName, performanceScore } = req.body

    if (performanceScore < 70) {
      // Create suggestion task
      const task = new Task({
        userId: req.user.id,
        title: `Suggested Review - ${subjectName}`,
        subject: subjectName,
        studyType: 'review',
        state: 'pending',
        suggested: true
      })

      await task.save()
      res.json({ success: true, task })
    }

} catch (error) {
res.status(500).json({ error: error.message })
}
})

export default router
