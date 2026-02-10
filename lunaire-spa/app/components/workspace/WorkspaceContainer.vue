<template>
  <div class="workspace-container" ref="containerRef">
    <!-- Grid Background (visible in edit mode) -->
    <div v-if="isEditMode" class="workspace-grid-bg" />

    <!-- Panels -->
    <WorkspacePanel
      v-for="panel in openPanels"
      :key="panel.id"
      :panel="panel"
      :container-width="containerWidth"
      :container-height="containerHeight"
      @close="closePanel(panel.id)"
      @minimize="toggleMinimize(panel.id)"
      @maximize="toggleMaximize(panel.id)"
      @focus="bringToFront(panel.id)"
      @move="(x, y) => updatePanelPosition(panel.id, x, y)"
      @resize="(w, h) => updatePanelSize(panel.id, w, h)"
    >
      <!-- Dynamic widget content -->
      <component
        :is="getWidgetComponent(panel.type)"
        v-bind="getWidgetProps(panel)"
      />
    </WorkspacePanel>

    <!-- Panel Toolbar -->
    <div class="workspace-toolbar">
      <div class="toolbar-left">
        <!-- Layout selector -->
        <div class="layout-selector">
          <button class="toolbar-btn" @click="showLayoutMenu = !showLayoutMenu">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Layout</span>
          </button>
          <Transition name="dropdown">
            <div v-if="showLayoutMenu" class="dropdown-menu">
              <button
                v-for="layout in presetLayouts"
                :key="layout.id"
                class="dropdown-item"
                :class="{ active: activeLayoutId === layout.id }"
                @click="selectLayout(layout.id)"
              >
                <span class="dropdown-item__name">{{ layout.name }}</span>
                <span class="dropdown-item__desc">{{
                  layout.description
                }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- Add widget -->
        <div class="widget-adder">
          <button class="toolbar-btn" @click="showWidgetMenu = !showWidgetMenu">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Tool</span>
          </button>
          <Transition name="dropdown">
            <div
              v-if="showWidgetMenu"
              class="dropdown-menu dropdown-menu--widgets"
            >
              <button
                v-for="type in availablePanelTypes"
                :key="type"
                class="dropdown-item widget-item"
                @click="addWidget(type)"
              >
                <span class="widget-icon">{{ getWidgetIcon(type) }}</span>
                <span class="widget-name">{{ getWidgetName(type) }}</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <div class="toolbar-right">
        <!-- Grid snap toggle -->
        <button
          class="toolbar-btn toolbar-btn--icon"
          :class="{ active: gridSnap }"
          @click="gridSnap = !gridSnap"
          title="Grid Snap"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        </button>

        <!-- Edit mode toggle -->
        <button
          class="toolbar-btn toolbar-btn--icon"
          :class="{ active: isEditMode }"
          @click="isEditMode = !isEditMode"
          title="Edit Mode"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
            />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        <!-- Reset workspace -->
        <button
          class="toolbar-btn toolbar-btn--icon"
          @click="confirmReset"
          title="Reset Workspace"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Minimized panels dock -->
    <div v-if="minimizedPanels.length > 0" class="minimized-dock">
      <button
        v-for="panel in minimizedPanels"
        :key="panel.id"
        class="dock-item"
        @click="toggleMinimize(panel.id)"
      >
        <span class="dock-icon">{{ panel.icon }}</span>
        <span class="dock-title">{{ panel.title }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useWorkspace,
  type PanelConfig,
  type PanelType,
} from "~/composables/useWorkspace";
import WorkspacePanel from "./WorkspacePanel.vue";

// Widget components (lazy loaded)
const ScratchPadWidget = defineAsyncComponent(
  () => import("./widgets/ScratchPadWidget.vue"),
);
const AIChatWidget = defineAsyncComponent(
  () => import("./widgets/AIChatWidget.vue"),
);
const TimerWidget = defineAsyncComponent(
  () => import("./widgets/TimerWidget.vue"),
);
const OutlineWidget = defineAsyncComponent(
  () => import("./widgets/OutlineWidget.vue"),
);
const FlashcardsWidget = defineAsyncComponent(
  () => import("./widgets/FlashcardsWidget.vue"),
);
const StatisticsWidget = defineAsyncComponent(
  () => import("./widgets/StatisticsWidget.vue"),
);
const CalendarWidget = defineAsyncComponent(
  () => import("./widgets/CalendarWidget.vue"),
);
const QuizWidget = defineAsyncComponent(
  () => import("./widgets/QuizWidget.vue"),
);

const props = defineProps<{
  // Props for quiz widget
  quizMode?: string;
}>();

const {
  panels,
  activeLayoutId,
  isEditMode,
  gridSnap,
  openPanels,
  minimizedPanels,
  availablePanelTypes,
  presetLayouts,
  addPanel,
  closePanel,
  toggleMinimize,
  toggleMaximize,
  bringToFront,
  updatePanelPosition,
  updatePanelSize,
  applyLayout,
  resetWorkspace,
  initWorkspace,
} = useWorkspace();

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(1200);
const containerHeight = ref(800);
const showLayoutMenu = ref(false);
const showWidgetMenu = ref(false);

// Widget component mapping
const widgetComponents: Record<
  PanelType,
  ReturnType<typeof defineAsyncComponent>
> = {
  quiz: QuizWidget,
  scratchpad: ScratchPadWidget,
  "ai-chat": AIChatWidget,
  flashcards: FlashcardsWidget,
  timer: TimerWidget,
  outline: OutlineWidget,
  statistics: StatisticsWidget,
  calendar: CalendarWidget,
};

// Widget metadata
const widgetMeta: Record<PanelType, { icon: string; name: string }> = {
  quiz: { icon: "📝", name: "Quiz" },
  scratchpad: { icon: "📋", name: "Scratch Pad" },
  "ai-chat": { icon: "🤖", name: "AI Assistant" },
  flashcards: { icon: "🃏", name: "Flashcards" },
  timer: { icon: "⏱️", name: "Study Timer" },
  outline: { icon: "📑", name: "Topic Outline" },
  statistics: { icon: "📊", name: "Statistics" },
  calendar: { icon: "📅", name: "Schedule" },
};

// Get widget component
const getWidgetComponent = (type: PanelType) => {
  return widgetComponents[type];
};

// Get widget props
const getWidgetProps = (panel: PanelConfig) => {
  if (panel.type === "quiz") {
    return { mode: props.quizMode };
  }
  return {};
};

// Get widget icon
const getWidgetIcon = (type: PanelType) => {
  return widgetMeta[type]?.icon || "📦";
};

// Get widget name
const getWidgetName = (type: PanelType) => {
  return widgetMeta[type]?.name || type;
};

// Add a widget
const addWidget = (type: PanelType) => {
  addPanel(type, {
    x: 20 + Math.random() * 30,
    y: 20 + Math.random() * 30,
    width: 35,
    height: 45,
  });
  showWidgetMenu.value = false;
};

// Select a layout
const selectLayout = (layoutId: string) => {
  applyLayout(layoutId);
  showLayoutMenu.value = false;
};

// Confirm reset
const confirmReset = () => {
  if (confirm("Reset workspace to default layout?")) {
    resetWorkspace();
  }
};

// Update container dimensions
const updateContainerSize = () => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth;
    containerHeight.value = containerRef.value.clientHeight;
  }
};

// Close menus when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest(".layout-selector")) {
    showLayoutMenu.value = false;
  }
  if (!target.closest(".widget-adder")) {
    showWidgetMenu.value = false;
  }
};

onMounted(() => {
  initWorkspace();
  updateContainerSize();
  window.addEventListener("resize", updateContainerSize);
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateContainerSize);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.workspace-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  overflow: hidden;
}

/* Grid background */
.workspace-grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(100, 116, 139, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 116, 139, 0.1) 1px, transparent 1px);
  background-size: 5% 5%;
  pointer-events: none;
  z-index: 0;
}

/* Toolbar */
.workspace-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 8px 16px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  z-index: 1000;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: rgba(100, 116, 139, 0.2);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn svg {
  width: 16px;
  height: 16px;
}

.toolbar-btn:hover {
  background: rgba(100, 116, 139, 0.3);
  color: #fff;
}

.toolbar-btn.active {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.toolbar-btn--icon {
  padding: 8px;
}

.toolbar-btn--icon span {
  display: none;
}

/* Layout & Widget Selectors */
.layout-selector,
.widget-adder {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  padding: 8px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.dropdown-menu--widgets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  min-width: 280px;
}

.dropdown-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.dropdown-item:hover {
  background: rgba(100, 116, 139, 0.2);
}

.dropdown-item.active {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.dropdown-item__name {
  font-weight: 600;
  font-size: 0.9rem;
}

.dropdown-item__desc {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.widget-item {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.widget-icon {
  font-size: 1.2rem;
}

.widget-name {
  font-size: 0.85rem;
}

/* Minimized dock */
.minimized-dock {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  z-index: 999;
}

.dock-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: rgba(100, 116, 139, 0.2);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.15s ease;
}

.dock-item:hover {
  background: rgba(100, 116, 139, 0.3);
  color: #fff;
}

.dock-icon {
  font-size: 1rem;
}

.dock-title {
  font-size: 0.8rem;
  font-weight: 500;
}

/* Dropdown transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
