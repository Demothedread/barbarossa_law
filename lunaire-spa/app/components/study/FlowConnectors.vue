<template>
  <svg
    class="flow-connectors"
    :style="{ width: width + 'px', height: height + 'px' }"
  >
    <defs>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="6"
        refX="8"
        refY="3"
        orient="auto"
      >
        <polygon points="0 0, 8 3, 0 6" fill="rgba(0, 255, 200, 0.4)" />
      </marker>
      <!-- Glow filter -->
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g v-for="(conn, i) in connections" :key="i">
      <!-- Shadow line -->
      <path
        :d="conn.path"
        fill="none"
        stroke="rgba(0, 0, 0, 0.3)"
        stroke-width="3"
        :stroke-dasharray="conn.dashed ? '8 4' : 'none'"
      />
      <!-- Main line -->
      <path
        :d="conn.path"
        fill="none"
        :stroke="conn.color || 'rgba(0, 255, 200, 0.3)'"
        stroke-width="1.5"
        :stroke-dasharray="conn.dashed ? '8 4' : 'none'"
        marker-end="url(#arrowhead)"
        filter="url(#glow)"
        class="flow-line"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface ConnectionDef {
  from: { x: number; y: number; width?: number; height?: number };
  to: { x: number; y: number; width?: number; height?: number };
  color?: string;
  dashed?: boolean;
}

const props = defineProps<{
  connectionDefs: ConnectionDef[];
  width: number;
  height: number;
}>();

const connections = computed(() =>
  props.connectionDefs.map((def) => {
    const fromCx = def.from.x + (def.from.width || 220) / 2;
    const fromCy = def.from.y + (def.from.height || 120);
    const toCx = def.to.x + (def.to.width || 220) / 2;
    const toCy = def.to.y;

    // Smooth bezier curve
    const midY = (fromCy + toCy) / 2;
    const path = `M ${fromCx} ${fromCy} C ${fromCx} ${midY}, ${toCx} ${midY}, ${toCx} ${toCy}`;

    return {
      path,
      color: def.color,
      dashed: def.dashed,
    };
  }),
);
</script>

<style scoped>
.flow-connectors {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
}

.flow-line {
  transition: stroke 0.3s ease;
}
</style>
