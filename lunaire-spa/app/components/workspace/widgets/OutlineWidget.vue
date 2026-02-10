<template>
  <div class="outline-widget">
    <div class="outline-header">
      <select v-model="selectedSubject" class="subject-select">
        <option value="">All Subjects</option>
        <option v-for="subject in subjects" :key="subject" :value="subject">
          {{ subject }}
        </option>
      </select>
    </div>

    <div class="outline-content">
      <div
        v-for="topic in filteredTopics"
        :key="topic.id"
        class="topic-item"
        :class="{ expanded: expandedTopics.has(topic.id) }"
      >
        <div class="topic-header" @click="toggleTopic(topic.id)">
          <span class="topic-icon">
            {{ expandedTopics.has(topic.id) ? "📂" : "📁" }}
          </span>
          <span class="topic-title">{{ topic.title }}</span>
          <span class="topic-badge">{{ topic.subtopics?.length || 0 }}</span>
        </div>

        <Transition name="slide">
          <div v-if="expandedTopics.has(topic.id)" class="subtopics">
            <div
              v-for="subtopic in topic.subtopics"
              :key="subtopic.id"
              class="subtopic-item"
              :class="{ completed: completedSubtopics.has(subtopic.id) }"
              @click="toggleSubtopic(subtopic.id)"
            >
              <span class="subtopic-check">
                {{ completedSubtopics.has(subtopic.id) ? "✅" : "⬜" }}
              </span>
              <span class="subtopic-title">{{ subtopic.title }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <div v-if="filteredTopics.length === 0" class="empty-state">
        <span class="empty-icon">📚</span>
        <p>No topics found</p>
      </div>
    </div>

    <div class="outline-footer">
      <div class="progress-info">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
        <span class="progress-text">
          {{ completedSubtopics.size }}/{{ totalSubtopics }} completed
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Subtopic {
  id: string;
  title: string;
}

interface Topic {
  id: string;
  title: string;
  subject: string;
  subtopics: Subtopic[];
}

const STORAGE_KEY = "monobloc-outline-progress";

// Sample topics (would come from API in production)
const topics = ref<Topic[]>([
  {
    id: "contracts-1",
    title: "Contract Formation",
    subject: "Contracts",
    subtopics: [
      { id: "c1-1", title: "Offer and Acceptance" },
      { id: "c1-2", title: "Consideration" },
      { id: "c1-3", title: "Capacity" },
      { id: "c1-4", title: "Legality" },
    ],
  },
  {
    id: "contracts-2",
    title: "Contract Defenses",
    subject: "Contracts",
    subtopics: [
      { id: "c2-1", title: "Statute of Frauds" },
      { id: "c2-2", title: "Mistake" },
      { id: "c2-3", title: "Duress" },
      { id: "c2-4", title: "Undue Influence" },
    ],
  },
  {
    id: "torts-1",
    title: "Intentional Torts",
    subject: "Torts",
    subtopics: [
      { id: "t1-1", title: "Battery" },
      { id: "t1-2", title: "Assault" },
      { id: "t1-3", title: "False Imprisonment" },
      { id: "t1-4", title: "IIED" },
    ],
  },
  {
    id: "torts-2",
    title: "Negligence",
    subject: "Torts",
    subtopics: [
      { id: "t2-1", title: "Duty" },
      { id: "t2-2", title: "Breach" },
      { id: "t2-3", title: "Causation" },
      { id: "t2-4", title: "Damages" },
    ],
  },
  {
    id: "property-1",
    title: "Estates in Land",
    subject: "Property",
    subtopics: [
      { id: "p1-1", title: "Fee Simple" },
      { id: "p1-2", title: "Life Estate" },
      { id: "p1-3", title: "Future Interests" },
      { id: "p1-4", title: "RAP" },
    ],
  },
]);

const selectedSubject = ref("");
const expandedTopics = ref(new Set<string>());
const completedSubtopics = ref(new Set<string>());

// Computed
const subjects = computed(() => {
  return [...new Set(topics.value.map((t) => t.subject))];
});

const filteredTopics = computed(() => {
  if (!selectedSubject.value) return topics.value;
  return topics.value.filter((t) => t.subject === selectedSubject.value);
});

const totalSubtopics = computed(() => {
  return topics.value.reduce((sum, t) => sum + (t.subtopics?.length || 0), 0);
});

const progressPercent = computed(() => {
  if (totalSubtopics.value === 0) return 0;
  return Math.round(
    (completedSubtopics.value.size / totalSubtopics.value) * 100,
  );
});

// Actions
const toggleTopic = (id: string) => {
  if (expandedTopics.value.has(id)) {
    expandedTopics.value.delete(id);
  } else {
    expandedTopics.value.add(id);
  }
};

const toggleSubtopic = (id: string) => {
  if (completedSubtopics.value.has(id)) {
    completedSubtopics.value.delete(id);
  } else {
    completedSubtopics.value.add(id);
  }
  saveProgress();
};

// Persistence
const saveProgress = () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...completedSubtopics.value]),
  );
};

const loadProgress = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      completedSubtopics.value = new Set(JSON.parse(saved));
    }
  } catch (e) {
    // Ignore errors
  }
};

onMounted(() => {
  loadProgress();
});
</script>

<style scoped>
.outline-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0f172a;
}

.outline-header {
  padding: 12px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.subject-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.5);
  color: #fff;
  font-size: 0.9rem;
}

.subject-select:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.5);
}

.outline-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.topic-item {
  margin-bottom: 8px;
}

.topic-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;
}

.topic-header:hover {
  background: rgba(30, 41, 59, 0.8);
}

.topic-icon {
  font-size: 1rem;
}

.topic-title {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.topic-badge {
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(100, 116, 139, 0.3);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.subtopics {
  padding: 8px 0 8px 24px;
}

.subtopic-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.subtopic-item:hover {
  background: rgba(100, 116, 139, 0.1);
}

.subtopic-item.completed .subtopic-title {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: line-through;
}

.subtopic-check {
  font-size: 0.9rem;
}

.subtopic-title {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.outline-footer {
  padding: 12px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 6px;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #22c55e);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
