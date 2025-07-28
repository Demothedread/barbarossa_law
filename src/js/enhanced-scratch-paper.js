/* Enhanced Digital Scratch Paper */

class EnhancedScratchPaper {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      autoSave: true,
      autoSaveInterval: 2000,
      maxTabs: 10,
      templates: true,
      richText: true,
      search: true,
      ...options
    };
    
    this.tabs = [];
    this.activeTabId = null;
    this.autoSaveTimer = null;
    this.searchResults = [];
    this.isOpen = false;
    
    this.templates = {
      blank: { name: 'Blank', content: '' },
      irac: {
        name: 'IRAC Analysis',
        content: `<div class="template-irac">
<h3>Issue</h3>
<p>What is the legal question that must be answered?</p>

<h3>Rule</h3>
<p>What is the applicable law, statute, or legal principle?</p>

<h3>Application</h3>
<p>How does the rule apply to the specific facts of this case?</p>

<h3>Conclusion</h3>
<p>What is the likely outcome based on the analysis?</p>
</div>`
      },
      outline: {
        name: 'Legal Outline',
        content: `<div class="template-outline">
<h2>Main Topic</h2>
<h3>I. First Major Point</h3>
<ul>
  <li>Supporting detail</li>
  <li>Supporting detail</li>
</ul>

<h3>II. Second Major Point</h3>
<ul>
  <li>Supporting detail</li>
  <li>Supporting detail</li>
</ul>

<h3>III. Third Major Point</h3>
<ul>
  <li>Supporting detail</li>
  <li>Supporting detail</li>
</ul>
</div>`
      },
      facts: {
        name: 'Fact Analysis',
        content: `<div class="template-facts">
<h3>Key Facts</h3>
<ul>
  <li></li>
  <li></li>
  <li></li>
</ul>

<h3>Legal Issues</h3>
<ul>
  <li></li>
  <li></li>
</ul>

<h3>Relevant Law</h3>
<p></p>

<h3>Analysis</h3>
<p></p>
</div>`
      }
    };
    
    this.init();
  }
  
  init() {
    this.loadTabs();
    this.createUI();
    this.attachEventListeners();
    this.startAutoSave();
  }
  
  createUI() {
    this.container.innerHTML = '';
    this.container.className = 'scratch-container closed';
    
    // Create scratch tab (toggle button)
    this.createToggleTab();
    
    // Create header
    this.createHeader();
    
    // Create tabs system
    this.createTabsSystem();
    
    // Create toolbar
    this.createToolbar();
    
    // Create search
    if (this.options.search) {
      this.createSearch();
    }
    
    // Create content area
    this.createContentArea();
    
    // Create actions
    this.createActions();
    
    // Initialize with first tab or create default
    if (this.tabs.length === 0) {
      this.createTab('Notes', 'blank');
    }
    this.switchToTab(this.tabs[0].id);
  }
  
  createToggleTab() {
    const toggleTab = document.createElement('button');
    toggleTab.className = 'scratch-tab';
    toggleTab.type = 'button';
    toggleTab.innerHTML = '📝 Scratch Paper';
    toggleTab.title = 'Open/Close digital scratch paper';
    toggleTab.setAttribute('aria-label', 'Toggle scratch paper');
    
    toggleTab.onclick = () => this.toggle();
    
    this.container.appendChild(toggleTab);
    this.toggleTab = toggleTab;
  }
  
  createHeader() {
    const header = document.createElement('div');
    header.className = 'scratch-header';
    
    const title = document.createElement('h3');
    title.className = 'scratch-title';
    title.textContent = 'Digital Scratch Paper';
    
    const actions = document.createElement('div');
    actions.className = 'scratch-header-actions';
    
    // Auto-save indicator
    const autoSaveIndicator = document.createElement('div');
    autoSaveIndicator.className = 'scratch-auto-save';
    autoSaveIndicator.innerHTML = `
      <span class="scratch-auto-save-icon">💾</span>
      <span class="scratch-auto-save-text">Saved</span>
    `;
    
    // Minimize button
    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'scratch-header-btn';
    minimizeBtn.innerHTML = '−';
    minimizeBtn.title = 'Minimize';
    minimizeBtn.onclick = () => this.close();
    
    actions.appendChild(autoSaveIndicator);
    actions.appendChild(minimizeBtn);
    
    header.appendChild(title);
    header.appendChild(actions);
    
    this.container.appendChild(header);
    this.autoSaveIndicator = autoSaveIndicator;
  }
  
  createTabsSystem() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'scratch-tabs';
    
    const addTabBtn = document.createElement('button');
    addTabBtn.className = 'add-tab-btn';
    addTabBtn.innerHTML = '+';
    addTabBtn.title = 'Add new tab';
    addTabBtn.onclick = () => this.showNewTabDialog();
    
    tabsContainer.appendChild(addTabBtn);
    
    this.container.appendChild(tabsContainer);
    this.tabsContainer = tabsContainer;
  }
  
  createToolbar() {
    if (!this.options.richText) return;
    
    const toolbar = document.createElement('div');
    toolbar.className = 'scratch-toolbar';
    
    // Format section
    const formatSection = document.createElement('div');
    formatSection.className = 'scratch-toolbar-section';
    
    const formatButtons = [
      { icon: 'B', command: 'bold', title: 'Bold (Ctrl+B)' },
      { icon: 'I', command: 'italic', title: 'Italic (Ctrl+I)' },
      { icon: 'U', command: 'underline', title: 'Underline (Ctrl+U)' },
      { icon: '•', command: 'insertUnorderedList', title: 'Bullet List' },
      { icon: '1.', command: 'insertOrderedList', title: 'Numbered List' },
      { icon: '"', command: 'formatBlock', value: 'blockquote', title: 'Quote' }
    ];
    
    formatButtons.forEach(btn => {
      const button = document.createElement('button');
      button.className = 'scratch-format-btn';
      button.innerHTML = btn.icon;
      button.title = btn.title;
      button.onclick = () => this.execCommand(btn.command, btn.value);
      formatSection.appendChild(button);
    });
    
    toolbar.appendChild(formatSection);
    
    // Template section
    const templateSection = document.createElement('div');
    templateSection.className = 'scratch-toolbar-section';
    
    const templateSelect = document.createElement('select');
    templateSelect.className = 'scratch-template-select';
    templateSelect.onchange = () => this.applyTemplate(templateSelect.value);
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Apply Template...';
    templateSelect.appendChild(defaultOption);
    
    Object.entries(this.templates).forEach(([key, template]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = template.name;
      templateSelect.appendChild(option);
    });
    
    templateSection.appendChild(templateSelect);
    toolbar.appendChild(templateSection);
    
    this.container.appendChild(toolbar);
    this.toolbar = toolbar;
  }
  
  createSearch() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'scratch-search';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'scratch-search-input';
    searchInput.placeholder = 'Search in notes...';
    searchInput.oninput = (e) => this.performSearch(e.target.value);
    
    const searchIcon = document.createElement('span');
    searchIcon.className = 'scratch-search-icon';
    searchIcon.innerHTML = '🔍';
    
    const searchResults = document.createElement('div');
    searchResults.className = 'scratch-search-results';
    searchResults.style.display = 'none';
    
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchResults);
    
    this.container.appendChild(searchContainer);
    this.searchInput = searchInput;
    this.searchResultsContainer = searchResults;
  }
  
  createContentArea() {
    const contentArea = document.createElement('div');
    contentArea.className = 'scratch-content';
    
    this.container.appendChild(contentArea);
    this.contentArea = contentArea;
  }
  
  createActions() {
    const actions = document.createElement('div');
    actions.className = 'scratch-actions';
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'scratch-action';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = () => this.copyContent();
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'scratch-action';
    exportBtn.textContent = 'Export';
    exportBtn.onclick = () => this.showExportDialog();
    
    const importBtn = document.createElement('button');
    importBtn.className = 'scratch-action';
    importBtn.textContent = 'Import';
    importBtn.onclick = () => this.showImportDialog();
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'scratch-action';
    clearBtn.textContent = 'Clear';
    clearBtn.onclick = () => this.clearCurrentTab();
    
    actions.appendChild(copyBtn);
    actions.appendChild(exportBtn);
    actions.appendChild(importBtn);
    actions.appendChild(clearBtn);
    
    this.container.appendChild(actions);
  }
  
  createTab(name, template = 'blank') {
    const id = this.generateTabId();
    const tab = {
      id,
      name,
      content: this.templates[template]?.content || '',
      lastModified: Date.now(),
      template
    };
    
    this.tabs.push(tab);
    this.renderTabs();
    this.saveTabs();
    
    return tab;
  }
  
  renderTabs() {
    // Clear existing tab buttons (except add button)
    const addBtn = this.tabsContainer.querySelector('.add-tab-btn');
    this.tabsContainer.innerHTML = '';
    this.tabsContainer.appendChild(addBtn);
    
    this.tabs.forEach(tab => {
      const tabBtn = document.createElement('button');
      tabBtn.className = 'scratch-tab-item';
      if (tab.id === this.activeTabId) {
        tabBtn.classList.add('active');
      }
      
      const tabName = document.createElement('span');
      tabName.textContent = tab.name;
      
      const closeBtn = document.createElement('span');
      closeBtn.className = 'close-tab';
      closeBtn.innerHTML = '×';
      closeBtn.title = 'Close tab';
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        this.closeTab(tab.id);
      };
      
      tabBtn.appendChild(tabName);
      if (this.tabs.length > 1) {
        tabBtn.appendChild(closeBtn);
      }
      
      tabBtn.onclick = () => this.switchToTab(tab.id);
      
      this.tabsContainer.insertBefore(tabBtn, addBtn);
    });
  }
  
  switchToTab(tabId) {
    // Save current tab content
    if (this.activeTabId && this.currentEditor) {
      const currentTab = this.tabs.find(t => t.id === this.activeTabId);
      if (currentTab) {
        currentTab.content = this.getCurrentContent();
        currentTab.lastModified = Date.now();
      }
    }
    
    this.activeTabId = tabId;
    const tab = this.tabs.find(t => t.id === tabId);
    
    if (tab) {
      this.renderTabContent(tab);
      this.renderTabs();
      this.saveTabs();
    }
  }
  
  renderTabContent(tab) {
    this.contentArea.innerHTML = '';
    
    if (this.options.richText) {
      const editor = document.createElement('div');
      editor.className = 'scratch-pad-rich';
      editor.contentEditable = true;
      editor.innerHTML = tab.content || '';
      editor.oninput = () => this.onContentChange();
      
      this.contentArea.appendChild(editor);
      this.currentEditor = editor;
    } else {
      const textarea = document.createElement('textarea');
      textarea.className = 'scratch-pad';
      textarea.value = this.stripHtml(tab.content || '');
      textarea.placeholder = 'Jot down thoughts, rules, mnemonics...';
      textarea.oninput = () => this.onContentChange();
      
      this.contentArea.appendChild(textarea);
      this.currentEditor = textarea;
    }
  }
  
  onContentChange() {
    this.showAutoSaveIndicator('saving');
    
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setTimeout(() => {
      this.saveCurrentTab();
      this.showAutoSaveIndicator('saved');
    }, this.options.autoSaveInterval);
  }
  
  saveCurrentTab() {
    if (this.activeTabId && this.currentEditor) {
      const tab = this.tabs.find(t => t.id === this.activeTabId);
      if (tab) {
        tab.content = this.getCurrentContent();
        tab.lastModified = Date.now();
        this.saveTabs();
      }
    }
  }
  
  getCurrentContent() {
    if (!this.currentEditor) return '';
    
    if (this.options.richText) {
      return this.currentEditor.innerHTML;
    } else {
      return this.currentEditor.value;
    }
  }
  
  showAutoSaveIndicator(state) {
    const icon = this.autoSaveIndicator.querySelector('.scratch-auto-save-icon');
    const text = this.autoSaveIndicator.querySelector('.scratch-auto-save-text');
    
    this.autoSaveIndicator.className = `scratch-auto-save ${state}`;
    
    switch (state) {
      case 'saving':
        icon.innerHTML = '⏳';
        text.textContent = 'Saving...';
        break;
      case 'saved':
        icon.innerHTML = '✓';
        text.textContent = 'Saved';
        break;
      default:
        icon.innerHTML = '💾';
        text.textContent = 'Auto-save';
    }
  }
  
  attachEventListeners() {
    // Keyboard shortcuts for rich text
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen || !this.options.richText) return;
      if (!this.currentEditor || this.currentEditor !== document.activeElement) return;
      
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            this.execCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            this.execCommand('italic');
            break;
          case 'u':
            e.preventDefault();
            this.execCommand('underline');
            break;
        }
      }
    });
    
    // Click outside to close search results
    document.addEventListener('click', (e) => {
      if (this.searchResultsContainer && 
          !this.searchResultsContainer.contains(e.target) &&
          !this.searchInput.contains(e.target)) {
        this.searchResultsContainer.style.display = 'none';
      }
    });
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    this.container.classList.remove('closed');
    this.container.classList.add('open');
    this.isOpen = true;
    
    if (this.currentEditor) {
      this.currentEditor.focus();
    }
  }
  
  close() {
    this.container.classList.remove('open');
    this.container.classList.add('closed');
    this.isOpen = false;
    this.saveCurrentTab();
  }
  
  execCommand(command, value = null) {
    document.execCommand(command, false, value);
    this.currentEditor.focus();
    this.onContentChange();
  }
  
  applyTemplate(templateKey) {
    if (!templateKey || !this.templates[templateKey]) return;
    
    const template = this.templates[templateKey];
    if (this.currentEditor) {
      if (this.options.richText) {
        this.currentEditor.innerHTML = template.content;
      } else {
        this.currentEditor.value = this.stripHtml(template.content);
      }
      this.onContentChange();
    }
    
    // Reset select
    this.toolbar.querySelector('.scratch-template-select').value = '';
  }
  
  performSearch(query) {
    if (!query.trim()) {
      this.searchResultsContainer.style.display = 'none';
      return;
    }
    
    this.searchResults = [];
    
    this.tabs.forEach(tab => {
      const content = this.stripHtml(tab.content);
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          this.searchResults.push({
            tabId: tab.id,
            tabName: tab.name,
            line: line.trim(),
            lineNumber: index + 1
          });
        }
      });
    });
    
    this.renderSearchResults();
  }
  
  renderSearchResults() {
    this.searchResultsContainer.innerHTML = '';
    
    if (this.searchResults.length === 0) {
      this.searchResultsContainer.style.display = 'none';
      return;
    }
    
    this.searchResults.forEach(result => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'scratch-search-result';
      resultDiv.innerHTML = `
        <strong>${result.tabName}</strong> (Line ${result.lineNumber})<br>
        <small>${result.line}</small>
      `;
      resultDiv.onclick = () => {
        this.switchToTab(result.tabId);
        this.searchResultsContainer.style.display = 'none';
        this.searchInput.value = '';
      };
      
      this.searchResultsContainer.appendChild(resultDiv);
    });
    
    this.searchResultsContainer.style.display = 'block';
  }
  
  showNewTabDialog() {
    const name = prompt('Tab name:', `Notes ${this.tabs.length + 1}`);
    if (name) {
      const tab = this.createTab(name.trim());
      this.switchToTab(tab.id);
    }
  }
  
  closeTab(tabId) {
    if (this.tabs.length <= 1) return;
    
    const tabIndex = this.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;
    
    this.tabs.splice(tabIndex, 1);
    
    if (this.activeTabId === tabId) {
      const newActiveIndex = Math.max(0, tabIndex - 1);
      this.switchToTab(this.tabs[newActiveIndex].id);
    }
    
    this.renderTabs();
    this.saveTabs();
  }
  
  copyContent() {
    if (!this.currentEditor) return;
    
    const content = this.getCurrentContent();
    const textContent = this.stripHtml(content);
    
    navigator.clipboard.writeText(textContent).then(() => {
      // Show feedback
      const copyBtn = this.container.querySelector('.scratch-action');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 1200);
    });
  }
  
  showExportDialog() {
    const format = prompt('Export format:\n1. Text (.txt)\n2. HTML (.html)\n3. JSON (.json)\n\nEnter 1, 2, or 3:');
    
    switch (format) {
      case '1':
        this.exportAsText();
        break;
      case '2':
        this.exportAsHTML();
        break;
      case '3':
        this.exportAsJSON();
        break;
    }
  }
  
  exportAsText() {
    let content = '';
    this.tabs.forEach(tab => {
      content += `=== ${tab.name} ===\n\n`;
      content += this.stripHtml(tab.content) + '\n\n';
    });
    
    this.downloadFile(content, 'scratch-paper.txt', 'text/plain');
  }
  
  exportAsHTML() {
    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Law Quizzer - Scratch Paper</title>
        <style>
          body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; border-bottom: 2px solid #3498db; }
          h2 { color: #34495e; margin-top: 30px; }
          .tab-content { margin-bottom: 40px; }
        </style>
      </head>
      <body>
        <h1>Law Quizzer - Scratch Paper</h1>
    `;
    
    this.tabs.forEach(tab => {
      content += `
        <div class="tab-content">
          <h2>${tab.name}</h2>
          ${tab.content}
        </div>
      `;
    });
    
    content += '</body></html>';
    
    this.downloadFile(content, 'scratch-paper.html', 'text/html');
  }
  
  exportAsJSON() {
    const exportData = {
      exportDate: new Date().toISOString(),
      tabs: this.tabs
    };
    
    this.downloadFile(JSON.stringify(exportData, null, 2), 'scratch-paper.json', 'application/json');
  }
  
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  showImportDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.html,.json';
    input.onchange = (e) => this.handleImport(e.target.files[0]);
    input.click();
  }
  
  handleImport(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          if (data.tabs && Array.isArray(data.tabs)) {
            data.tabs.forEach(tab => {
              this.createTab(tab.name || 'Imported Tab', 'blank');
              const newTab = this.tabs[this.tabs.length - 1];
              newTab.content = tab.content || '';
            });
            this.renderTabs();
          }
        } else {
          // Import as text
          const tab = this.createTab('Imported Notes', 'blank');
          tab.content = this.options.richText ? 
            content.replace(/\n/g, '<br>') : content;
          this.switchToTab(tab.id);
        }
      } catch (error) {
        alert('Error importing file: ' + error.message);
      }
    };
    
    reader.readAsText(file);
  }
  
  clearCurrentTab() {
    if (confirm('Clear all content in this tab?')) {
      if (this.currentEditor) {
        if (this.options.richText) {
          this.currentEditor.innerHTML = '';
        } else {
          this.currentEditor.value = '';
        }
        this.onContentChange();
      }
    }
  }
  
  generateTabId() {
    return 'tab_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
  
  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  
  startAutoSave() {
    if (!this.options.autoSave) return;
    
    // Save every 30 seconds regardless of changes
    setInterval(() => {
      this.saveCurrentTab();
    }, 30000);
  }
  
  saveTabs() {
    localStorage.setItem('lq_scratch_tabs', JSON.stringify(this.tabs));
    localStorage.setItem('lq_scratch_active', this.activeTabId);
  }
  
  loadTabs() {
    const saved = localStorage.getItem('lq_scratch_tabs');
    const activeId = localStorage.getItem('lq_scratch_active');
    
    if (saved) {
      try {
        this.tabs = JSON.parse(saved);
        this.activeTabId = activeId;
      } catch (error) {
        console.error('Error loading scratch paper tabs:', error);
        this.tabs = [];
      }
    }
  }
  
  destroy() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.saveCurrentTab();
  }
}

export { EnhancedScratchPaper };