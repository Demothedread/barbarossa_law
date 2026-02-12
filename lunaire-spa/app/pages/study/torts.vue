<template>
  <div class="torts-study">
    <!-- ═══ Top Bar ═══ -->
    <div class="torts-study__topbar">
      <div class="torts-study__nav-left">
        <NuxtLink to="/study" class="torts-study__back"> ← Subjects </NuxtLink>
        <div class="torts-study__breadcrumb">
          <span class="torts-study__crumb torts-study__crumb--parent"
            >Study</span
          >
          <span class="torts-study__crumb-sep">/</span>
          <span class="torts-study__crumb torts-study__crumb--current"
            >Torts</span
          >
        </div>
      </div>

      <div class="torts-study__title-cluster">
        <span class="torts-study__icon">⚠️</span>
        <h1 class="torts-study__title">Torts</h1>
        <span class="torts-study__subtitle">{{ tortsData.tagline }}</span>
      </div>

      <div class="torts-study__controls">
        <!-- View toggle -->
        <div class="torts-study__view-toggle">
          <button
            class="torts-study__view-btn"
            :class="{ 'torts-study__view-btn--active': viewMode === 'map' }"
            @click="viewMode = 'map'"
            title="Mind Map View"
          >
            ◈ Map
          </button>
          <button
            class="torts-study__view-btn"
            :class="{ 'torts-study__view-btn--active': viewMode === 'outline' }"
            @click="viewMode = 'outline'"
            title="Outline View"
          >
            ☰ Outline
          </button>
        </div>

        <!-- Zoom controls -->
        <div v-if="viewMode === 'map'" class="torts-study__zoom">
          <button
            class="torts-study__zoom-btn"
            @click="zoomOut"
            title="Zoom Out"
          >
            −
          </button>
          <span class="torts-study__zoom-level"
            >{{ Math.round(transform.scale * 100) }}%</span
          >
          <button class="torts-study__zoom-btn" @click="zoomIn" title="Zoom In">
            +
          </button>
          <button
            class="torts-study__zoom-btn"
            @click="handleFitView"
            title="Fit View"
          >
            ⊡
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ Main Content ═══ -->
    <div class="torts-study__body">
      <!-- ─── MAP VIEW ─── -->
      <div
        v-if="viewMode === 'map'"
        ref="containerRef"
        class="torts-study__canvas-wrap"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @wheel.prevent="onWheel"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
      >
        <!-- Perspective grid bg -->
        <div class="torts-study__grid-bg" />

        <!-- Transformable canvas -->
        <div class="torts-study__canvas" :style="transformStyle">
          <!-- SVG Connectors -->
          <FlowConnectors
            :connection-defs="connectionDefs"
            :width="canvasWidth"
            :height="canvasHeight"
          />

          <!-- Topic Nodes -->
          <TopicNode
            v-for="topic in tortsData.topics"
            :key="topic.id"
            :topic="topic"
            :is-active="activeTopic === topic.id"
            @select="selectTopic"
          />
        </div>

        <!-- Mini-map -->
        <div class="torts-study__minimap">
          <div class="torts-study__minimap-label">Navigator</div>
          <div class="torts-study__minimap-canvas">
            <div
              v-for="topic in tortsData.topics"
              :key="topic.id"
              class="torts-study__minimap-node"
              :style="{
                left: (topic.position.x / canvasWidth) * 100 + '%',
                top: (topic.position.y / canvasHeight) * 100 + '%',
                background:
                  activeTopic === topic.id
                    ? topic.color
                    : 'rgba(119,141,169,0.5)',
              }"
              @click="centerOn(topic.position.x + 110, topic.position.y + 60)"
            />
            <!-- Viewport indicator -->
            <div
              class="torts-study__minimap-viewport"
              :style="miniMapViewport"
            />
          </div>
        </div>
      </div>

      <!-- ─── OUTLINE VIEW ─── -->
      <div v-else class="torts-study__outline-wrap">
        <div class="torts-study__outline">
          <!-- Frequency legend -->
          <div class="torts-study__freq-legend">
            <span class="torts-study__freq-title">MBE Frequency</span>
            <div class="torts-study__freq-scale">
              <span
                v-for="n in 5"
                :key="n"
                class="torts-study__freq-pip"
                :class="{ 'torts-study__freq-pip--filled': true }"
              >
                {{ n === 1 ? "Rare" : n === 5 ? "Every Exam" : "" }}
              </span>
            </div>
          </div>

          <!-- Topics in outline mode -->
          <div
            v-for="topic in sortedTopics"
            :key="topic.id"
            class="torts-study__outline-topic"
          >
            <div
              class="torts-study__outline-topic-header"
              :style="{ borderLeftColor: topic.color }"
              @click="toggleOutlineTopic(topic.id)"
            >
              <span class="torts-study__outline-topic-icon">{{
                topic.icon
              }}</span>
              <div class="torts-study__outline-topic-info">
                <h3>{{ topic.name }}</h3>
                <span class="torts-study__outline-topic-weight">{{
                  topic.mbeWeight
                }}</span>
              </div>
              <div class="torts-study__outline-topic-freq">
                <span
                  v-for="n in 5"
                  :key="n"
                  class="torts-study__outline-dot"
                  :class="{
                    'torts-study__outline-dot--on': n <= topic.frequency,
                  }"
                  :style="{
                    background: n <= topic.frequency ? topic.color : undefined,
                  }"
                />
              </div>
              <span class="torts-study__outline-chevron">
                {{ expandedOutlineTopics.has(topic.id) ? "▼" : "▶" }}
              </span>
            </div>

            <transition name="slide">
              <div
                v-if="expandedOutlineTopics.has(topic.id)"
                class="torts-study__outline-rules"
              >
                <StudyRuleCard
                  v-for="rule in topic.rules"
                  :key="rule.id"
                  :rule="rule"
                  :is-highlighted="highlightedRule === rule.id"
                  @navigate="navigateToRule"
                />
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- ─── SIDE PANEL (rule detail on map view click) ─── -->
      <transition name="slide-right">
        <div
          v-if="viewMode === 'map' && activeTopic"
          class="torts-study__side-panel"
        >
          <div class="torts-study__side-header">
            <h2 class="torts-study__side-title">
              {{ activeTopicData?.icon }} {{ activeTopicData?.name }}
            </h2>
            <button class="torts-study__side-close" @click="activeTopic = null">
              ×
            </button>
          </div>

          <div class="torts-study__side-meta">
            <span class="torts-study__side-weight">{{
              activeTopicData?.mbeWeight
            }}</span>
            <div class="torts-study__side-freq">
              <span
                v-for="n in 5"
                :key="n"
                class="torts-study__outline-dot"
                :class="{
                  'torts-study__outline-dot--on':
                    n <= (activeTopicData?.frequency || 0),
                }"
                :style="{
                  background:
                    n <= (activeTopicData?.frequency || 0)
                      ? activeTopicData?.color
                      : undefined,
                }"
              />
            </div>
          </div>

          <p class="torts-study__side-desc">
            {{ activeTopicData?.description }}
          </p>

          <div class="torts-study__side-rules">
            <StudyRuleCard
              v-for="rule in activeTopicData?.rules"
              :key="rule.id"
              :rule="rule"
              :is-highlighted="highlightedRule === rule.id"
              @navigate="navigateToRule"
            />
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import FlowConnectors from "~/components/study/FlowConnectors.vue";
import StudyRuleCard from "~/components/study/RuleCard.vue";
import TopicNode from "~/components/study/TopicNode.vue";
import {
  getRuleById,
  getTopicById,
  tortsData,
} from "~/composables/study/tortsData";
import { useStudyCanvas } from "~/composables/study/useStudyCanvas";

// ── State ──
const viewMode = ref<"map" | "outline">("map");
const activeTopic = ref<string | null>(null);
const highlightedRule = ref<string | null>(null);
const expandedOutlineTopics = ref(new Set<string>());

// ── Canvas Pan/Zoom ──
const {
  transform,
  transformStyle,
  containerRef,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onTouchStart,
  onTouchMove,
  fitToView,
  centerOn,
  zoomIn,
  zoomOut,
} = useStudyCanvas({
  initialScale: 0.75,
  initialX: 80,
  initialY: 40,
});

// ── Canvas dimensions ──
const canvasWidth = 1000;
const canvasHeight = 900;

// ── Computed ──
const activeTopicData = computed(() =>
  activeTopic.value ? getTopicById(activeTopic.value) : null,
);

// Sort topics by frequency (most tested first) for outline view
const sortedTopics = computed(() =>
  [...tortsData.topics].sort((a, b) => b.frequency - a.frequency),
);

// Connection definitions for SVG lines between topic nodes
const connectionDefs = computed(() => {
  const defs: any[] = [];
  // Negligence → Intentional Torts (thematic link)
  const neg = tortsData.topics.find((t) => t.id === "negligence");
  const it = tortsData.topics.find((t) => t.id === "intentional-torts");
  const sl = tortsData.topics.find((t) => t.id === "strict-liability");
  const pl = tortsData.topics.find((t) => t.id === "products-liability");
  const def = tortsData.topics.find((t) => t.id === "defamation");
  const nv = tortsData.topics.find((t) => t.id === "nuisance-vicarious");

  if (neg && it) {
    defs.push({
      from: { x: neg.position.x, y: neg.position.y, width: 220, height: 140 },
      to: { x: it.position.x, y: it.position.y, width: 220 },
      color: "rgba(0, 71, 255, 0.25)",
    });
  }
  if (neg && sl) {
    defs.push({
      from: { x: neg.position.x, y: neg.position.y, width: 220, height: 140 },
      to: { x: sl.position.x, y: sl.position.y, width: 220 },
      color: "rgba(123, 47, 190, 0.3)",
    });
  }
  if (sl && pl) {
    defs.push({
      from: { x: sl.position.x, y: sl.position.y, width: 220, height: 140 },
      to: { x: pl.position.x, y: pl.position.y, width: 220 },
      color: "rgba(255, 215, 0, 0.25)",
      dashed: true,
    });
  }
  if (it && def) {
    defs.push({
      from: { x: it.position.x, y: it.position.y, width: 220, height: 140 },
      to: { x: def.position.x, y: def.position.y, width: 220 },
      color: "rgba(255, 102, 178, 0.25)",
      dashed: true,
    });
  }
  if (pl && nv) {
    defs.push({
      from: { x: pl.position.x, y: pl.position.y, width: 220, height: 140 },
      to: { x: nv.position.x, y: nv.position.y, width: 220 },
      color: "rgba(0, 180, 216, 0.2)",
      dashed: true,
    });
  }
  if (neg && nv) {
    defs.push({
      from: { x: neg.position.x, y: neg.position.y, width: 220, height: 140 },
      to: { x: nv.position.x, y: nv.position.y, width: 220 },
      color: "rgba(0, 180, 216, 0.15)",
      dashed: true,
    });
  }

  return defs;
});

// Mini-map viewport indicator
const miniMapViewport = computed(() => {
  if (!containerRef.value) return {};
  const rect = containerRef.value.getBoundingClientRect?.() || {
    width: 800,
    height: 600,
  };
  const s = transform.value.scale;
  const vw = (rect.width / s / canvasWidth) * 100;
  const vh = (rect.height / s / canvasHeight) * 100;
  const vx = (-transform.value.x / s / canvasWidth) * 100;
  const vy = (-transform.value.y / s / canvasHeight) * 100;

  return {
    left: `${Math.max(0, vx)}%`,
    top: `${Math.max(0, vy)}%`,
    width: `${Math.min(100, vw)}%`,
    height: `${Math.min(100, vh)}%`,
  };
});

// ── Methods ──
function selectTopic(topicId: string) {
  if (activeTopic.value === topicId) {
    activeTopic.value = null;
  } else {
    activeTopic.value = topicId;
  }
}

function toggleOutlineTopic(topicId: string) {
  if (expandedOutlineTopics.value.has(topicId)) {
    expandedOutlineTopics.value.delete(topicId);
  } else {
    expandedOutlineTopics.value.add(topicId);
  }
  // Force reactivity
  expandedOutlineTopics.value = new Set(expandedOutlineTopics.value);
}

function navigateToRule(ruleId: string) {
  const rule = getRuleById(ruleId);
  if (!rule) return;

  // Find which topic contains this rule
  const topic = tortsData.topics.find((t) =>
    t.rules.some((r) => r.id === ruleId),
  );
  if (!topic) return;

  if (viewMode.value === "map") {
    activeTopic.value = topic.id;
    highlightedRule.value = ruleId;
    centerOn(topic.position.x + 110, topic.position.y + 60);
    setTimeout(() => {
      highlightedRule.value = null;
    }, 3000);
  } else {
    if (!expandedOutlineTopics.value.has(topic.id)) {
      expandedOutlineTopics.value.add(topic.id);
      expandedOutlineTopics.value = new Set(expandedOutlineTopics.value);
    }
    highlightedRule.value = ruleId;
    setTimeout(() => {
      highlightedRule.value = null;
    }, 3000);
  }
}

function handleFitView() {
  fitToView(canvasWidth, canvasHeight, 100);
}

// ── Lifecycle ──
onMounted(() => {
  nextTick(() => handleFitView());
});
</script>

<style scoped>
.torts-study {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ═══ Top Bar ═══ */
.torts-study__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid var(--bevel-dark);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
  z-index: 10;
  gap: 16px;
}

.torts-study__nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.torts-study__back {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--star-silver);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 6px 12px;
  border-radius: 0;
  transition: all 0.2s ease;
}

.torts-study__back:hover {
  color: var(--nebula-teal);
  background: rgba(0, 71, 255, 0.08);
}

.torts-study__breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
}

.torts-study__crumb {
  color: var(--star-silver);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.torts-study__crumb--current {
  color: var(--nebula-teal);
}

.torts-study__crumb-sep {
  color: rgba(119, 141, 169, 0.4);
}

.torts-study__title-cluster {
  display: flex;
  align-items: center;
  gap: 10px;
}

.torts-study__icon {
  font-size: 1.5rem;
}

.torts-study__title {
  font-family: "strenuous", var(--font-display);
  font-size: 1.4rem;
  font-weight: 200;
  color: var(--solar-gold);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.torts-study__subtitle {
  font-family: "good-times", var(--font-display);
  font-size: 0.55rem;
  color: var(--star-silver);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.torts-study__controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* View toggle */
.torts-study__view-toggle {
  display: flex;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  overflow: hidden;
}

.torts-study__view-btn {
  padding: 6px 14px;
  font-family: var(--font-display);
  font-size: 0.65rem;
  color: var(--star-silver);
  background: transparent;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: all 0.2s ease;
}

.torts-study__view-btn:hover {
  color: var(--lunar-white);
}

.torts-study__view-btn--active {
  color: var(--nebula-teal);
  background: rgba(0, 71, 255, 0.12);
}

/* Zoom */
.torts-study__zoom {
  display: flex;
  align-items: center;
  gap: 6px;
}

.torts-study__zoom-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  color: var(--star-silver);
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.torts-study__zoom-btn:hover {
  color: var(--nebula-teal);
  border-color: var(--nebula-teal);
}

.torts-study__zoom-level {
  font-family: var(--font-display);
  font-size: 0.65rem;
  color: var(--star-silver);
  min-width: 40px;
  text-align: center;
}

/* ═══ Body ═══ */
.torts-study__body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* ─── MAP VIEW ─── */
.torts-study__canvas-wrap {
  flex: 1;
  overflow: hidden;
  position: relative;
  cursor: grab;
  user-select: none;
}

.torts-study__canvas-wrap:active {
  cursor: grabbing;
}

.torts-study__grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.06) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

.torts-study__canvas {
  position: absolute;
  width: 1000px;
  height: 900px;
  transition: transform 0.08s linear;
  will-change: transform;
}

/* ─── Mini-map ─── */
.torts-study__minimap {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 160px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  overflow: hidden;
  z-index: 5;
}

.torts-study__minimap-label {
  font-family: var(--font-display);
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--star-silver);
  padding: 6px 10px;
  border-bottom: 1px solid var(--bevel-dark);
}

.torts-study__minimap-canvas {
  position: relative;
  height: 100px;
  margin: 8px;
}

.torts-study__minimap-node {
  position: absolute;
  width: 12px;
  height: 8px;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.torts-study__minimap-node:hover {
  transform: scale(1.5);
}

.torts-study__minimap-viewport {
  position: absolute;
  border: 1px solid rgba(0, 71, 255, 0.2);
  background: rgba(0, 71, 255, 0.05);
  border-radius: 2px;
  pointer-events: none;
  transition: all 0.1s linear;
}

/* ─── OUTLINE VIEW ─── */
.torts-study__outline-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.torts-study__outline {
  max-width: 800px;
  margin: 0 auto;
}

/* Frequency legend */
.torts-study__freq-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 0;
}

.torts-study__freq-title {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--star-silver);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.torts-study__freq-scale {
  display: flex;
  gap: 4px;
  align-items: center;
}

.torts-study__freq-pip {
  font-size: 0.6rem;
  color: var(--star-silver);
}

/* Outline topic */
.torts-study__outline-topic {
  margin-bottom: 12px;
}

.torts-study__outline-topic-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--bevel-dark);
  border-left: 4px solid var(--nebula-teal);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.torts-study__outline-topic-header:hover {
  background: rgba(0, 71, 255, 0.04);
  border-color: rgba(0, 71, 255, 0.15);
}

.torts-study__outline-topic-icon {
  font-size: 1.5rem;
}

.torts-study__outline-topic-info {
  flex: 1;
}

.torts-study__outline-topic-info h3 {
  font-family: var(--font-display);
  font-size: 0.95rem;
  color: var(--lunar-white);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 2px;
}

.torts-study__outline-topic-weight {
  font-size: 0.72rem;
  color: var(--star-silver);
}

.torts-study__outline-topic-freq {
  display: flex;
  gap: 3px;
}

.torts-study__outline-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  transition: background 0.2s ease;
}

.torts-study__outline-dot--on {
  box-shadow: 0 0 5px currentColor;
}

.torts-study__outline-chevron {
  font-size: 0.75rem;
  color: var(--star-silver);
  transition: transform 0.2s ease;
}

/* Outline rules */
.torts-study__outline-rules {
  padding: 12px 0 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ─── SIDE PANEL ─── */
.torts-study__side-panel {
  width: 420px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.04);
  border-left: 1px solid var(--bevel-dark);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 5;
}

.torts-study__side-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid var(--bevel-dark);
}

.torts-study__side-title {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--nebula-teal);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.torts-study__side-close {
  background: none;
  border: none;
  color: var(--star-silver);
  font-size: 1.3rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 0;
  transition: all 0.2s ease;
}

.torts-study__side-close:hover {
  color: var(--lunar-white);
  background: rgba(255, 255, 255, 0.05);
}

.torts-study__side-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
}

.torts-study__side-weight {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--solar-gold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.torts-study__side-freq {
  display: flex;
  gap: 3px;
}

.torts-study__side-desc {
  padding: 12px 18px;
  font-size: 0.85rem;
  color: var(--star-silver);
  line-height: 1.5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
}

.torts-study__side-rules {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ═══ Transitions ═══ */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 3000px;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ═══ Responsive ═══ */
@media (max-width: 900px) {
  .torts-study__topbar {
    flex-wrap: wrap;
    gap: 8px;
  }
  .torts-study__side-panel {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 90%;
    max-width: 420px;
  }
  .torts-study__minimap {
    display: none;
  }
  .torts-study__subtitle {
    display: none;
  }
}
</style>
