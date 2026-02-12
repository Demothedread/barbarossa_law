<template>
  <div
    class="rule-card"
    :class="{
      'rule-card--expanded': isExpanded,
      'rule-card--highlight': isHighlighted,
    }"
    @click.stop="toggle"
  >
    <!-- Collapsed Header -->
    <div class="rule-card__header">
      <div class="rule-card__freq">
        <span
          v-for="n in 5"
          :key="n"
          class="rule-card__dot"
          :class="{ 'rule-card__dot--active': n <= rule.frequency }"
        />
      </div>
      <h4 class="rule-card__name">{{ rule.shortName || rule.name }}</h4>
      <span class="rule-card__chevron">{{ isExpanded ? "▼" : "▶" }}</span>
    </div>

    <!-- Expanded Content -->
    <transition name="fan">
      <div v-if="isExpanded" class="rule-card__body" @click.stop>
        <!-- Mnemonic Badge -->
        <div v-if="rule.mnemonic" class="rule-card__mnemonic">
          🧠 {{ rule.mnemonic }}
        </div>

        <!-- Rule Statement -->
        <div class="rule-card__section rule-card__section--rule">
          <div class="rule-card__section-label">RULE</div>
          <p class="rule-card__rule-text">{{ rule.ruleStatement }}</p>
        </div>

        <!-- Elements -->
        <div class="rule-card__section rule-card__section--elements">
          <div class="rule-card__section-label">ELEMENTS</div>
          <div class="rule-card__elements">
            <div
              v-for="(el, i) in rule.elements"
              :key="i"
              class="rule-card__element"
            >
              <div class="rule-card__element-header">
                <span class="rule-card__element-num">{{ i + 1 }}</span>
                <strong>{{ el.name }}</strong>
              </div>
              <p class="rule-card__element-desc">{{ el.description }}</p>
              <!-- Sub-elements -->
              <div v-if="el.subElements" class="rule-card__sub-elements">
                <div
                  v-for="(sub, j) in el.subElements"
                  :key="j"
                  class="rule-card__sub-element"
                >
                  <span class="rule-card__sub-bullet">›</span>
                  <div>
                    <strong>{{ sub.name }}:</strong> {{ sub.description }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Court's Test -->
        <div class="rule-card__section rule-card__section--test">
          <div class="rule-card__section-label">⚖️ THE TEST</div>
          <div class="rule-card__test">
            <div class="rule-card__test-name">{{ rule.test.name }}</div>
            <div class="rule-card__test-standard">
              Standard: {{ rule.test.standard }}
            </div>
            <p class="rule-card__test-desc">{{ rule.test.description }}</p>
          </div>
        </div>

        <!-- Exceptions (expandable) -->
        <div
          v-if="rule.exceptions.length"
          class="rule-card__section rule-card__section--exceptions"
        >
          <div
            class="rule-card__section-label rule-card__section-label--clickable"
            @click.stop="showExceptions = !showExceptions"
          >
            ⚠️ EXCEPTIONS ({{ rule.exceptions.length }})
            <span>{{ showExceptions ? "▼" : "▶" }}</span>
          </div>
          <transition name="fan">
            <div v-if="showExceptions" class="rule-card__exceptions">
              <div
                v-for="(ex, i) in rule.exceptions"
                :key="i"
                class="rule-card__exception"
              >
                <div class="rule-card__exception-name">{{ ex.name }}</div>
                <p>{{ ex.rule }}</p>
                <ul v-if="ex.elements" class="rule-card__exception-elements">
                  <li v-for="(eel, j) in ex.elements" :key="j">{{ eel }}</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- Exceptions to Exceptions -->
        <div
          v-if="rule.exceptionsToExceptions?.length"
          class="rule-card__section rule-card__section--ex-ex"
        >
          <div
            class="rule-card__section-label rule-card__section-label--clickable"
            @click.stop="showExEx = !showExEx"
          >
            🔄 EXCEPTIONS TO EXCEPTIONS ({{
              rule.exceptionsToExceptions.length
            }})
            <span>{{ showExEx ? "▼" : "▶" }}</span>
          </div>
          <transition name="fan">
            <div v-if="showExEx" class="rule-card__exceptions">
              <div
                v-for="(ex, i) in rule.exceptionsToExceptions"
                :key="i"
                class="rule-card__exception rule-card__exception--override"
              >
                <div class="rule-card__exception-name">{{ ex.name }}</div>
                <p>{{ ex.rule }}</p>
                <div class="rule-card__override-tag">
                  Overrides: {{ ex.appliesTo }}
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Policy -->
        <div
          v-if="rule.policyFor.length || rule.policyAgainst.length"
          class="rule-card__section rule-card__section--policy"
        >
          <div
            class="rule-card__section-label rule-card__section-label--clickable"
            @click.stop="showPolicy = !showPolicy"
          >
            📋 POLICY ARGUMENTS
            <span>{{ showPolicy ? "▼" : "▶" }}</span>
          </div>
          <transition name="fan">
            <div v-if="showPolicy" class="rule-card__policy">
              <div v-if="rule.policyFor.length" class="rule-card__policy-col">
                <div
                  class="rule-card__policy-header rule-card__policy-header--for"
                >
                  FOR ✓
                </div>
                <ul>
                  <li v-for="(p, i) in rule.policyFor" :key="i">{{ p }}</li>
                </ul>
              </div>
              <div
                v-if="rule.policyAgainst.length"
                class="rule-card__policy-col"
              >
                <div
                  class="rule-card__policy-header rule-card__policy-header--against"
                >
                  AGAINST ✗
                </div>
                <ul>
                  <li v-for="(p, i) in rule.policyAgainst" :key="i">{{ p }}</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- Exam Tips -->
        <div
          v-if="rule.examTips.length"
          class="rule-card__section rule-card__section--tips"
        >
          <div class="rule-card__section-label">⚡ EXAM TIPS</div>
          <div class="rule-card__tips">
            <div
              v-for="(tip, i) in rule.examTips"
              :key="i"
              class="rule-card__tip"
            >
              {{ tip }}
            </div>
          </div>
        </div>

        <!-- Key Case -->
        <div v-if="rule.keyCase" class="rule-card__case">
          📖 {{ rule.keyCase }}
        </div>

        <!-- Connection Badges -->
        <div v-if="rule.connections.length" class="rule-card__connections">
          <span class="rule-card__conn-label">Related:</span>
          <button
            v-for="connId in rule.connections"
            :key="connId"
            class="rule-card__conn-badge"
            @click.stop="$emit('navigate', connId)"
          >
            {{ getConnectionName(connId) }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { StudyRule } from "~/composables/study/tortsData";
import { getRuleById } from "~/composables/study/tortsData";

const props = defineProps<{
  rule: StudyRule;
  isHighlighted?: boolean;
}>();

defineEmits<{
  navigate: [ruleId: string];
}>();

const isExpanded = ref(false);
const showExceptions = ref(false);
const showExEx = ref(false);
const showPolicy = ref(false);

function toggle() {
  isExpanded.value = !isExpanded.value;
  if (!isExpanded.value) {
    showExceptions.value = false;
    showExEx.value = false;
    showPolicy.value = false;
  }
}

function getConnectionName(id: string): string {
  return getRuleById(id)?.shortName || getRuleById(id)?.name || id;
}
</script>

<style scoped>
.rule-card {
  background: rgba(13, 27, 42, 0.85);
  border: 1px solid rgba(65, 90, 119, 0.4);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.rule-card:hover {
  border-color: var(--nebula-teal);
  box-shadow: 0 0 20px rgba(0, 255, 200, 0.1);
}

.rule-card--expanded {
  border-color: var(--nebula-teal);
  box-shadow:
    0 0 30px rgba(0, 255, 200, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  cursor: default;
}

.rule-card--highlight {
  border-color: var(--solar-gold);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.2);
}

/* Header */
.rule-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
}

.rule-card__header:hover {
  background: rgba(0, 255, 200, 0.03);
}

.rule-card__freq {
  display: flex;
  gap: 3px;
}

.rule-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(65, 90, 119, 0.4);
}

.rule-card__dot--active {
  background: var(--nebula-teal);
  box-shadow: 0 0 4px rgba(0, 255, 200, 0.5);
}

.rule-card__name {
  flex: 1;
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--lunar-white);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.rule-card__chevron {
  font-size: 0.7rem;
  color: var(--star-silver);
  transition: transform 0.3s ease;
}

/* Body */
.rule-card__body {
  padding: 0 18px 18px;
  border-top: 1px solid rgba(65, 90, 119, 0.2);
}

/* Mnemonic */
.rule-card__mnemonic {
  margin: 14px 0;
  padding: 10px 14px;
  background: linear-gradient(
    135deg,
    rgba(178, 102, 255, 0.15),
    rgba(178, 102, 255, 0.05)
  );
  border: 1px solid rgba(178, 102, 255, 0.3);
  border-radius: 8px;
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--cosmic-purple);
  letter-spacing: 0.05em;
}

/* Sections */
.rule-card__section {
  margin-top: 16px;
}

.rule-card__section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-display);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--star-silver);
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(65, 90, 119, 0.2);
}

.rule-card__section-label--clickable {
  cursor: pointer;
  transition: color 0.2s ease;
}

.rule-card__section-label--clickable:hover {
  color: var(--nebula-teal);
}

/* Rule Statement */
.rule-card__section--rule {
  border-left: 3px solid var(--nebula-teal);
  padding-left: 14px;
}

.rule-card__rule-text {
  font-family: var(--font-legal);
  font-size: 0.92rem;
  line-height: 1.65;
  color: var(--lunar-white);
}

/* Elements */
.rule-card__elements {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-card__element {
  padding: 10px 14px;
  background: rgba(27, 38, 59, 0.5);
  border-radius: 8px;
  border-left: 3px solid var(--solar-gold);
}

.rule-card__element-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 0.85rem;
  color: var(--lunar-white);
}

.rule-card__element-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 215, 0, 0.2);
  color: var(--solar-gold);
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.rule-card__element-desc {
  font-size: 0.82rem;
  color: var(--star-silver);
  line-height: 1.5;
  margin-left: 30px;
}

.rule-card__sub-elements {
  margin-left: 30px;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-card__sub-element {
  display: flex;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--star-silver);
  line-height: 1.4;
}

.rule-card__sub-bullet {
  color: var(--nebula-teal);
  flex-shrink: 0;
}

/* Test */
.rule-card__test {
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    rgba(0, 255, 200, 0.08),
    rgba(0, 255, 200, 0.02)
  );
  border: 1px solid rgba(0, 255, 200, 0.2);
  border-radius: 8px;
}

.rule-card__test-name {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--nebula-teal);
  margin-bottom: 4px;
}

.rule-card__test-standard {
  font-size: 0.75rem;
  color: var(--solar-gold);
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.rule-card__test-desc {
  font-family: var(--font-legal);
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--lunar-white);
}

/* Exceptions */
.rule-card__exceptions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-card__exception {
  padding: 10px 14px;
  background: rgba(255, 107, 53, 0.06);
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 8px;
}

.rule-card__exception--override {
  background: rgba(255, 215, 0, 0.06);
  border-color: rgba(255, 215, 0, 0.2);
}

.rule-card__exception-name {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--plasma-orange);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rule-card__exception--override .rule-card__exception-name {
  color: var(--solar-gold);
}

.rule-card__exception p {
  font-size: 0.82rem;
  color: var(--lunar-white);
  line-height: 1.5;
}

.rule-card__exception-elements {
  margin-top: 6px;
  padding-left: 18px;
  font-size: 0.78rem;
  color: var(--star-silver);
}

.rule-card__exception-elements li {
  margin-bottom: 2px;
}

.rule-card__override-tag {
  margin-top: 6px;
  font-size: 0.7rem;
  color: var(--star-silver);
  font-style: italic;
}

/* Policy */
.rule-card__policy {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.rule-card__policy-col ul {
  padding-left: 16px;
  font-size: 0.78rem;
  color: var(--star-silver);
  line-height: 1.5;
}

.rule-card__policy-col li {
  margin-bottom: 4px;
}

.rule-card__policy-header {
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}

.rule-card__policy-header--for {
  color: var(--nebula-teal);
}

.rule-card__policy-header--against {
  color: var(--plasma-orange);
}

/* Tips */
.rule-card__tips {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rule-card__tip {
  padding: 8px 12px;
  background: rgba(255, 215, 0, 0.06);
  border-left: 2px solid var(--solar-gold);
  border-radius: 0 6px 6px 0;
  font-size: 0.8rem;
  color: var(--lunar-white);
  line-height: 1.4;
}

/* Key Case */
.rule-card__case {
  margin-top: 14px;
  padding: 10px 14px;
  background: rgba(178, 102, 255, 0.08);
  border: 1px solid rgba(178, 102, 255, 0.2);
  border-radius: 8px;
  font-family: var(--font-legal);
  font-size: 0.82rem;
  color: var(--cosmic-purple);
  font-style: italic;
}

/* Connections */
.rule-card__connections {
  margin-top: 14px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.rule-card__conn-label {
  font-size: 0.7rem;
  color: var(--star-silver);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.rule-card__conn-badge {
  padding: 4px 10px;
  background: rgba(0, 255, 200, 0.1);
  border: 1px solid rgba(0, 255, 200, 0.3);
  border-radius: 20px;
  font-family: var(--font-display);
  font-size: 0.65rem;
  color: var(--nebula-teal);
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rule-card__conn-badge:hover {
  background: rgba(0, 255, 200, 0.2);
  transform: translateY(-1px);
}

/* Fan transition */
.fan-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.fan-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fan-enter-from,
.fan-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}

.fan-enter-to,
.fan-leave-from {
  opacity: 1;
  max-height: 2000px;
  transform: translateY(0);
}
</style>
