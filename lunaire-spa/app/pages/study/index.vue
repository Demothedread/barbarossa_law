<template>
  <div class="study-landing">
    <!-- Perspective Grid Background -->
    <div class="perspective-grid">
      <div class="perspective-grid__lines" />
    </div>

    <!-- Header -->
    <div class="study-landing__header">
      <h1 class="study-landing__title">
        <span class="study-landing__title-main">Study</span>
        <span class="study-landing__title-sub">Deep Immersion</span>
      </h1>
      <p class="study-landing__tagline">
        Master the law one block at a time. Click a subject to enter.
      </p>
    </div>

    <!-- 3D Block Grid -->
    <div class="block-grid" ref="gridRef">
      <div
        v-for="(subject, i) in mbeSubjects"
        :key="subject.id"
        class="subject-block"
        :class="{
          'subject-block--ready': subject.ready,
          'subject-block--hovered': hoveredBlock === subject.id,
        }"
        :style="getBlockStyle(subject, i)"
        @mouseenter="hoveredBlock = subject.id"
        @mouseleave="hoveredBlock = null"
        @click="navigateToSubject(subject)"
      >
        <!-- Top face -->
        <div
          class="subject-block__top"
          :style="{
            background: `linear-gradient(135deg, ${subject.color}22, ${subject.color}11)`,
          }"
        >
          <span class="subject-block__weight">{{ subject.weight }}</span>
        </div>

        <!-- Front face -->
        <div class="subject-block__front">
          <div class="subject-block__icon">{{ subject.icon }}</div>
          <h3 class="subject-block__name">{{ subject.name }}</h3>
          <p class="subject-block__tagline">{{ subject.tagline }}</p>
          <div class="subject-block__meta">
            <span class="subject-block__topics"
              >{{ subject.topicCount }} topics</span
            >
            <span v-if="subject.ready" class="subject-block__badge">READY</span>
            <span v-else class="subject-block__badge subject-block__badge--soon"
              >SOON</span
            >
          </div>
        </div>

        <!-- Right face -->
        <div
          class="subject-block__right"
          :style="{
            background: `linear-gradient(180deg, ${subject.color}15, ${subject.color}08)`,
          }"
        />

        <!-- Glow effect -->
        <div
          v-if="subject.ready"
          class="subject-block__glow"
          :style="{
            background: `radial-gradient(ellipse, ${subject.color}20, transparent 70%)`,
          }"
        />
      </div>
    </div>

    <!-- Info Footer -->
    <div class="study-landing__footer">
      <div class="study-landing__legend">
        <span class="study-landing__legend-item">
          <span
            class="study-landing__legend-dot study-landing__legend-dot--ready"
          />
          Available
        </span>
        <span class="study-landing__legend-item">
          <span
            class="study-landing__legend-dot study-landing__legend-dot--soon"
          />
          Coming Soon
        </span>
      </div>
      <p class="study-landing__hint">
        ⚡ Torts is ready for deep dive. More subjects rolling out weekly.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { mbeSubjects } from "~/composables/study/tortsData";

const router = useRouter();
const hoveredBlock = ref<string | null>(null);
const gridRef = ref<HTMLElement | null>(null);

function getBlockStyle(subject: (typeof mbeSubjects)[number], index: number) {
  // Arrange in a hexagonal-ish grid pattern
  const cols = 4;
  const row = Math.floor(index / cols);
  const col = index % cols;
  const offsetX = row % 2 === 1 ? 60 : 0; // stagger odd rows

  return {
    "--block-color": subject.color,
    "--block-delay": `${index * 0.12}s`,
    gridColumn: col + 1,
    gridRow: row + 1,
    marginLeft: `${offsetX}px`,
  };
}

function navigateToSubject(subject: (typeof mbeSubjects)[number]) {
  if (subject.ready) {
    router.push(`/study/${subject.id}`);
  }
}
</script>

<style scoped>
.study-landing {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding: 40px;
}

/* ── Perspective Grid Background ── */
.perspective-grid {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.perspective-grid__lines {
  position: absolute;
  width: 200%;
  height: 200%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) perspective(800px) rotateX(60deg);
  background-image:
    linear-gradient(rgba(65, 90, 119, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(65, 90, 119, 0.08) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(
    ellipse 60% 50% at 50% 50%,
    black 20%,
    transparent 70%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 60% 50% at 50% 50%,
    black 20%,
    transparent 70%
  );
  animation: gridFloat 20s ease-in-out infinite;
}

@keyframes gridFloat {
  0%,
  100% {
    transform: translate(-50%, -50%) perspective(800px) rotateX(60deg)
      translateZ(0);
  }
  50% {
    transform: translate(-50%, -50%) perspective(800px) rotateX(60deg)
      translateZ(10px);
  }
}

/* ── Header ── */
.study-landing__header {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-bottom: 48px;
}

.study-landing__title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.study-landing__title-main {
  font-family: "strenuous", var(--font-display);
  font-size: 3rem;
  font-weight: 200;
  color: var(--solar-gold);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
}

.study-landing__title-sub {
  font-family: "good-times", var(--font-display);
  font-size: 0.75rem;
  color: var(--star-silver);
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.study-landing__tagline {
  margin-top: 12px;
  font-size: 0.95rem;
  color: var(--star-silver);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* ── 3D Block Grid ── */
.block-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
  perspective: 1200px;
}

.subject-block {
  position: relative;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: blockAppear 0.6s cubic-bezier(0.4, 0, 0.2, 1) var(--block-delay)
    both;
}

@keyframes blockAppear {
  from {
    opacity: 0;
    transform: translateY(30px) rotateX(-10deg) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotateX(0) scale(1);
  }
}

.subject-block:hover {
  transform: translateY(-8px) rotateX(2deg) rotateY(-2deg) scale(1.03);
}

.subject-block--ready {
  cursor: pointer;
}

.subject-block:not(.subject-block--ready) {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.6);
}

/* Front face */
.subject-block__front {
  padding: 28px 22px;
  background: rgba(13, 27, 42, 0.9);
  border: 1px solid rgba(65, 90, 119, 0.4);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 8px 32px rgba(0, 0, 0, 0.4);
}

.subject-block:hover .subject-block__front {
  border-color: var(--block-color);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 16px 48px rgba(0, 0, 0, 0.5),
    0 0 30px color-mix(in srgb, var(--block-color) 15%, transparent);
}

/* Top face (3D illusion) */
.subject-block__top {
  position: absolute;
  top: -8px;
  left: 4px;
  right: -4px;
  height: 12px;
  border-radius: 8px 8px 0 0;
  transform: skewX(-4deg);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 10px;
}

.subject-block__weight {
  font-family: var(--font-display);
  font-size: 0.55rem;
  color: var(--block-color);
  letter-spacing: 0.1em;
}

/* Right face (3D illusion) */
.subject-block__right {
  position: absolute;
  top: 4px;
  right: -6px;
  bottom: -4px;
  width: 10px;
  border-radius: 0 8px 8px 0;
  transform: skewY(-4deg);
  z-index: 1;
}

/* Content */
.subject-block__icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.subject-block__name {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--lunar-white);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}

.subject-block__tagline {
  font-size: 0.75rem;
  color: var(--star-silver);
  margin-bottom: 12px;
  line-height: 1.4;
}

.subject-block__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subject-block__topics {
  font-size: 0.7rem;
  color: var(--star-silver);
}

.subject-block__badge {
  padding: 2px 8px;
  background: rgba(0, 255, 200, 0.15);
  border: 1px solid rgba(0, 255, 200, 0.3);
  border-radius: 10px;
  font-family: var(--font-display);
  font-size: 0.55rem;
  color: var(--nebula-teal);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.subject-block__badge--soon {
  background: rgba(119, 141, 169, 0.15);
  border-color: rgba(119, 141, 169, 0.3);
  color: var(--star-silver);
}

/* Glow */
.subject-block__glow {
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 0;
}

.subject-block:hover .subject-block__glow {
  opacity: 1;
}

/* ── Footer ── */
.study-landing__footer {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid rgba(65, 90, 119, 0.2);
}

.study-landing__legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 12px;
}

.study-landing__legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--star-silver);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.study-landing__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.study-landing__legend-dot--ready {
  background: var(--nebula-teal);
  box-shadow: 0 0 8px rgba(0, 255, 200, 0.5);
}

.study-landing__legend-dot--soon {
  background: var(--star-silver);
  opacity: 0.5;
}

.study-landing__hint {
  font-size: 0.82rem;
  color: var(--star-silver);
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .block-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .subject-block {
    margin-left: 0 !important;
  }
}

@media (max-width: 500px) {
  .block-grid {
    grid-template-columns: 1fr;
  }
  .study-landing {
    padding: 20px;
  }
}
</style>
