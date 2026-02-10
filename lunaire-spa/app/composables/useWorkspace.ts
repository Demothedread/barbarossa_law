/**
 * Workspace Composable
 * Manages draggable, resizable, stackable panel layout system
 */

export interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface PanelConfig {
  id: string;
  type: PanelType;
  title: string;
  icon: string;
  position: PanelPosition;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  minWidth: number;
  minHeight: number;
  canClose: boolean;
  canResize: boolean;
  canMinimize: boolean;
}

export type PanelType =
  | "quiz"
  | "scratchpad"
  | "ai-chat"
  | "flashcards"
  | "timer"
  | "outline"
  | "statistics"
  | "calendar";

// Default panel configurations
const DEFAULT_PANEL_CONFIGS: Record<PanelType, Partial<PanelConfig>> = {
  quiz: {
    title: "Quiz",
    icon: "📝",
    minWidth: 400,
    minHeight: 300,
    canClose: false,
    canResize: true,
    canMinimize: true,
  },
  scratchpad: {
    title: "Scratch Pad",
    icon: "📋",
    minWidth: 250,
    minHeight: 200,
    canClose: true,
    canResize: true,
    canMinimize: true,
  },
  "ai-chat": {
    title: "AI Assistant",
    icon: "🤖",
    minWidth: 300,
    minHeight: 400,
    canClose: true,
    canResize: true,
    canMinimize: true,
  },
  flashcards: {
    title: "Flashcards",
    icon: "🃏",
    minWidth: 300,
    minHeight: 250,
    canClose: true,
    canResize: true,
    canMinimize: true,
  },
  timer: {
    title: "Study Timer",
    icon: "⏱️",
    minWidth: 200,
    minHeight: 150,
    canClose: true,
    canResize: true,
    canMinimize: true,
  },
  outline: {
    title: "Topic Outline",
    icon: "📑",
    minWidth: 250,
    minHeight: 300,
    canClose: true,
    canResize: true,
    canMinimize: true,
  },
  statistics: {
    title: "Statistics",
    icon: "📊",
    minWidth: 300,
    minHeight: 250,
    canClose: true,
    canResize: true,
    canMinimize: true,
  },
  calendar: {
    title: "Study Schedule",
    icon: "📅",
    minWidth: 300,
    minHeight: 300,
    canClose: true,
    canResize: true,
    canMinimize: true,
  },
};

// Preset layouts
export interface WorkspaceLayout {
  id: string;
  name: string;
  description: string;
  panels: Array<{ type: PanelType; position: Partial<PanelPosition> }>;
}

const PRESET_LAYOUTS: WorkspaceLayout[] = [
  {
    id: "study-focus",
    name: "Study Focus",
    description: "Quiz with scratch pad",
    panels: [
      { type: "quiz", position: { x: 0, y: 0, width: 70, height: 100 } },
      { type: "scratchpad", position: { x: 70, y: 0, width: 30, height: 50 } },
      { type: "timer", position: { x: 70, y: 50, width: 30, height: 50 } },
    ],
  },
  {
    id: "ai-assisted",
    name: "AI Assisted",
    description: "Quiz with AI chatbot",
    panels: [
      { type: "quiz", position: { x: 0, y: 0, width: 60, height: 100 } },
      { type: "ai-chat", position: { x: 60, y: 0, width: 40, height: 100 } },
    ],
  },
  {
    id: "full-study",
    name: "Full Study Mode",
    description: "All tools available",
    panels: [
      { type: "quiz", position: { x: 0, y: 0, width: 50, height: 70 } },
      { type: "ai-chat", position: { x: 50, y: 0, width: 50, height: 70 } },
      { type: "scratchpad", position: { x: 0, y: 70, width: 33, height: 30 } },
      { type: "timer", position: { x: 33, y: 70, width: 33, height: 30 } },
      { type: "outline", position: { x: 66, y: 70, width: 34, height: 30 } },
    ],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Just the quiz",
    panels: [
      { type: "quiz", position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
  },
];

// Local storage key
const WORKSPACE_STORAGE_KEY = "monobloc-workspace-state";

export function useWorkspace() {
  const panels = ref<Map<string, PanelConfig>>(new Map());
  const activeLayoutId = ref<string>("study-focus");
  const highestZIndex = ref(100);
  const isEditMode = ref(false);
  const gridSnap = ref(true);
  const gridSize = ref(5); // Percentage units

  // Generate unique panel ID
  const generatePanelId = (type: PanelType): string => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create a new panel
  const createPanel = (
    type: PanelType,
    position?: Partial<PanelPosition>,
  ): PanelConfig => {
    const defaults = DEFAULT_PANEL_CONFIGS[type];
    const id = generatePanelId(type);

    highestZIndex.value++;

    const panel: PanelConfig = {
      id,
      type,
      title: defaults.title || type,
      icon: defaults.icon || "📦",
      position: {
        x: position?.x ?? 10,
        y: position?.y ?? 10,
        width: position?.width ?? 40,
        height: position?.height ?? 50,
        zIndex: highestZIndex.value,
      },
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      minWidth: defaults.minWidth || 200,
      minHeight: defaults.minHeight || 150,
      canClose: defaults.canClose ?? true,
      canResize: defaults.canResize ?? true,
      canMinimize: defaults.canMinimize ?? true,
    };

    panels.value.set(id, panel);
    return panel;
  };

  // Add a panel to the workspace
  const addPanel = (type: PanelType, position?: Partial<PanelPosition>) => {
    return createPanel(type, position);
  };

  // Remove a panel
  const removePanel = (panelId: string) => {
    panels.value.delete(panelId);
  };

  // Close a panel (hide but keep in state)
  const closePanel = (panelId: string) => {
    const panel = panels.value.get(panelId);
    if (panel) {
      panel.isOpen = false;
    }
  };

  // Open a panel
  const openPanel = (panelId: string) => {
    const panel = panels.value.get(panelId);
    if (panel) {
      panel.isOpen = true;
      bringToFront(panelId);
    }
  };

  // Toggle panel minimize
  const toggleMinimize = (panelId: string) => {
    const panel = panels.value.get(panelId);
    if (panel) {
      panel.isMinimized = !panel.isMinimized;
      if (!panel.isMinimized) {
        bringToFront(panelId);
      }
    }
  };

  // Toggle panel maximize
  const toggleMaximize = (panelId: string) => {
    const panel = panels.value.get(panelId);
    if (panel) {
      panel.isMaximized = !panel.isMaximized;
      if (panel.isMaximized) {
        bringToFront(panelId);
      }
    }
  };

  // Bring panel to front
  const bringToFront = (panelId: string) => {
    const panel = panels.value.get(panelId);
    if (panel) {
      highestZIndex.value++;
      panel.position.zIndex = highestZIndex.value;
    }
  };

  // Update panel position
  const updatePanelPosition = (panelId: string, x: number, y: number) => {
    const panel = panels.value.get(panelId);
    if (panel) {
      // Snap to grid if enabled
      if (gridSnap.value) {
        x = Math.round(x / gridSize.value) * gridSize.value;
        y = Math.round(y / gridSize.value) * gridSize.value;
      }

      // Constrain to viewport
      panel.position.x = Math.max(0, Math.min(100 - panel.position.width, x));
      panel.position.y = Math.max(0, Math.min(100 - panel.position.height, y));
    }
  };

  // Update panel size
  const updatePanelSize = (panelId: string, width: number, height: number) => {
    const panel = panels.value.get(panelId);
    if (panel) {
      // Snap to grid if enabled
      if (gridSnap.value) {
        width = Math.round(width / gridSize.value) * gridSize.value;
        height = Math.round(height / gridSize.value) * gridSize.value;
      }

      // Enforce minimum sizes (convert px to percentage approximation)
      const minWidthPercent = 10; // Minimum 10% width
      const minHeightPercent = 10; // Minimum 10% height

      panel.position.width = Math.max(minWidthPercent, Math.min(100, width));
      panel.position.height = Math.max(minHeightPercent, Math.min(100, height));

      // Ensure panel stays in bounds
      if (panel.position.x + panel.position.width > 100) {
        panel.position.x = 100 - panel.position.width;
      }
      if (panel.position.y + panel.position.height > 100) {
        panel.position.y = 100 - panel.position.height;
      }
    }
  };

  // Apply a preset layout
  const applyLayout = (layoutId: string) => {
    const layout = PRESET_LAYOUTS.find((l) => l.id === layoutId);
    if (!layout) return;

    // Clear existing panels
    panels.value.clear();
    highestZIndex.value = 100;

    // Create panels from layout
    layout.panels.forEach((panelDef) => {
      createPanel(panelDef.type, panelDef.position);
    });

    activeLayoutId.value = layoutId;
    saveState();
  };

  // Get all open panels
  const openPanels = computed(() => {
    return Array.from(panels.value.values()).filter((p) => p.isOpen);
  });

  // Get minimized panels
  const minimizedPanels = computed(() => {
    return Array.from(panels.value.values()).filter(
      (p) => p.isOpen && p.isMinimized,
    );
  });

  // Get available panel types not currently open
  const availablePanelTypes = computed(() => {
    const openTypes = new Set(
      Array.from(panels.value.values())
        .filter((p) => p.isOpen)
        .map((p) => p.type),
    );

    return (Object.keys(DEFAULT_PANEL_CONFIGS) as PanelType[]).filter(
      (type) => !openTypes.has(type) || type === "scratchpad", // Allow multiple scratchpads
    );
  });

  // Save state to localStorage
  const saveState = () => {
    try {
      const state = {
        panels: Array.from(panels.value.entries()),
        activeLayoutId: activeLayoutId.value,
        highestZIndex: highestZIndex.value,
        gridSnap: gridSnap.value,
        gridSize: gridSize.value,
      };
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Failed to save workspace state - localStorage may be full or disabled
    }
  };

  // Load state from localStorage
  const loadState = () => {
    try {
      const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        panels.value = new Map(state.panels);
        activeLayoutId.value = state.activeLayoutId || "study-focus";
        highestZIndex.value = state.highestZIndex || 100;
        gridSnap.value = state.gridSnap ?? true;
        gridSize.value = state.gridSize || 5;
        return true;
      }
    } catch {
      // Failed to load workspace state - will use default layout
    }
    return false;
  };

  // Reset to default layout
  const resetWorkspace = () => {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    applyLayout("study-focus");
  };

  // Initialize workspace
  const initWorkspace = () => {
    if (!loadState()) {
      applyLayout("study-focus");
    }
  };

  // Auto-save on changes
  watch(
    () => [...panels.value.entries()],
    () => {
      saveState();
    },
    { deep: true },
  );

  return {
    // State
    panels: readonly(panels),
    activeLayoutId: readonly(activeLayoutId),
    isEditMode,
    gridSnap,
    gridSize,

    // Computed
    openPanels,
    minimizedPanels,
    availablePanelTypes,
    presetLayouts: PRESET_LAYOUTS,

    // Actions
    addPanel,
    removePanel,
    closePanel,
    openPanel,
    toggleMinimize,
    toggleMaximize,
    bringToFront,
    updatePanelPosition,
    updatePanelSize,
    applyLayout,
    saveState,
    loadState,
    resetWorkspace,
    initWorkspace,
  };
}
