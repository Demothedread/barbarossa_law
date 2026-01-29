/* Enhanced Highlighting System */

import { getIconString } from "./lunaire-icons.js";

class EnhancedHighlighting {
  constructor(questionElement, questionId, onHighlightChange) {
    this.questionElement = questionElement;
    this.questionId = questionId;
    this.onHighlightChange = onHighlightChange;
    this.activeColor = null;
    this.activeCategory = null;
    this.highlights = this.loadHighlights();
    this.highlightHistory = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;

    this.colors = [
      "yellow",
      "cyan",
      "lime",
      "orange",
      "pink",
      "purple",
      "red",
      "blue",
      "green",
    ];

    this.categories = [
      { id: "key-terms", name: "Key Terms", color: "yellow" },
      { id: "rules", name: "Rules", color: "blue" },
      { id: "exceptions", name: "Exceptions", color: "red" },
      { id: "examples", name: "Examples", color: "green" },
      { id: "important", name: "Important", color: "orange" },
      { id: "notes", name: "Notes", color: "purple" },
    ];

    this.keyboardShortcuts = {
      KeyY: "yellow",
      KeyC: "cyan",
      KeyL: "lime",
      KeyO: "orange",
      KeyP: "pink",
      KeyU: "purple",
      KeyR: "red",
      KeyB: "blue",
      KeyG: "green",
      KeyZ: "undo",
      KeyX: "redo",
      Escape: "clear",
    };

    this.init();
  }

  init() {
    this.createControls();
    this.attachEventListeners();
    this.restoreHighlights();
  }

  createControls() {
    const controls = document.createElement("div");
    controls.className = "highlight-controls";

    // Color section
    const colorSection = document.createElement("div");
    colorSection.className = "highlight-controls-section";

    const colorLabel = document.createElement("span");
    colorLabel.className = "highlight-controls-label";
    colorLabel.textContent = "Colors";
    colorSection.appendChild(colorLabel);

    // Clear button
    const clearBtn = document.createElement("button");
    clearBtn.className = "highlight-btn clear-highlight";
    clearBtn.innerHTML = getIconString("close", 16);
    clearBtn.title = "Clear all highlights (Esc)";
    clearBtn.setAttribute("aria-label", "Clear all highlights");
    clearBtn.onclick = () => this.clearAllHighlights();
    colorSection.appendChild(clearBtn);

    // Color buttons
    this.colors.forEach((color) => {
      const btn = document.createElement("button");
      btn.className = `highlight-btn color-${color}`;
      btn.style.backgroundColor = `var(--highlight-${color})`;
      btn.title = `Highlight with ${color} (${this.getShortcutKey(color)})`;
      btn.setAttribute("aria-label", `Highlight with ${color}`);
      btn.onclick = () => this.toggleColor(color);
      btn.dataset.color = color;
      colorSection.appendChild(btn);
    });

    controls.appendChild(colorSection);

    // Category section
    const categorySection = document.createElement("div");
    categorySection.className = "highlight-controls-section";

    const categoryLabel = document.createElement("span");
    categoryLabel.className = "highlight-controls-label";
    categoryLabel.textContent = "Categories";
    categorySection.appendChild(categoryLabel);

    this.categories.forEach((category) => {
      const btn = document.createElement("button");
      btn.className = `highlight-category-btn category-${category.id}`;
      btn.textContent = category.name;
      btn.title = `Set category to ${category.name}`;
      btn.onclick = () => this.setCategory(category.id);
      btn.dataset.category = category.id;
      categorySection.appendChild(btn);
    });

    controls.appendChild(categorySection);

    // Management section
    const managementSection = document.createElement("div");
    managementSection.className = "highlight-management";

    const undoBtn = document.createElement("button");
    undoBtn.className = "highlight-action-btn";
    undoBtn.innerHTML = `${getIconString("arrowLeft", 16)} Undo`;
    undoBtn.title = "Undo last highlight (Ctrl+Z)";
    undoBtn.onclick = () => this.undo();
    this.undoBtn = undoBtn;

    const redoBtn = document.createElement("button");
    redoBtn.className = "highlight-action-btn";
    redoBtn.innerHTML = `${getIconString("arrowRight", 16)} Redo`;
    redoBtn.title = "Redo highlight (Ctrl+Shift+Z)";
    redoBtn.onclick = () => this.redo();
    this.redoBtn = redoBtn;

    const exportBtn = document.createElement("button");
    exportBtn.className = "highlight-action-btn";
    exportBtn.innerHTML = `${getIconString("document", 16)} Export`;
    exportBtn.title = "Export highlights";
    exportBtn.onclick = () => this.exportHighlights();

    managementSection.appendChild(undoBtn);
    managementSection.appendChild(redoBtn);
    managementSection.appendChild(exportBtn);

    controls.appendChild(managementSection);

    // Keyboard shortcuts hint
    const shortcutsHint = document.createElement("div");
    shortcutsHint.className = "keyboard-shortcuts-hint";
    shortcutsHint.innerHTML = `
      <span>Shortcuts: <kbd class="shortcut-key">Y</kbd> Yellow, <kbd class="shortcut-key">B</kbd> Blue, <kbd class="shortcut-key">R</kbd> Red, <kbd class="shortcut-key">G</kbd> Green, <kbd class="shortcut-key">Ctrl+Z</kbd> Undo, <kbd class="shortcut-key">Esc</kbd> Clear</span>
    `;

    controls.appendChild(shortcutsHint);

    // Insert controls before question text
    this.questionElement.parentNode.insertBefore(
      controls,
      this.questionElement,
    );
    this.controlsElement = controls;

    this.updateControlStates();
  }

  attachEventListeners() {
    // Text selection for highlighting
    this.questionElement.addEventListener("mouseup", (e) => {
      const selection = window.getSelection();
      if (selection.toString().trim().length > 0 && this.activeColor) {
        this.applyHighlight();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea, [contenteditable]")) return;

      const key = e.code;
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && key === "KeyZ" && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if (isCtrl && key === "KeyZ" && e.shiftKey) {
        e.preventDefault();
        this.redo();
      } else if (key === "Escape") {
        e.preventDefault();
        this.clearSelection();
      } else if (this.keyboardShortcuts[key] && !isCtrl) {
        e.preventDefault();
        const action = this.keyboardShortcuts[key];
        if (this.colors.includes(action)) {
          this.toggleColor(action);
        }
      }
    });

    // Double-click to add note to highlight
    this.questionElement.addEventListener("dblclick", (e) => {
      if (
        e.target.classList.contains("highlight-with-note") ||
        e.target.closest(".highlight-with-note")
      ) {
        this.editHighlightNote(e.target);
      }
    });
  }

  toggleColor(color) {
    // Save state for undo
    this.saveState();

    if (this.activeColor === color) {
      this.activeColor = null;
    } else {
      this.activeColor = color;

      // Apply highlight if text is already selected
      const selection = window.getSelection();
      if (selection.toString().trim().length > 0) {
        this.applyHighlight();
      }
    }

    this.updateControlStates();
  }

  setCategory(categoryId) {
    this.activeCategory =
      this.activeCategory === categoryId ? null : categoryId;
    this.updateControlStates();
  }

  applyHighlight() {
    const selection = window.getSelection();
    if (!selection.rangeCount || !this.activeColor) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (!selectedText) return;

    try {
      const span = document.createElement("span");
      span.className = `highlight-${this.activeColor}`;
      span.dataset.highlightId = this.generateId();
      span.dataset.color = this.activeColor;

      if (this.activeCategory) {
        span.dataset.category = this.activeCategory;
        span.classList.add(`category-${this.activeCategory}`);
      }

      // Store highlight data
      const highlightData = {
        id: span.dataset.highlightId,
        text: selectedText,
        color: this.activeColor,
        category: this.activeCategory,
        timestamp: Date.now(),
        note: null,
      };

      range.surroundContents(span);

      this.highlights.push(highlightData);
      this.saveHighlights();

      if (this.onHighlightChange) {
        this.onHighlightChange(this.highlights);
      }

      selection.removeAllRanges();
    } catch (error) {
      console.warn("Highlighting failed:", error);
      this.fallbackHighlight(range, selectedText);
    }
  }

  fallbackHighlight(range, text) {
    try {
      const contents = range.extractContents();
      const span = document.createElement("span");
      span.className = `highlight-${this.activeColor}`;
      span.dataset.highlightId = this.generateId();
      span.dataset.color = this.activeColor;

      if (this.activeCategory) {
        span.dataset.category = this.activeCategory;
      }

      span.appendChild(contents);
      range.insertNode(span);

      const highlightData = {
        id: span.dataset.highlightId,
        text: text,
        color: this.activeColor,
        category: this.activeCategory,
        timestamp: Date.now(),
        note: null,
      };

      this.highlights.push(highlightData);
      this.saveHighlights();

      if (this.onHighlightChange) {
        this.onHighlightChange(this.highlights);
      }
    } catch (error) {
      console.error("Fallback highlighting also failed:", error);
    }
  }

  clearAllHighlights() {
    this.saveState();

    const highlightElements = this.questionElement.querySelectorAll(
      '[class*="highlight-"]',
    );
    highlightElements.forEach((element) => {
      const parent = element.parentNode;
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
    });

    this.highlights = [];
    this.saveHighlights();
    this.clearSelection();

    if (this.onHighlightChange) {
      this.onHighlightChange(this.highlights);
    }
  }

  clearSelection() {
    this.activeColor = null;
    this.activeCategory = null;
    this.updateControlStates();
    window.getSelection().removeAllRanges();
  }

  saveState() {
    const state = {
      highlights: [...this.highlights],
      html: this.questionElement.innerHTML,
    };

    // Remove future history if we're not at the end
    if (this.historyIndex < this.highlightHistory.length - 1) {
      this.highlightHistory = this.highlightHistory.slice(
        0,
        this.historyIndex + 1,
      );
    }

    this.highlightHistory.push(state);

    // Limit history size
    if (this.highlightHistory.length > this.maxHistorySize) {
      this.highlightHistory.shift();
    } else {
      this.historyIndex++;
    }

    this.updateControlStates();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.highlightHistory[this.historyIndex];
      this.restoreState(state);
    }
  }

  redo() {
    if (this.historyIndex < this.highlightHistory.length - 1) {
      this.historyIndex++;
      const state = this.highlightHistory[this.historyIndex];
      this.restoreState(state);
    }
  }

  restoreState(state) {
    this.highlights = [...state.highlights];
    this.questionElement.innerHTML = state.html;
    this.saveHighlights();
    this.updateControlStates();

    if (this.onHighlightChange) {
      this.onHighlightChange(this.highlights);
    }
  }

  updateControlStates() {
    // Update color buttons
    this.controlsElement
      .querySelectorAll(".highlight-btn[data-color]")
      .forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.color === this.activeColor);
      });

    // Update category buttons
    this.controlsElement
      .querySelectorAll(".highlight-category-btn")
      .forEach((btn) => {
        btn.classList.toggle(
          "active",
          btn.dataset.category === this.activeCategory,
        );
      });

    // Update undo/redo buttons
    this.undoBtn.disabled = this.historyIndex <= 0;
    this.redoBtn.disabled =
      this.historyIndex >= this.highlightHistory.length - 1;
  }

  editHighlightNote(element) {
    const highlightElement = element.closest("[data-highlight-id]");
    if (!highlightElement) return;

    const highlightId = highlightElement.dataset.highlightId;
    const highlight = this.highlights.find((h) => h.id === highlightId);

    if (!highlight) return;

    const note = prompt("Add a note to this highlight:", highlight.note || "");
    if (note !== null) {
      highlight.note = note.trim();

      if (highlight.note) {
        highlightElement.classList.add("highlight-with-note");
        highlightElement.title = highlight.note;
      } else {
        highlightElement.classList.remove("highlight-with-note");
        highlightElement.removeAttribute("title");
      }

      this.saveHighlights();
    }
  }

  exportHighlights() {
    const exportData = {
      questionId: this.questionId,
      highlights: this.highlights,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `highlights-q${this.questionId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  generateId() {
    return (
      "highlight_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now()
    );
  }

  getShortcutKey(color) {
    const shortcuts = {
      yellow: "Y",
      cyan: "C",
      lime: "L",
      orange: "O",
      pink: "P",
      purple: "U",
      red: "R",
      blue: "B",
      green: "G",
    };
    return shortcuts[color] || "";
  }

  saveHighlights() {
    const key = `lq_highlights_${this.questionId}`;
    localStorage.setItem(key, JSON.stringify(this.highlights));
  }

  loadHighlights() {
    const key = `lq_highlights_${this.questionId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  restoreHighlights() {
    // This would be called when switching back to a question
    // to restore previously made highlights
    this.highlights.forEach((highlight) => {
      // Find and re-highlight text based on stored data
      // This is a simplified version - in practice, you'd need
      // more sophisticated text matching
    });
  }

  destroy() {
    if (this.controlsElement) {
      this.controlsElement.remove();
    }
    // Remove event listeners
  }
}

export { EnhancedHighlighting };
