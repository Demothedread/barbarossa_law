(ns css-utilities
  (:require
   ["fs" :as fs]
   ["path" :as path]
   ["vscode" :as vscode]
   [clojure.string :as str]))

;; CSS file paths in the project
(def css-files
  ["/Users/jreback/Projects/barbarossa_law/src/css/lunaire-design-system.css"
   "/Users/jreback/Projects/barbarossa_law/lunaire-spa/app/assets/css/main.css"
   "/Users/jreback/Projects/barbarossa_law/src/css/barbarossa-theme.css"])

;; Utility functions for CSS manipulation
(defn read-css-file [file-path]
  "Read CSS file content"
  (try
    (when (fs/existsSync file-path)
      (str (fs/readFileSync file-path "utf8")))
    (catch js/Error e
      (println "Error reading CSS file:" file-path (.-message e))
      nil)))

(defn write-css-file [file-path content]
  "Write CSS file content"
  (try
    (fs/writeFileSync file-path content "utf8")
    (vscode/window.showInformationMessage (str "Updated: " (path/basename file-path)))
    true
    (catch js/Error e
      (vscode/window.showErrorMessage (str "Error writing CSS file: " (.-message e)))
      false)))

(defn inject-css-vars [css-content var-map]
  "Inject CSS custom properties into :root selector"
  (let [root-vars (str/join "\n" (map (fn [[k v]] (str "  --" k ": " v ";")) var-map))
        new-vars (str "\n/* Control Panel Generated Variables */\n" root-vars "\n")]
    (if (str/includes? css-content ":root")
      ;; Add to existing :root
      (str/replace css-content 
                  #":root\s*\{" 
                  (str ":root {" new-vars))
      ;; Create new :root section
      (str ":root {" new-vars "}\n\n" css-content))))

(defn create-theme-class [theme-name theme-config]
  "Generate CSS class for theme"
  (let [properties (str/join "\n" 
                            (map (fn [[prop value]]
                                   (str "  --" (name prop) ": " value ";"))
                                 theme-config))]
    (str ".theme-" theme-name " {\n" properties "\n}\n\n")))

(defn generate-font-utilities [font-map]
  "Generate font utility classes"
  (str/join "\n"
    (map (fn [[name family]]
           (str ".font-" name " { font-family: " family "; }"))
         font-map)))

(defn generate-accessibility-css []
  "Generate accessibility enhancement CSS"
  "/* Accessibility Enhancements */
.high-contrast {
  --contrast-multiplier: 1.5;
  filter: contrast(var(--contrast-multiplier, 1));
}

.reduced-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

.focus-enhanced *:focus-visible {
  outline: 3px solid var(--focus-color, #00ffc8);
  outline-offset: 3px;
  box-shadow: 0 0 0 1px var(--focus-bg, #000);
}

.screen-reader-mode .visually-hidden {
  position: static !important;
  width: auto !important;
  height: auto !important;
  clip: none !important;
  clip-path: none !important;
  overflow: visible !important;
}

/* Color blind support filters */
.colorblind-protanopia {
  filter: url(#protanopia-filter);
}

.colorblind-deuteranopia {
  filter: url(#deuteranopia-filter);
}

.colorblind-tritanopia {
  filter: url(#tritanopia-filter);
}")

(defn update-all-css-files [changes]
  "Update all CSS files with changes"
  (doseq [file-path css-files]
    (when-let [content (read-css-file file-path)]
      (let [updated-content (inject-css-vars content changes)]
        (write-css-file file-path updated-content)))))

(defn backup-css-files []
  "Create backup of all CSS files"
  (let [timestamp (.toISOString (js/Date.))
        backup-dir (str "/Users/jreback/Projects/barbarossa_law/.joyride/backups/" timestamp "/")]
    (try
      (when-not (fs/existsSync backup-dir)
        (fs/mkdirSync backup-dir #js {:recursive true}))
      
      (doseq [file-path css-files]
        (when (fs/existsSync file-path)
          (let [filename (path/basename file-path)
                backup-path (str backup-dir filename)]
            (fs/copyFileSync file-path backup-path))))
      
      (vscode/window.showInformationMessage (str "CSS files backed up to: " backup-dir))
      backup-dir
      (catch js/Error e
        (vscode/window.showErrorMessage (str "Backup failed: " (.-message e)))
        nil))))

(defn restore-css-backup [backup-dir]
  "Restore CSS files from backup"
  (try
    (doseq [file-path css-files]
      (let [filename (path/basename file-path)
            backup-path (str backup-dir filename)]
        (when (fs/existsSync backup-path)
          (fs/copyFileSync backup-path file-path))))
    
    (vscode/window.showInformationMessage "CSS files restored from backup!")
    true
    (catch js/Error e
      (vscode/window.showErrorMessage (str "Restore failed: " (.-message e)))
      false)))

;; Export functions
(def exports
  {:read-css-file read-css-file
   :write-css-file write-css-file
   :inject-css-vars inject-css-vars
   :create-theme-class create-theme-class
   :generate-font-utilities generate-font-utilities
   :generate-accessibility-css generate-accessibility-css
   :update-all-css-files update-all-css-files
   :backup-css-files backup-css-files
   :restore-css-backup restore-css-backup})

(println "CSS utilities loaded!")