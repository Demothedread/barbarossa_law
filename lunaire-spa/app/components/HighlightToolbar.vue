<template>
  <div class="highlight-toolbar">
    <button
      v-for="color in colors"
      :key="color.name"
      class="highlight-btn"
      :class="{ 'highlight-btn--active': modelValue === color.name }"
      :title="`${color.label} highlight`"
      @click="toggleColor(color.name)"
    >
      <span class="highlight-btn__swatch" :class="`swatch--${color.name}`" />
    </button>
    <button
      class="highlight-btn highlight-btn--clear"
      title="Clear highlights"
      @click="$emit('clear')"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string | null];
  clear: [];
}>();

const colors = [
  { name: "solar", label: "Solar Flare" },
  { name: "nebula", label: "Nebula Teal" },
  { name: "cosmic", label: "Cosmic Purple" },
];

const toggleColor = (name: string) => {
  emit("update:modelValue", props.modelValue === name ? null : name);
};
</script>

<style scoped>
.highlight-toolbar {
  display: flex;
  gap: 6px;
}

.highlight-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--star-silver);
}

.highlight-btn:hover {
  border-color: var(--star-silver);
}

.highlight-btn--active {
  border-color: var(--nebula-teal);
  box-shadow: 0 0 8px rgba(0, 71, 255, 0.15);
}

.highlight-btn--clear:hover {
  color: var(--plasma-orange);
  border-color: var(--plasma-orange);
}

.highlight-btn__swatch {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.swatch--solar {
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.7) 0%,
    rgba(255, 165, 0, 0.6) 50%,
    rgba(255, 200, 50, 0.7) 100%
  );
}

.swatch--nebula {
  background: linear-gradient(
    135deg,
    rgba(0, 71, 255, 0.6) 0%,
    rgba(100, 255, 218, 0.7) 50%,
    rgba(0, 200, 150, 0.6) 100%
  );
}

.swatch--cosmic {
  background: linear-gradient(
    135deg,
    rgba(255, 100, 255, 0.6) 0%,
    rgba(200, 150, 255, 0.7) 50%,
    rgba(255, 150, 200, 0.6) 100%
  );
}
</style>
