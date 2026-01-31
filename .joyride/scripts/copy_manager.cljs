(ns copy-manager
  "Website Copy Management Tool for Barbarossa Law
   
   Provides tools to:
   - List all website copy/text in one place
   - Search for specific text
   - Update text, fonts, and sizes
   - Export/import copy configurations
   
   Usage: Evaluate (main) or run from command palette"
  (:require ["vscode" :as vscode]
            [clojure.string :as str]
            [joyride.core :as joyride]))

;; Configuration
(def copy-store-path "lunaire-spa/app/stores/copy.ts")

(def style-presets
  {"heading1" {:font "'Orbitron', sans-serif" :size "3rem" :weight "700"}
   "heading2" {:font "'Orbitron', sans-serif" :size "1.5rem" :weight "600"}
   "heading3" {:font "'Space Grotesk', sans-serif" :size "1.25rem" :weight "600"}
   "tagline"  {:font "'Space Grotesk', sans-serif" :size "1.5rem" :weight "400"}
   "body"     {:font "'Space Grotesk', sans-serif" :size "1rem" :weight "400"}
   "button"   {:font "'Space Grotesk', sans-serif" :size "0.875rem" :weight "600"}
   "label"    {:font "'Space Grotesk', sans-serif" :size "0.75rem" :weight "500"}})

;; Helpers
(defn show-info [msg]
  (vscode/window.showInformationMessage msg))

(defn extract-copy-entries [content]
  "Extract all copy('text', 'style') entries from TypeScript"
  (let [pattern #"copy\('([^']+)'(?:,\s*'([^']+)')?\)"
        matches (re-seq pattern content)]
    (map (fn [[full text style]]
           {:text text 
            :style (or style "body")
            :full full})
         matches)))

;; Main Functions

(defn list-all-copy []
  "Show all website copy in a searchable list"
  (-> (joyride/slurp copy-store-path)
      (.then 
        (fn [content]
          (let [entries (extract-copy-entries content)
                items (map-indexed
                        (fn [i {:keys [text style]}]
                          #js {:label (str (subs text 0 (min 55 (count text)))
                                          (when (> (count text) 55) "..."))
                               :description style
                               :detail text})
                        entries)]
            (vscode/window.showQuickPick
              (clj->js items)
              #js {:placeHolder (str "📝 " (count entries) " copy entries - type to search")
                   :matchOnDetail true}))))
      (.then
        (fn [selected]
          (when selected
            (edit-text (.-detail selected)))))))

(defn edit-text [old-text]
  "Edit a piece of copy text"
  (-> (vscode/window.showInputBox
        #js {:prompt "Edit this text"
             :value old-text
             :valueSelection #js [0 (count old-text)]})
      (.then
        (fn [new-text]
          (when (and new-text (not= new-text old-text))
            (-> (joyride/slurp copy-store-path)
                (.then
                  (fn [content]
                    (let [new-content (str/replace-first 
                                        content 
                                        (str "copy('" old-text "'")
                                        (str "copy('" new-text "'"))]
                      (write-file copy-store-path new-content))))))))))

(defn write-file [path content]
  "Write content to a file in the workspace"
  (-> (vscode/workspace.openTextDocument
        (vscode/Uri.file 
          (str (.-fsPath (.-uri (first (vscode/workspace.workspaceFolders))))
               "/" path)))
      (.then 
        (fn [doc]
          (let [edit (vscode/WorkspaceEdit.)
                range (vscode/Range. 
                        (vscode/Position. 0 0)
                        (vscode/Position. (.-lineCount doc) 0))]
            (.replace edit (.-uri doc) range content)
            (vscode/workspace.applyEdit edit))))
      (.then 
        (fn [success]
          (if success
            (show-info "✅ Copy updated!")
            (vscode/window.showErrorMessage "Failed to update"))))))

(defn search-copy []
  "Search for text in all copy"
  (-> (vscode/window.showInputBox
        #js {:prompt "Search copy..."
             :placeHolder "Enter search term"})
      (.then
        (fn [query]
          (when (and query (not (str/blank? query)))
            (-> (joyride/slurp copy-store-path)
                (.then
                  (fn [content]
                    (let [entries (extract-copy-entries content)
                          matches (filter 
                                    #(str/includes? 
                                       (str/lower-case (:text %)) 
                                       (str/lower-case query))
                                    entries)
                          items (map (fn [{:keys [text style]}]
                                      #js {:label (subs text 0 (min 60 (count text)))
                                           :description style
                                           :detail text})
                                    matches)]
                      (if (empty? matches)
                        (show-info (str "No matches for: " query))
                        (-> (vscode/window.showQuickPick
                              (clj->js items)
                              #js {:placeHolder (str (count matches) " matches")})
                            (.then
                              (fn [selected]
                                (when selected
                                  (edit-text (.-detail selected)))))))))))))))

(defn change-style []
  "Show style options"
  (-> (vscode/window.showQuickPick
        (clj->js (map (fn [[name {:keys [font size]}]]
                        #js {:label name
                             :description (str font " @ " size)})
                      style-presets))
        #js {:placeHolder "View style presets (edit copy.ts to modify)"})
      (.then
        (fn [selected]
          (when selected
            (show-info (str "Style '" (.-label selected) "': " (.-description selected))))))))

(defn open-copy-store []
  "Open copy.ts for direct editing"
  (-> (vscode/workspace.openTextDocument
        (vscode/Uri.file 
          (str (.-fsPath (.-uri (first (vscode/workspace.workspaceFolders))))
               "/" copy-store-path)))
      (.then #(vscode/window.showTextDocument %))))

(defn main []
  "Main entry point - shows copy management menu"
  (-> (vscode/window.showQuickPick
        #js [#js {:label "📝 List All Copy" 
                  :description "View and edit all website text"
                  :action "list"}
             #js {:label "🔍 Search Copy"
                  :description "Find specific text"
                  :action "search"}
             #js {:label "🎨 View Styles"
                  :description "See font presets"
                  :action "styles"}
             #js {:label "✏️  Edit copy.ts"
                  :description "Open file directly"
                  :action "open"}]
        #js {:placeHolder "🎭 Barbarossa Copy Manager"})
      (.then
        (fn [selected]
          (when selected
            (case (.-action selected)
              "list" (list-all-copy)
              "search" (search-copy)
              "styles" (change-style)
              "open" (open-copy-store)
              nil))))))

;; Auto-run when file is evaluated
(comment
  ;; Evaluate these to run
  (main)
  (list-all-copy)
  (search-copy))
