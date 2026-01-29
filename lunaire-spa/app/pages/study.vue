<template>
  <div class="study-page">
    <div class="panel-container">
      <!-- Subject Overview Panel -->
      <div class="panel panel--wide">
        <div class="panel__header">
          <h2 class="panel__title">Subject Study Area</h2>
        </div>
        <div class="panel__body">
          <div class="study-intro">
            <h1 class="study-intro__title">Deep Dive Into the Law</h1>
            <p class="study-intro__desc">
              Select a subject to explore outlines, key concepts, and focused
              practice materials. Build your knowledge systematically before
              testing it.
            </p>
          </div>

          <!-- Subject Cards -->
          <div class="subject-cards">
            <div
              v-for="subject in subjects"
              :key="subject.id"
              class="subject-card"
              :class="{
                'subject-card--active': selectedSubject === subject.id,
              }"
              @click="selectSubject(subject.id)"
            >
              <div class="subject-card__icon">{{ subject.icon }}</div>
              <div class="subject-card__content">
                <h3 class="subject-card__title">{{ subject.name }}</h3>
                <p class="subject-card__topics">
                  {{ subject.topicCount }} topics
                </p>
                <div class="subject-card__mastery">
                  <div class="mastery-bar">
                    <div
                      class="mastery-bar__fill"
                      :style="{ width: `${subject.mastery}%` }"
                      :class="getMasteryClass(subject.mastery)"
                    ></div>
                  </div>
                  <span class="mastery-label"
                    >{{ subject.mastery }}% mastery</span
                  >
                </div>
              </div>
              <div class="subject-card__arrow">→</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Study Tools Panel -->
      <div class="panel panel--narrow">
        <div class="panel__header">
          <h2 class="panel__title">Study Tools</h2>
        </div>
        <div class="panel__body">
          <div class="study-tools">
            <button
              v-for="tool in studyTools"
              :key="tool.id"
              class="study-tool"
              @click="activateTool(tool.id)"
            >
              <span class="study-tool__icon">{{ tool.icon }}</span>
              <div class="study-tool__content">
                <span class="study-tool__name">{{ tool.name }}</span>
                <span class="study-tool__desc">{{ tool.description }}</span>
              </div>
            </button>
          </div>

          <div class="study-tip">
            <div class="study-tip__icon">💡</div>
            <h4 class="study-tip__title">Study Tip</h4>
            <p class="study-tip__content">{{ currentTip }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Subject Detail Modal -->
    <Teleport to="body">
      <div
        v-if="selectedSubject"
        class="modal-overlay"
        @click.self="selectedSubject = null"
      >
        <div class="modal modal--large">
          <div class="modal__header">
            <h3>{{ getSubjectName(selectedSubject) }}</h3>
            <button class="modal__close" @click="selectedSubject = null">
              ×
            </button>
          </div>
          <div class="modal__body">
            <div class="subject-detail">
              <!-- Topics List -->
              <div class="topics-section">
                <h4 class="topics-section__title">Topics & Subtopics</h4>
                <div class="topics-list">
                  <div
                    v-for="topic in getSubjectTopics(selectedSubject)"
                    :key="topic.name"
                    class="topic-item"
                  >
                    <div class="topic-item__header">
                      <span class="topic-item__name">{{ topic.name }}</span>
                      <span class="topic-item__progress"
                        >{{ topic.progress }}%</span
                      >
                    </div>
                    <div class="topic-item__bar">
                      <div
                        class="topic-item__fill"
                        :style="{ width: `${topic.progress}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Study Actions -->
              <div class="study-actions">
                <h4 class="study-actions__title">Quick Actions</h4>
                <div class="action-buttons">
                  <NuxtLink
                    :to="`/quiz/setup?subject=${selectedSubject}`"
                    class="btn btn--primary"
                  >
                    Practice Questions
                  </NuxtLink>
                  <button class="btn btn--secondary" @click="viewOutline">
                    View Outline
                  </button>
                  <button class="btn btn--secondary" @click="viewFlashcards">
                    Flashcards
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Tool Modal (Flashcards, Outline, etc.) -->
    <Teleport to="body">
      <div
        v-if="activeTool"
        class="modal-overlay"
        @click.self="activeTool = null"
      >
        <div class="modal">
          <div class="modal__header">
            <h3>{{ getToolName(activeTool) }}</h3>
            <button class="modal__close" @click="activeTool = null">×</button>
          </div>
          <div class="modal__body">
            <div class="tool-placeholder">
              <div class="tool-placeholder__icon">🚧</div>
              <p class="tool-placeholder__text">
                This study tool is coming soon. We're working on bringing you:
              </p>
              <ul class="feature-list">
                <li
                  v-for="feature in getToolFeatures(activeTool)"
                  :key="feature"
                >
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const selectedSubject = ref<string | null>(null);
const activeTool = ref<string | null>(null);

const subjects = [
  {
    id: "constitutional",
    name: "Constitutional Law",
    icon: "⚖️",
    topicCount: 12,
    mastery: 0,
  },
  {
    id: "contracts",
    name: "Contracts",
    icon: "📜",
    topicCount: 15,
    mastery: 0,
  },
  {
    id: "criminal",
    name: "Criminal Law & Procedure",
    icon: "🔒",
    topicCount: 18,
    mastery: 0,
  },
  { id: "evidence", name: "Evidence", icon: "🔍", topicCount: 14, mastery: 0 },
  {
    id: "property",
    name: "Real Property",
    icon: "🏠",
    topicCount: 16,
    mastery: 0,
  },
  { id: "torts", name: "Torts", icon: "⚠️", topicCount: 11, mastery: 0 },
  {
    id: "civpro",
    name: "Civil Procedure",
    icon: "📋",
    topicCount: 13,
    mastery: 0,
  },
];

const studyTools = [
  {
    id: "flashcards",
    name: "Flashcards",
    icon: "🃏",
    description: "Quick concept review",
  },
  {
    id: "outlines",
    name: "Outlines",
    icon: "📝",
    description: "Comprehensive subject guides",
  },
  {
    id: "mnemonics",
    name: "Mnemonics",
    icon: "🧠",
    description: "Memory aids & tricks",
  },
  {
    id: "mindmap",
    name: "Mind Maps",
    icon: "🗺️",
    description: "Visual concept connections",
  },
];

const studyTips = [
  "Active recall beats passive reading. Test yourself often!",
  "Spaced repetition is your friend. Review at increasing intervals.",
  "Teach concepts to others (or a rubber duck) to solidify understanding.",
  "Focus on understanding the 'why' behind rules, not just memorization.",
  "Take breaks! The Pomodoro technique (25 min work, 5 min break) works.",
  "Connect new concepts to things you already know.",
  "Practice writing out rules by hand — it aids memory.",
];

const currentTip = computed(() => {
  const index = Math.floor(Math.random() * studyTips.length);
  return studyTips[index];
});

const selectSubject = (id: string) => {
  selectedSubject.value = id;
};

const getSubjectName = (id: string) => {
  return subjects.find((s) => s.id === id)?.name || id;
};

const getSubjectTopics = (id: string) => {
  // Placeholder topics - would come from API in real implementation
  const topicMap: Record<string, { name: string; progress: number }[]> = {
    constitutional: [
      { name: "Judicial Review", progress: 0 },
      { name: "Federal Powers", progress: 0 },
      { name: "State Powers & Federalism", progress: 0 },
      { name: "Individual Rights", progress: 0 },
      { name: "First Amendment", progress: 0 },
      { name: "Due Process", progress: 0 },
      { name: "Equal Protection", progress: 0 },
    ],
    contracts: [
      { name: "Formation", progress: 0 },
      { name: "Consideration", progress: 0 },
      { name: "Defenses", progress: 0 },
      { name: "Statute of Frauds", progress: 0 },
      { name: "Third Party Beneficiaries", progress: 0 },
      { name: "Performance & Breach", progress: 0 },
      { name: "Remedies", progress: 0 },
    ],
    criminal: [
      { name: "Actus Reus & Mens Rea", progress: 0 },
      { name: "Inchoate Crimes", progress: 0 },
      { name: "Accomplice Liability", progress: 0 },
      { name: "Homicide", progress: 0 },
      { name: "Property Crimes", progress: 0 },
      { name: "Defenses", progress: 0 },
      { name: "Fourth Amendment", progress: 0 },
      { name: "Fifth Amendment", progress: 0 },
    ],
    evidence: [
      { name: "Relevance", progress: 0 },
      { name: "Character Evidence", progress: 0 },
      { name: "Hearsay", progress: 0 },
      { name: "Hearsay Exceptions", progress: 0 },
      { name: "Privileges", progress: 0 },
      { name: "Witnesses", progress: 0 },
    ],
    property: [
      { name: "Estates in Land", progress: 0 },
      { name: "Future Interests", progress: 0 },
      { name: "Concurrent Ownership", progress: 0 },
      { name: "Landlord-Tenant", progress: 0 },
      { name: "Easements", progress: 0 },
      { name: "Covenants", progress: 0 },
      { name: "Recording Acts", progress: 0 },
    ],
    torts: [
      { name: "Intentional Torts", progress: 0 },
      { name: "Negligence", progress: 0 },
      { name: "Strict Liability", progress: 0 },
      { name: "Products Liability", progress: 0 },
      { name: "Defamation", progress: 0 },
      { name: "Damages", progress: 0 },
    ],
    civpro: [
      { name: "Personal Jurisdiction", progress: 0 },
      { name: "Subject Matter Jurisdiction", progress: 0 },
      { name: "Venue", progress: 0 },
      { name: "Erie Doctrine", progress: 0 },
      { name: "Pleadings", progress: 0 },
      { name: "Discovery", progress: 0 },
      { name: "Summary Judgment", progress: 0 },
    ],
  };
  return topicMap[id] || [];
};

const getMasteryClass = (mastery: number) => {
  if (mastery >= 80) return "mastery-bar__fill--high";
  if (mastery >= 50) return "mastery-bar__fill--medium";
  return "mastery-bar__fill--low";
};

const activateTool = (toolId: string) => {
  activeTool.value = toolId;
};

const getToolName = (id: string) => {
  return studyTools.find((t) => t.id === id)?.name || id;
};

const getToolFeatures = (id: string) => {
  const features: Record<string, string[]> = {
    flashcards: [
      "Spaced repetition algorithm",
      "Custom deck creation",
      "Progress tracking",
      "Mobile-friendly interface",
    ],
    outlines: [
      "Comprehensive subject coverage",
      "Hyperlinked cross-references",
      "Downloadable PDFs",
      "Highlighting and notes",
    ],
    mnemonics: [
      "Proven memory techniques",
      "Subject-specific mnemonics",
      "Community contributions",
      "Create your own",
    ],
    mindmap: [
      "Interactive concept mapping",
      "Zoom and navigate",
      "Export as images",
      "Collaborative editing",
    ],
  };
  return features[id] || [];
};

const viewOutline = () => {
  activeTool.value = "outlines";
};

const viewFlashcards = () => {
  activeTool.value = "flashcards";
};
</script>

<style scoped>
.study-page {
  height: 100%;
  overflow: hidden;
}

.study-intro {
  margin-bottom: 32px;
}

.study-intro__title {
  font-family: "strenuous", var(--font-display);
  font-size: 2rem;
  font-weight: 200;
  color: var(--solar-gold);
  margin-bottom: 12px;
  letter-spacing: 0.1em;
}

.study-intro__desc {
  font-size: 1rem;
  color: var(--star-silver);
  max-width: 600px;
  line-height: 1.6;
}

/* Subject Cards */
.subject-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subject-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(27, 38, 59, 0.4);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.subject-card:hover {
  background: rgba(0, 255, 200, 0.05);
  border-color: var(--nebula-teal);
  transform: translateX(4px);
}

.subject-card--active {
  border-color: var(--solar-gold);
  background: rgba(255, 215, 0, 0.05);
}

.subject-card__icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.subject-card__content {
  flex: 1;
}

.subject-card__title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--lunar-white);
  margin-bottom: 4px;
}

.subject-card__topics {
  font-size: 0.8rem;
  color: var(--star-silver);
  margin-bottom: 8px;
}

.subject-card__mastery {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mastery-bar {
  flex: 1;
  height: 6px;
  background: rgba(65, 90, 119, 0.3);
  border-radius: 3px;
  overflow: hidden;
  max-width: 200px;
}

.mastery-bar__fill {
  height: 100%;
  background: var(--nebula-teal);
  transition: width 0.3s ease;
}

.mastery-bar__fill--high {
  background: var(--success-green, #4ade80);
}

.mastery-bar__fill--medium {
  background: var(--solar-gold);
}

.mastery-bar__fill--low {
  background: var(--nebula-teal);
}

.mastery-label {
  font-size: 0.75rem;
  color: var(--star-silver);
  min-width: 80px;
}

.subject-card__arrow {
  font-size: 1.5rem;
  color: var(--star-silver);
  opacity: 0;
  transition: all var(--transition-fast);
}

.subject-card:hover .subject-card__arrow {
  opacity: 1;
  transform: translateX(4px);
}

/* Study Tools */
.study-tools {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.study-tool {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(27, 38, 59, 0.4);
  border: 1px solid rgba(65, 90, 119, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.study-tool:hover {
  background: rgba(0, 255, 200, 0.1);
  border-color: var(--nebula-teal);
}

.study-tool__icon {
  font-size: 1.5rem;
}

.study-tool__content {
  display: flex;
  flex-direction: column;
}

.study-tool__name {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--lunar-white);
}

.study-tool__desc {
  font-size: 0.75rem;
  color: var(--star-silver);
}

/* Study Tip */
.study-tip {
  padding: 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.1) 0%,
    rgba(255, 215, 0, 0.05) 100%
  );
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 12px;
}

.study-tip__icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.study-tip__title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--solar-gold);
  margin-bottom: 8px;
}

.study-tip__content {
  font-size: 0.85rem;
  color: var(--lunar-white);
  line-height: 1.5;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 480px;
  background: var(--space-navy);
  border: 1px solid rgba(65, 90, 119, 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.modal--large {
  max-width: 640px;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(27, 38, 59, 0.5);
  border-bottom: 1px solid rgba(65, 90, 119, 0.3);
}

.modal__header h3 {
  font-size: 1rem;
  color: var(--nebula-teal);
}

.modal__close {
  background: none;
  border: none;
  color: var(--star-silver);
  font-size: 1.5rem;
  cursor: pointer;
}

.modal__body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

/* Subject Detail */
.subject-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.topics-section__title,
.study-actions__title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--solar-gold);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topic-item {
  padding: 12px;
  background: rgba(27, 38, 59, 0.4);
  border-radius: 8px;
}

.topic-item__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.topic-item__name {
  font-size: 0.9rem;
  color: var(--lunar-white);
}

.topic-item__progress {
  font-size: 0.8rem;
  color: var(--star-silver);
}

.topic-item__bar {
  height: 4px;
  background: rgba(65, 90, 119, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.topic-item__fill {
  height: 100%;
  background: var(--nebula-teal);
  transition: width 0.3s ease;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* Tool Placeholder */
.tool-placeholder {
  text-align: center;
  padding: 20px;
}

.tool-placeholder__icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.tool-placeholder__text {
  color: var(--star-silver);
  margin-bottom: 16px;
  line-height: 1.5;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.feature-list li {
  padding: 8px 0;
  padding-left: 24px;
  position: relative;
  color: var(--lunar-white);
  font-size: 0.9rem;
}

.feature-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: var(--nebula-teal);
}
</style>
