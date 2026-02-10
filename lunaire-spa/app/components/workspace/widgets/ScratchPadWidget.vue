<template>
  <div class="scratchpad-widget">
    <div class="scratchpad-toolbar">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="tool-btn"
        :class="{ active: activeTool === tool.id }"
        @click="activeTool = tool.id"
        :title="tool.name"
      >
        {{ tool.icon }}
      </button>
      <div class="toolbar-spacer" />
      <button class="tool-btn" @click="clearAll" title="Clear All">🗑️</button>
      <button class="tool-btn" @click="downloadNotes" title="Download">
        📥
      </button>
    </div>

    <div class="scratchpad-content">
      <textarea
        v-model="notes"
        class="notes-textarea"
        placeholder="Take notes here...&#10;&#10;Tips:&#10;• Use this to jot down key concepts&#10;• Track your reasoning&#10;• Note questions to review later"
        @input="saveNotes"
      />
    </div>

    <div class="scratchpad-footer">
      <span class="char-count">{{ notes.length }} characters</span>
      <span class="save-status">{{ saveStatus }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const STORAGE_KEY = "monobloc-scratchpad";

const notes = ref("");
const activeTool = ref("text");
const saveStatus = ref("Saved");

const tools = [
  { id: "text", name: "Text", icon: "📝" },
  { id: "highlight", name: "Highlight", icon: "🖍️" },
  { id: "bullet", name: "Bullets", icon: "•" },
];

// Load saved notes
onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    notes.value = saved;
  }
});

// Save notes with debounce
let saveTimeout: NodeJS.Timeout | null = null;
const saveNotes = () => {
  saveStatus.value = "Saving...";

  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, notes.value);
    saveStatus.value = "Saved";
  }, 500);
};

// Clear all notes
const clearAll = () => {
  if (confirm("Clear all notes?")) {
    notes.value = "";
    saveNotes();
  }
};

// Download notes as text file
const downloadNotes = () => {
  const blob = new Blob([notes.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `study-notes-${new Date().toISOString().split("T")[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.scratchpad-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0f172a;
}

.scratchpad-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  background: rgba(100, 116, 139, 0.2);
}

.tool-btn.active {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.toolbar-spacer {
  flex: 1;
}

.scratchpad-content {
  flex: 1;
  padding: 8px;
  overflow: hidden;
}

.notes-textarea {
  width: 100%;
  height: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.5);
  color: rgba(255, 255, 255, 0.9);
  font-family: var(--font-body);
  font-size: 0.9rem;
  line-height: 1.6;
  resize: none;
}

.notes-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.notes-textarea:focus {
  outline: none;
  background: rgba(30, 41, 59, 0.7);
}

.scratchpad-footer {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.save-status {
  color: #22c55e;
}
</style>
