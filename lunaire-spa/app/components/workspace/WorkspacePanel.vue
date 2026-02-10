<template>
  <div
    ref="panelRef"
    class="workspace-panel"
    :class="{
      'workspace-panel--minimized': panel.isMinimized,
      'workspace-panel--maximized': panel.isMaximized,
      'workspace-panel--dragging': isDragging,
      'workspace-panel--resizing': isResizing,
      'workspace-panel--focused': isFocused,
    }"
    :style="panelStyle"
    @mousedown="handleFocus"
    @touchstart="handleFocus"
  >
    <!-- Panel Header -->
    <div class="panel-header" @mousedown="startDrag" @touchstart="startDrag">
      <div class="panel-header__left">
        <span class="panel-icon">{{ panel.icon }}</span>
        <span class="panel-title">{{ panel.title }}</span>
      </div>
      <div class="panel-header__actions">
        <button
          v-if="panel.canMinimize"
          class="panel-btn panel-btn--minimize"
          @click.stop="emit('minimize')"
          :title="panel.isMinimized ? 'Restore' : 'Minimize'"
        >
          <svg
            v-if="panel.isMinimized"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          v-if="panel.canResize"
          class="panel-btn panel-btn--maximize"
          @click.stop="emit('maximize')"
          :title="panel.isMaximized ? 'Restore' : 'Maximize'"
        >
          <svg
            v-if="panel.isMaximized"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="5" y="5" width="14" height="14" rx="1" />
            <path d="M9 3h10a2 2 0 0 1 2 2v10" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </button>
        <button
          v-if="panel.canClose"
          class="panel-btn panel-btn--close"
          @click.stop="emit('close')"
          title="Close"
        >
          <svg
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
    </div>

    <!-- Panel Content -->
    <div v-show="!panel.isMinimized" class="panel-content">
      <slot />
    </div>

    <!-- Resize Handles -->
    <template
      v-if="panel.canResize && !panel.isMaximized && !panel.isMinimized"
    >
      <div
        class="resize-handle resize-handle--e"
        @mousedown.stop="startResize('e', $event)"
        @touchstart.stop="startResize('e', $event)"
      />
      <div
        class="resize-handle resize-handle--s"
        @mousedown.stop="startResize('s', $event)"
        @touchstart.stop="startResize('s', $event)"
      />
      <div
        class="resize-handle resize-handle--se"
        @mousedown.stop="startResize('se', $event)"
        @touchstart.stop="startResize('se', $event)"
      />
      <div
        class="resize-handle resize-handle--w"
        @mousedown.stop="startResize('w', $event)"
        @touchstart.stop="startResize('w', $event)"
      />
      <div
        class="resize-handle resize-handle--n"
        @mousedown.stop="startResize('n', $event)"
        @touchstart.stop="startResize('n', $event)"
      />
      <div
        class="resize-handle resize-handle--nw"
        @mousedown.stop="startResize('nw', $event)"
        @touchstart.stop="startResize('nw', $event)"
      />
      <div
        class="resize-handle resize-handle--ne"
        @mousedown.stop="startResize('ne', $event)"
        @touchstart.stop="startResize('ne', $event)"
      />
      <div
        class="resize-handle resize-handle--sw"
        @mousedown.stop="startResize('sw', $event)"
        @touchstart.stop="startResize('sw', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PanelConfig } from "~/composables/useWorkspace";

const props = defineProps<{
  panel: PanelConfig;
  containerWidth: number;
  containerHeight: number;
}>();

const emit = defineEmits<{
  close: [];
  minimize: [];
  maximize: [];
  focus: [];
  move: [x: number, y: number];
  resize: [width: number, height: number];
}>();

const panelRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const isResizing = ref(false);
const isFocused = ref(false);

// Drag state
const dragStart = ref({ x: 0, y: 0 });
const initialPosition = ref({ x: 0, y: 0 });

// Resize state
type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const resizeDirection = ref<ResizeDirection | null>(null);
const resizeStart = ref({ x: 0, y: 0 });
const initialSize = ref({ width: 0, height: 0, x: 0, y: 0 });

// Computed panel style
const panelStyle = computed(() => {
  if (props.panel.isMaximized) {
    return {
      left: "0",
      top: "0",
      width: "100%",
      height: "100%",
      zIndex: props.panel.position.zIndex,
    };
  }

  if (props.panel.isMinimized) {
    return {
      left: `${props.panel.position.x}%`,
      top: `${props.panel.position.y}%`,
      width: "200px",
      height: "auto",
      zIndex: props.panel.position.zIndex,
    };
  }

  return {
    left: `${props.panel.position.x}%`,
    top: `${props.panel.position.y}%`,
    width: `${props.panel.position.width}%`,
    height: `${props.panel.position.height}%`,
    zIndex: props.panel.position.zIndex,
  };
});

// Get pointer position from mouse or touch event
const getPointerPosition = (e: MouseEvent | TouchEvent) => {
  if ("touches" in e && e.touches.length > 0) {
    return { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
  }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
};

// Handle focus
const handleFocus = () => {
  isFocused.value = true;
  emit("focus");
};

// Start dragging
const startDrag = (e: MouseEvent | TouchEvent) => {
  if (props.panel.isMaximized) return;

  e.preventDefault();
  isDragging.value = true;

  const pos = getPointerPosition(e);
  dragStart.value = { x: pos.x, y: pos.y };
  initialPosition.value = {
    x: props.panel.position.x,
    y: props.panel.position.y,
  };

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("touchmove", onDrag);
  document.addEventListener("touchend", stopDrag);
};

// Handle dragging
const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;

  const pos = getPointerPosition(e);
  const deltaX = ((pos.x - dragStart.value.x) / props.containerWidth) * 100;
  const deltaY = ((pos.y - dragStart.value.y) / props.containerHeight) * 100;

  const newX = initialPosition.value.x + deltaX;
  const newY = initialPosition.value.y + deltaY;

  emit("move", newX, newY);
};

// Stop dragging
const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", onDrag);
  document.removeEventListener("touchend", stopDrag);
};

// Start resizing
const startResize = (
  direction: ResizeDirection,
  e: MouseEvent | TouchEvent,
) => {
  if (props.panel.isMaximized || props.panel.isMinimized) return;

  e.preventDefault();
  isResizing.value = true;
  resizeDirection.value = direction;

  const pos = getPointerPosition(e);
  resizeStart.value = { x: pos.x, y: pos.y };
  initialSize.value = {
    width: props.panel.position.width,
    height: props.panel.position.height,
    x: props.panel.position.x,
    y: props.panel.position.y,
  };

  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize);
  document.addEventListener("touchmove", onResize);
  document.addEventListener("touchend", stopResize);
};

// Handle resizing
const onResize = (e: MouseEvent | TouchEvent) => {
  if (!isResizing.value || !resizeDirection.value) return;

  const pos = getPointerPosition(e);
  const deltaX = ((pos.x - resizeStart.value.x) / props.containerWidth) * 100;
  const deltaY = ((pos.y - resizeStart.value.y) / props.containerHeight) * 100;

  let newWidth = initialSize.value.width;
  let newHeight = initialSize.value.height;
  let newX = initialSize.value.x;
  let newY = initialSize.value.y;

  const dir = resizeDirection.value;

  // Horizontal resizing
  if (dir.includes("e")) {
    newWidth = initialSize.value.width + deltaX;
  }
  if (dir.includes("w")) {
    newWidth = initialSize.value.width - deltaX;
    newX = initialSize.value.x + deltaX;
  }

  // Vertical resizing
  if (dir.includes("s")) {
    newHeight = initialSize.value.height + deltaY;
  }
  if (dir.includes("n")) {
    newHeight = initialSize.value.height - deltaY;
    newY = initialSize.value.y + deltaY;
  }

  // Update position if resizing from top or left
  if (dir.includes("w") || dir.includes("n")) {
    emit("move", newX, newY);
  }

  emit("resize", newWidth, newHeight);
};

// Stop resizing
const stopResize = () => {
  isResizing.value = false;
  resizeDirection.value = null;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
  document.removeEventListener("touchmove", onResize);
  document.removeEventListener("touchend", stopResize);
};

// Cleanup
onUnmounted(() => {
  stopDrag();
  stopResize();
});
</script>

<style scoped>
.workspace-panel {
  position: absolute;
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 2px 4px -2px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  transition: box-shadow 0.2s ease;
}

.workspace-panel--focused {
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 2px 4px -2px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(56, 189, 248, 0.2) inset,
    0 0 20px rgba(56, 189, 248, 0.1);
}

.workspace-panel--dragging,
.workspace-panel--resizing {
  opacity: 0.9;
  cursor: grabbing;
}

.workspace-panel--minimized {
  height: auto !important;
}

.workspace-panel--maximized {
  border-radius: 0;
}

/* Panel Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
}

.panel-header:active {
  cursor: grabbing;
}

.panel-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  font-size: 1rem;
}

.panel-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-header__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.panel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.15s ease;
}

.panel-btn svg {
  width: 14px;
  height: 14px;
}

.panel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.panel-btn--close:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* Panel Content */
.panel-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

/* Resize Handles */
.resize-handle {
  position: absolute;
  z-index: 10;
}

.resize-handle--n,
.resize-handle--s {
  left: 10px;
  right: 10px;
  height: 6px;
  cursor: ns-resize;
}

.resize-handle--n {
  top: -3px;
}

.resize-handle--s {
  bottom: -3px;
}

.resize-handle--e,
.resize-handle--w {
  top: 10px;
  bottom: 10px;
  width: 6px;
  cursor: ew-resize;
}

.resize-handle--e {
  right: -3px;
}

.resize-handle--w {
  left: -3px;
}

.resize-handle--nw,
.resize-handle--ne,
.resize-handle--sw,
.resize-handle--se {
  width: 12px;
  height: 12px;
}

.resize-handle--nw {
  top: -3px;
  left: -3px;
  cursor: nwse-resize;
}

.resize-handle--ne {
  top: -3px;
  right: -3px;
  cursor: nesw-resize;
}

.resize-handle--sw {
  bottom: -3px;
  left: -3px;
  cursor: nesw-resize;
}

.resize-handle--se {
  bottom: -3px;
  right: -3px;
  cursor: nwse-resize;
}

/* Scrollbar styling */
.panel-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.4);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.6);
}
</style>
