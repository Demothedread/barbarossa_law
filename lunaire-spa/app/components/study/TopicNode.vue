<template>
  <div
    class="topic-node"
    :class="{
      'topic-node--active': isActive,
      'topic-node--hovered': isHovered,
    }"
    :style="nodeStyle"
    @click.stop="$emit('select', topic.id)"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 3D beveled frame -->
    <div class="topic-node__frame">
      <!-- Frequency indicator bar -->
      <div class="topic-node__freq-bar" :style="freqBarStyle" />

      <!-- Icon -->
      <div class="topic-node__icon">{{ topic.icon }}</div>

      <!-- Title -->
      <h3 class="topic-node__title">{{ topic.name }}</h3>

      <!-- Weight badge -->
      <div class="topic-node__weight">{{ topic.mbeWeight }}</div>

      <!-- Rule count -->
      <div class="topic-node__count">{{ topic.rules.length }} rules</div>

      <!-- Expand indicator -->
      <div class="topic-node__expand">
        {{ isActive ? "◆" : "◇" }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { StudyTopic } from "~/composables/study/tortsData";

const props = defineProps<{
  topic: StudyTopic;
  isActive: boolean;
}>();

defineEmits<{
  select: [topicId: string];
}>();

const isHovered = ref(false);

const nodeStyle = computed(() => ({
  "--node-color": props.topic.color,
  left: `${props.topic.position.x}px`,
  top: `${props.topic.position.y}px`,
}));

const freqBarStyle = computed(() => ({
  width: `${(props.topic.frequency / 5) * 100}%`,
  background: props.topic.color,
}));
</script>

<style scoped>
.topic-node {
  position: absolute;
  width: 220px;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.topic-node:hover {
  z-index: 10;
  transform: scale(1.05);
}

.topic-node--active {
  z-index: 20;
  transform: scale(1.08);
}

.topic-node__frame {
  padding: 20px;
  background: rgba(13, 27, 42, 0.9);
  border: 2px solid rgba(65, 90, 119, 0.4);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  /* 3D bevel effect */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3);
}

.topic-node:hover .topic-node__frame {
  border-color: var(--node-color);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 12px 40px rgba(0, 0, 0, 0.5),
    0 0 30px color-mix(in srgb, var(--node-color) 20%, transparent);
}

.topic-node--active .topic-node__frame {
  border-color: var(--node-color);
  background: rgba(13, 27, 42, 0.95);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 16px 48px rgba(0, 0, 0, 0.6),
    0 0 40px color-mix(in srgb, var(--node-color) 25%, transparent);
}

/* Frequency bar */
.topic-node__freq-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  border-radius: 0 0 3px 0;
  transition: width 0.5s ease;
}

/* Icon */
.topic-node__icon {
  font-size: 2rem;
  margin-bottom: 10px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Title */
.topic-node__title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  color: var(--lunar-white);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}

/* Weight */
.topic-node__weight {
  font-family: var(--font-display);
  font-size: 0.65rem;
  color: var(--node-color);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

/* Count */
.topic-node__count {
  font-size: 0.72rem;
  color: var(--star-silver);
}

/* Expand */
.topic-node__expand {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 0.8rem;
  color: var(--node-color);
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.topic-node:hover .topic-node__expand,
.topic-node--active .topic-node__expand {
  opacity: 1;
}
</style>
