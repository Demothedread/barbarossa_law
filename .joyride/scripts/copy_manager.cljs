(ns copy-manager
  "Website Copy Management Tool for Barbarossa Law
   
   Provides tools to:
   - List all website copy/text in one place
   - Search for specific text
   - Update text, fonts, and sizes
   - Navigate directly to copy in file
   
   Usage: 
     1. Cmd+Shift+P → 'Joyride: Run Workspace Script' → 'copy_manager.cljs'
     2. Or add a keyboard shortcut (see below)
   
   To add a keyboard shortcut, add to keybindings.json:
   {
     \"key\": \"cmd+shift+c\",
     \"command\": \"joyride.runWorkspaceScript\",
     \"args\": \"copy_manager.cljs\",
     \"when\": \"editorTextFocus\"
   }"
  (:require
   ["vscode" :as vscode]
   [clojure.string :as str]
   [joyride.core :as joyride]
   [promesa.core :as p]))

;; Configuration
(def copy-store-path "lunaire-spa/app/stores/copy.ts")

(def style-presets
  {"heading1" {:font "'good-times', sans-serif" :size "3rem" :weight "700" :desc "Main titles"}
   "heading2" {:font "'strenuous', sans-serif" :size "1.5rem" :weight "600" :desc "Section headers"}
   "heading3" {:font "'Space Grotesk', sans-serif" :size "1.25rem" :weight "600" :desc "Sub-sections"}
   "tagline"  {:font "'Space Grotesk', sans-serif" :size "1.5rem" :weight "400" :desc "Hero taglines"}
   "body"     {:font "'Space Grotesk', sans-serif" :size "1rem" :weight "400" :desc "Body text"}
   "button"   {:font "'Space Grotesk', sans-serif" :size "0.875rem" :weight "600" :desc "Button labels"}
   "label"    {:font "'Space Grotesk', sans-serif" :size "0.75rem" :weight "500" :desc "Form labels"}})

;; Helpers
(defn show-info [msg]
  (vscode/window.showInformationMessage msg))

(defn get-workspace-root []
  (some-> vscode/workspace.workspaceFolders first .-uri .-fsPath))

(defn extract-copy-entries [content]
  "Extract all copy('text', 'style') entries from TypeScript with line numbers"
  (let [lines (str/split-lines content)]
    (->> lines
         (map-indexed 
           (fn [idx line]
             (when-let [match (re-find #"copy\(\s*[\"']([^\"']+)[\"'](?:\s*,\s*[\"']([^\"']+)[\"'])?\s*\)" line)]
               {:text (nth match 1)
                :style (or (nth match 2 nil) "body")
                :line (inc idx)
                :full (first match)})))
         (filter some?))))

;; Main Functions

(defn open-copy-at-line [line-num]
  "Open copy.ts and navigate to specific line"
  (p/let [root (get-workspace-root)
          uri (vscode/Uri.file (str root "/" copy-store-path))
          doc (vscode/workspace.openTextDocument uri)
          editor (vscode/window.showTextDocument doc)]
    (let [pos (vscode/Position. (dec line-num) 0)
          range (vscode/Range. pos pos)]
      (set! (.-selection editor) (vscode/Selection. pos pos))
      (.revealRange editor range vscode/TextEditorRevealType.Center))))

(defn list-all-copy []
  "Show all website copy in a searchable list with line numbers"
  (p/let [content (joyride/slurp copy-store-path)]
    (let [entries (extract-copy-entries content)
          items (map (fn [{:keys [text style line]}]
                       (let [preview (if (> (count text) 50)
                                       (str (subs text 0 50) "...")
                                       text)]
                         #js {:label preview
                              :description (str "L" line " • " style)
                              :detail text
                              :line line}))
                     entries)]
      (p/let [selected (vscode/window.showQuickPick
                         (clj->js items)
                         #js {:placeHolder (str "📝 " (count entries) " copy entries — select to edit")
                              :matchOnDetail true
                              :matchOnDescription true})]
        (when selected
          (open-copy-at-line (.-line selected)))))))

(defn search-copy []
  "Search for text across all copy entries"
  (p/let [query (vscode/window.showInputBox
                  #js {:prompt "🔍 Search website copy..."
                       :placeHolder "Enter search term"})]
    (when (and query (not (str/blank? query)))
      (p/let [content (joyride/slurp copy-store-path)]
        (let [entries (extract-copy-entries content)
              q-lower (str/lower-case query)
              matches (filter #(str/includes? (str/lower-case (:text %)) q-lower) entries)
              items (map (fn [{:keys [text style line]}]
                          #js {:label (subs text 0 (min 60 (count text)))
                               :description (str "L" line " • " style)
                               :detail text
                               :line line})
                        matches)]
          (if (empty? matches)
            (show-info (str "No matches for: \"" query "\""))
            (p/let [selected (vscode/window.showQuickPick
                               (clj->js items)
                               #js {:placeHolder (str "Found " (count matches) " matches")})]
              (when selected
                (open-copy-at-line (.-line selected))))))))))

(defn view-styles []
  "Show style presets with descriptions"
  (let [items (map (fn [[name {:keys [font size weight desc]}]]
                     #js {:label (str "🎨 " name)
                          :description desc
                          :detail (str font " @ " size " (" weight ")")})
                   style-presets)]
    (p/let [selected (vscode/window.showQuickPick
                       (clj->js items)
                       #js {:placeHolder "View style presets — styles defined in copy.ts"})]
      (when selected
        (show-info (str (.-label selected) ": " (.-detail selected)))))))

(defn open-copy-store []
  "Open copy.ts for direct editing"
  (p/let [root (get-workspace-root)
          uri (vscode/Uri.file (str root "/" copy-store-path))
          doc (vscode/workspace.openTextDocument uri)]
    (vscode/window.showTextDocument doc)))

(defn show-stats []
  "Show copy statistics"
  (p/let [content (joyride/slurp copy-store-path)]
    (let [entries (extract-copy-entries content)
          by-style (group-by :style entries)
          style-counts (map (fn [[style items]] 
                              (str style ": " (count items))) 
                            (sort-by (comp - count second) by-style))
          total-chars (reduce + (map #(count (:text %)) entries))]
      (show-info (str "📊 " (count entries) " entries • " 
                      total-chars " chars • "
                      (str/join ", " (take 4 style-counts)))))))

(defn main []
  "Main entry point - shows copy management menu"
  (p/let [selected (vscode/window.showQuickPick
                     #js [#js {:label "📝 Browse All Copy" 
                               :description "List and search all website text"
                               :action "list"}
                          #js {:label "🔍 Search Copy"
                               :description "Find specific text"
                               :action "search"}
                          #js {:label "🎨 View Style Presets"
                               :description "See font/size configurations"
                               :action "styles"}
                          #js {:label "📊 Show Statistics"
                               :description "Copy count by style"
                               :action "stats"}
                          #js {:label "✏️  Open copy.ts"
                               :description "Edit file directly"
                               :action "open"}]
                     #js {:placeHolder "🎭 Barbarossa Copy Manager — Centralized Website Text"})]
    (when selected
      (case (.-action selected)
        "list" (list-all-copy)
        "search" (search-copy)
        "styles" (view-styles)
        "stats" (show-stats)
        "open" (open-copy-store)
        nil))))

;; Auto-run when invoked as script
(when (= (joyride/invoked-script) joyride/*file*)
  (main))

(comment
  ;; REPL evaluation
  (main)
  (list-all-copy)
  (search-copy)
  (show-stats))
