(ns source-inspector
  "Source Inspector - Click on deployed site elements to find related code"
  (:require
   ["fs" :as fs]
   ["path" :as path]
   ["vscode" :as vscode]
   [clojure.string :as str]
   [promesa.core :as p]))

;; ============================================================================
;; Configuration
;; ============================================================================

(def workspace-root "/Users/jreback/Projects/barbarossa_law")

(def searchable-extensions
  "File extensions to search for code matches"
  #{"html" "js" "ts" "vue" "css" "cljs" "clj" "json" "md"})

(def search-paths
  "Directories to search for source code"
  ["src" "lunaire-spa" "backend" "scripts" ".joyride"])

;; ============================================================================
;; State Management
;; ============================================================================

(defonce inspector-state
  (atom {:active? false
         :server-url "http://localhost:3000"
         :last-search nil
         :search-results []}))

;; ============================================================================
;; Code Search Functions
;; ============================================================================

(defn search-in-file
  "Search for a pattern in a single file, return matches with line numbers"
  [file-path pattern]
  (try
    (when (fs/existsSync file-path)
      (let [content (str (fs/readFileSync file-path "utf8"))
            lines (str/split-lines content)
            matches (keep-indexed
                     (fn [idx line]
                       (when (str/includes? (str/lower-case line) (str/lower-case pattern))
                         {:line (inc idx)
                          :content (str/trim line)
                          :file file-path}))
                     lines)]
        (when (seq matches)
          matches)))
    (catch js/Error _e nil)))

(defn get-all-files
  "Recursively get all files with matching extensions"
  [dir]
  (try
    (when (fs/existsSync dir)
      (let [entries (fs/readdirSync dir #js {:withFileTypes true})]
        (reduce
         (fn [files entry]
           (let [full-path (path/join dir (.-name entry))]
             (cond
               ;; Skip node_modules, .git, etc.
               (or (str/includes? full-path "node_modules")
                   (str/includes? full-path ".git")
                   (str/includes? full-path ".nuxt")
                   (str/includes? full-path "__pycache__"))
               files
               
               ;; Recurse into directories
               (.isDirectory entry)
               (concat files (get-all-files full-path))
               
               ;; Include matching files
               (searchable-extensions (last (str/split (.-name entry) #"\.")))
               (conj files full-path)
               
               :else files)))
         []
         (js->clj entries))))
    (catch js/Error _e [])))

(defn search-codebase
  "Search entire codebase for patterns"
  [patterns]
  (let [files (mapcat #(get-all-files (path/join workspace-root %)) search-paths)
        all-matches (atom [])]
    (doseq [file files
            pattern patterns]
      (when-let [matches (search-in-file file pattern)]
        (swap! all-matches concat matches)))
    ;; Deduplicate and sort by relevance
    (->> @all-matches
         (group-by :file)
         (map (fn [[file matches]]
                {:file file
                 :matches (vec (distinct matches))
                 :relevance (count matches)}))
         (sort-by :relevance >)
         (take 20))))

(defn extract-search-patterns
  "Extract searchable patterns from element info"
  [element-info]
  (let [{:keys [id classes text tag-name data-attrs]} element-info
        patterns (atom [])]
    ;; ID is highest priority
    (when (and id (not (str/blank? id)))
      (swap! patterns conj id)
      (swap! patterns conj (str "#" id))
      (swap! patterns conj (str "id=\"" id "\"")))
    
    ;; Classes are very useful
    (doseq [cls classes]
      (when (and cls (not (str/blank? cls)) (> (count cls) 2))
        (swap! patterns conj cls)
        (swap! patterns conj (str "." cls))
        (swap! patterns conj (str "class=\"" cls))))
    
    ;; Text content (truncated)
    (when (and text (not (str/blank? text)))
      (let [clean-text (-> text str/trim (subs 0 (min 40 (count text))))]
        (when (> (count clean-text) 3)
          (swap! patterns conj clean-text))))
    
    ;; Data attributes
    (doseq [[attr value] data-attrs]
      (when (and attr (not (str/blank? (str value))))
        (swap! patterns conj (str attr "=\"" value "\""))))
    
    ;; Tag with common attributes
    (when tag-name
      (swap! patterns conj (str "<" tag-name)))
    
    @patterns))

;; ============================================================================
;; VS Code Integration
;; ============================================================================

(defn open-file-at-line
  "Open a file in VS Code at a specific line"
  [file-path line]
  (p/let [uri (vscode/Uri.file file-path)
          doc (vscode/workspace.openTextDocument uri)
          editor (vscode/window.showTextDocument doc)]
    (let [position (vscode/Position. (dec line) 0)
          range (vscode/Range. position position)]
      (set! (.-selection editor) (vscode/Selection. position position))
      (.revealRange editor range vscode/TextEditorRevealType.Center)
      ;; Highlight the line
      (let [decoration-type (vscode/window.createTextEditorDecorationType
                             #js {:backgroundColor "rgba(255, 200, 0, 0.3)"
                                  :isWholeLine true})]
        (.setDecorations editor decoration-type #js [range])
        ;; Remove highlight after 3 seconds
        (js/setTimeout #(.dispose decoration-type) 3000)))))

(defn show-search-results-quickpick
  "Show search results in VS Code QuickPick"
  [results element-info]
  (when (seq results)
    (let [items (for [{:keys [file matches]} results
                      {:keys [line content]} matches]
                  (let [rel-path (str/replace file (str workspace-root "/") "")]
                    #js {:label (str "📄 " rel-path ":" line)
                         :description content
                         :detail (str "Found in: " (path/basename file))
                         :file file
                         :line line}))
          quick-pick (vscode/window.createQuickPick)]
      (set! (.-items quick-pick) (clj->js items))
      (set! (.-title quick-pick) (str "🔍 Source for: " 
                                       (or (:id element-info) 
                                           (first (:classes element-info))
                                           (:text element-info))))
      (set! (.-placeholder quick-pick) "Select a file to open...")
      (set! (.-matchOnDescription quick-pick) true)
      (set! (.-matchOnDetail quick-pick) true)
      
      (.onDidAccept quick-pick
                    (fn []
                      (when-let [selected (first (.-selectedItems quick-pick))]
                        (open-file-at-line (.-file selected) (.-line selected)))
                      (.hide quick-pick)))
      
      (.onDidHide quick-pick #(.dispose quick-pick))
      (.show quick-pick))))

;; ============================================================================
;; Inspector Script (injected into browser)
;; ============================================================================

(def inspector-script
  "JavaScript to inject into the page for element inspection"
  "
(function() {
  // Prevent multiple injections
  if (window.__sourceInspectorActive) return;
  window.__sourceInspectorActive = true;
  
  // Create overlay for highlighting
  const overlay = document.createElement('div');
  overlay.id = 'source-inspector-overlay';
  overlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    border: 2px dashed #00ffc8;
    background: rgba(0, 255, 200, 0.1);
    z-index: 999999;
    transition: all 0.15s ease;
    display: none;
  `;
  document.body.appendChild(overlay);
  
  // Create info tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'source-inspector-tooltip';
  tooltip.style.cssText = `
    position: fixed;
    background: #1a1a2e;
    color: #00ffc8;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    z-index: 1000000;
    pointer-events: none;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    border: 1px solid #00ffc8;
    display: none;
  `;
  document.body.appendChild(tooltip);
  
  // Status indicator
  const status = document.createElement('div');
  status.id = 'source-inspector-status';
  status.innerHTML = '🔍 Source Inspector Active<br><small>Double-click to inspect • Esc to exit</small>';
  status.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #1a1a2e, #2d2d44);
    color: #00ffc8;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 1000001;
    border: 2px solid #00ffc8;
    box-shadow: 0 4px 20px rgba(0,255,200,0.2);
  `;
  document.body.appendChild(status);
  
  let currentElement = null;
  
  // Get element info
  function getElementInfo(el) {
    const rect = el.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(el);
    
    // Get data attributes
    const dataAttrs = {};
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    }
    
    return {
      tagName: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: Array.from(el.classList),
      text: (el.textContent || '').trim().substring(0, 100),
      dataAttrs: dataAttrs,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      styles: {
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize,
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor
      }
    };
  }
  
  // Update overlay position
  function updateOverlay(el) {
    if (!el) {
      overlay.style.display = 'none';
      tooltip.style.display = 'none';
      return;
    }
    
    const rect = el.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    
    // Update tooltip
    const info = getElementInfo(el);
    let tooltipHtml = `<strong>&lt;${info.tagName}&gt;</strong>`;
    if (info.id) tooltipHtml += ` <span style=\"color:#ffd700\">#${info.id}</span>`;
    if (info.classes.length) tooltipHtml += `<br><span style=\"color:#87ceeb\">.${info.classes.join('.')}</span>`;
    if (info.text) tooltipHtml += `<br><span style=\"color:#ddd\">\"${info.text.substring(0,50)}${info.text.length > 50 ? '...' : ''}\"</span>`;
    
    tooltip.innerHTML = tooltipHtml;
    tooltip.style.display = 'block';
    tooltip.style.top = (rect.bottom + 10) + 'px';
    tooltip.style.left = rect.left + 'px';
    
    // Keep tooltip in viewport
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.right > window.innerWidth) {
      tooltip.style.left = (window.innerWidth - tooltipRect.width - 10) + 'px';
    }
    if (tooltipRect.bottom > window.innerHeight) {
      tooltip.style.top = (rect.top - tooltipRect.height - 10) + 'px';
    }
  }
  
  // Mouse move handler
  function onMouseMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el !== overlay && el !== tooltip && el !== status && 
        !overlay.contains(el) && !tooltip.contains(el) && !status.contains(el)) {
      currentElement = el;
      updateOverlay(el);
    }
  }
  
  // Double-click handler - sends info back to VS Code
  function onDoubleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentElement) {
      const info = getElementInfo(currentElement);
      
      // Flash effect
      overlay.style.background = 'rgba(0, 255, 200, 0.4)';
      setTimeout(() => {
        overlay.style.background = 'rgba(0, 255, 200, 0.1)';
      }, 200);
      
      // Send to VS Code via console (Joyride can intercept this)
      console.log('__SOURCE_INSPECTOR__:' + JSON.stringify(info));
      
      // Also copy to clipboard for manual use
      const searchTerms = [info.id, ...info.classes, info.text?.substring(0,30)].filter(Boolean).join(', ');
      navigator.clipboard?.writeText(searchTerms);
      
      // Show feedback
      const feedback = document.createElement('div');
      feedback.textContent = '✓ Searching codebase...';
      feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #00ffc8;
        color: #1a1a2e;
        padding: 16px 24px;
        border-radius: 8px;
        font-size: 18px;
        font-weight: bold;
        z-index: 1000002;
        animation: fadeOut 1.5s forwards;
      `;
      document.body.appendChild(feedback);
      setTimeout(() => feedback.remove(), 1500);
      
      // Post message to any listening parent (for iframe scenarios)
      window.postMessage({ type: 'SOURCE_INSPECTOR', data: info }, '*');
    }
  }
  
  // Cleanup function
  function cleanup() {
    window.__sourceInspectorActive = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('dblclick', onDoubleClick);
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();
    tooltip.remove();
    status.remove();
  }
  
  // Escape key to exit
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
    }
  }
  
  // Attach event listeners
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('dblclick', onDoubleClick, true);
  document.addEventListener('keydown', onKeyDown);
  
  // Add fadeOut animation
  const style = document.createElement('style');
  style.textContent = '@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }';
  document.head.appendChild(style);
  
  // Expose cleanup globally
  window.__sourceInspectorCleanup = cleanup;
  
  console.log('Source Inspector activated! Double-click any element to find its source code.');
})();
")

;; ============================================================================
;; Main Inspector Functions
;; ============================================================================

(defn handle-element-selection
  "Handle when an element is selected in the browser"
  [element-info-json]
  (try
    (let [element-info (js->clj (js/JSON.parse element-info-json) :keywordize-keys true)
          patterns (extract-search-patterns element-info)
          _ (println "🔍 Searching for patterns:" patterns)
          results (search-codebase patterns)]
      (swap! inspector-state assoc 
             :last-search element-info
             :search-results results)
      (if (seq results)
        (do
          (println "📁 Found" (count results) "files with matches")
          (show-search-results-quickpick results element-info))
        (vscode/window.showWarningMessage 
         (str "No source found for: " 
              (or (:id element-info) 
                  (first (:classes element-info))
                  "this element")))))
    (catch js/Error e
      (println "Error handling selection:" (.-message e)))))

(defn show-manual-search
  "Show input box for manual search"
  []
  (p/let [input (vscode/window.showInputBox
                 #js {:prompt "Enter element ID, class, or text to search for"
                      :placeHolder "e.g., homeBtn, lunaire-nav__btn, 'Clubhouse'"})]
    (when (and input (not (str/blank? input)))
      (let [patterns [input]
            results (search-codebase patterns)]
        (if (seq results)
          (show-search-results-quickpick results {:text input})
          (vscode/window.showWarningMessage (str "No matches found for: " input)))))))

(defn start-inspector
  "Start the source inspector - opens browser and shows instructions"
  []
  (let [url (or (:server-url @inspector-state) "http://localhost:3000")]
    (swap! inspector-state assoc :active? true)
    
    ;; Show instructions
    (vscode/window.showInformationMessage
     "🔍 Source Inspector Ready! 
      
1. Open the site at localhost:3000
2. Open browser DevTools (F12)
3. Paste the inspector script in Console
4. Double-click any element to find its code!"
     "Copy Inspector Script"
     "Open localhost:3000"
     "Manual Search")
    
    ;; Copy script to clipboard
    (-> (vscode/env.clipboard.writeText inspector-script)
        (.then #(println "Inspector script copied to clipboard!")))))

(defn launch-with-simple-browser
  "Launch site in VS Code Simple Browser with inspector capability"
  []
  (p/let [url (vscode/window.showInputBox
               #js {:prompt "Enter the URL to inspect"
                    :value "http://localhost:3000"
                    :placeHolder "http://localhost:3000"})]
    (when url
      (swap! inspector-state assoc :server-url url :active? true)
      ;; Execute VS Code command to open Simple Browser
      (vscode/commands.executeCommand "simpleBrowser.show" url)
      (vscode/window.showInformationMessage
       "Site opened! To enable element inspection:
1. Right-click in Simple Browser → Open DevTools
2. Run the inspector script in Console
3. Double-click elements to find source!"
       "Copy Inspector Script")
      (vscode/env.clipboard.writeText inspector-script))))

;; ============================================================================
;; Quick Commands
;; ============================================================================

(defn search-by-id
  "Quick search by element ID"
  []
  (p/let [id (vscode/window.showInputBox
              #js {:prompt "Enter element ID"
                   :placeHolder "e.g., homeBtn, authSection, loginBtn"})]
    (when id
      (let [patterns [id (str "#" id) (str "id=\"" id "\"")]
            results (search-codebase patterns)]
        (if (seq results)
          (show-search-results-quickpick results {:id id})
          (vscode/window.showWarningMessage (str "No matches for ID: " id)))))))

(defn search-by-class
  "Quick search by CSS class"
  []
  (p/let [cls (vscode/window.showInputBox
               #js {:prompt "Enter CSS class name"
                    :placeHolder "e.g., lunaire-nav__btn, btn-lunaire--primary"})]
    (when cls
      (let [patterns [cls (str "." cls) (str "class=\"" cls)]
            results (search-codebase patterns)]
        (if (seq results)
          (show-search-results-quickpick results {:classes [cls]})
          (vscode/window.showWarningMessage (str "No matches for class: " cls)))))))

(defn search-by-text
  "Quick search by text content"
  []
  (p/let [text (vscode/window.showInputBox
                #js {:prompt "Enter text to search for"
                     :placeHolder "e.g., 'Clubhouse', 'Start Quiz'"})]
    (when text
      (let [results (search-codebase [text])]
        (if (seq results)
          (show-search-results-quickpick results {:text text})
          (vscode/window.showWarningMessage (str "No matches for: " text)))))))

;; ============================================================================
;; Export API
;; ============================================================================

(def api
  {:start-inspector start-inspector
   :launch-browser launch-with-simple-browser
   :manual-search show-manual-search
   :search-by-id search-by-id
   :search-by-class search-by-class
   :search-by-text search-by-text
   :handle-selection handle-element-selection
   :get-script (fn [] inspector-script)
   :state inspector-state})

;; Return API for REPL use
api
