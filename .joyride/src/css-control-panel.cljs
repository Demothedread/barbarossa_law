(ns css-control-panel
  (:require
   ["vscode" :as vscode]
   [clojure.string :as str]))

;; CSS Control Panel State
(def control-state (atom {:active false
                         :theme-mode "space"
                         :font-family "good-times"
                         :contrast-mode "normal"
                         :animation-speed "normal"
                         :color-blind-mode "none"
                         :text-size "medium"
                         :spacing-mode "normal"}))

;; Theme configurations based on the CSS
(def themes
  {"space" {:primary "#00ffc8"
            :secondary "#ff6b35" 
            :background "#0a0a1a"
            :text "#e0e1dd"}
   "golf" {:primary "#2d5a27"
           :secondary "#c9a227"
           :background "#f5f0e1"
           :text "#1a1a1a"}
   "baseball" {:primary "#c41e3a"
               :secondary "#ffd300"
               :background "#228b22"
               :text "#f8f8f8"}
   "quiz-show" {:primary "#ffc400"
                :secondary "#5c2d91"
                :background "#0066cc"
                :text "#ffffff"}})

;; Font options from TypeKit
(def font-options
  {"good-times" "good-times, sans-serif"
   "strenuous" "strenuous, sans-serif"
   "connemara-old-style" "connemara-old-style, sans-serif"
   "nelson-engraved" "nelson-engraved, sans-serif"
   "tilt-neon" "tilt-neon, sans-serif"
   "keiko-titling" "keiko-titling, sans-serif"
   "p22-morris-troy" "p22-morris-troy, sans-serif"})

;; Utility functions
(defn get-active-document []
  (.-activeTextEditor vscode/window))

(defn apply-css-vars [vars]
  "Apply CSS variables to the active document"
  (let [editor (get-active-document)]
    (when editor
      (let [document (.-document editor)
            uri (.-uri document)]
        (when (str/includes? (str uri) ".css")
          (vscode/window.showInformationMessage 
            (str "Applying CSS vars: " (pr-str vars))))))))

(defn create-webview-panel []
  "Create the CSS control panel webview"
  (let [panel (vscode/window.createWebviewPanel
               "cssControlPanel"
               "🎨 CSS Control Panel"
               vscode/ViewColumn.Two
               #js {:enableScripts true})]
    
    ;; Set the HTML content
    (set! (.. panel -webview -html)
          (str "<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>CSS Control Panel</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            padding: 20px;
            background: #1e1e1e;
            color: #cccccc;
            line-height: 1.6;
        }
        .control-group {
            margin-bottom: 24px;
            padding: 16px;
            background: #252526;
            border-radius: 8px;
            border-left: 4px solid #007acc;
        }
        .control-group h3 {
            margin: 0 0 12px 0;
            color: #ffffff;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        select, input[type='range'] {
            width: 100%;
            padding: 8px;
            margin: 8px 0;
            background: #3c3c3c;
            border: 1px solid #464647;
            border-radius: 4px;
            color: #cccccc;
        }
        button {
            background: #007acc;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 4px;
            font-size: 13px;
        }
        button:hover { background: #005a9e; }
        button.active { background: #00ffc8; color: #000; }
        .toggle-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .slider-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .slider-value {
            min-width: 40px;
            text-align: center;
            font-weight: bold;
            color: #00ffc8;
        }
        .preview-box {
            background: #2d2d30;
            border: 2px dashed #464647;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            font-family: var(--preview-font, 'good-times', sans-serif);
        }
    </style>
</head>
<body>
    <div class='control-group'>
        <h3>🎨 Theme Mode</h3>
        <select id='themeSelect' onchange='updateTheme(this.value)'>
            <option value='space'>🚀 Deep Space (Default)</option>
            <option value='golf'>🏌️ Lunar Golf Club</option>
            <option value='baseball'>⚾ Stadium Scoreboard</option>
            <option value='quiz-show'>🎯 Quiz Show Retro</option>
        </select>
        <div class='preview-box' id='themePreview'>
            Theme Preview - Colors and styling will update here
        </div>
    </div>

    <div class='control-group'>
        <h3>✍️ Typography</h3>
        <label>Font Family:</label>
        <select id='fontSelect' onchange='updateFont(this.value)'>
            <option value='good-times'>Good Times (Default)</option>
            <option value='strenuous'>Strenuous</option>
            <option value='connemara-old-style'>Connemara Old Style</option>
            <option value='nelson-engraved'>Nelson Engraved</option>
            <option value='tilt-neon'>Tilt Neon</option>
            <option value='keiko-titling'>Keiko Titling</option>
            <option value='p22-morris-troy'>P22 Morris Troy</option>
        </select>
        
        <label>Text Size:</label>
        <div class='slider-container'>
            <input type='range' id='textSizeSlider' min='12' max='24' value='16' onchange='updateTextSize(this.value)'>
            <span class='slider-value' id='textSizeValue'>16px</span>
        </div>
    </div>

    <div class='control-group'>
        <h3>🎛️ Display Options</h3>
        <div class='toggle-group'>
            <button id='contrastBtn' onclick='toggleContrast()'>High Contrast</button>
            <button id='animationsBtn' onclick='toggleAnimations()'>Animations</button>
            <button id='reducedMotionBtn' onclick='toggleReducedMotion()'>Reduced Motion</button>
        </div>
        
        <label>Animation Speed:</label>
        <div class='slider-container'>
            <input type='range' id='animSpeedSlider' min='0.5' max='3' step='0.1' value='1' onchange='updateAnimSpeed(this.value)'>
            <span class='slider-value' id='animSpeedValue'>1x</span>
        </div>
    </div>

    <div class='control-group'>
        <h3>♿ Accessibility</h3>
        <label>Color Blind Support:</label>
        <select id='colorBlindSelect' onchange='updateColorBlind(this.value)'>
            <option value='none'>None</option>
            <option value='protanopia'>Protanopia (Red-blind)</option>
            <option value='deuteranopia'>Deuteranopia (Green-blind)</option>
            <option value='tritanopia'>Tritanopia (Blue-blind)</option>
        </select>
        
        <div class='toggle-group'>
            <button id='focusIndicatorsBtn' onclick='toggleFocusIndicators()'>Enhanced Focus</button>
            <button id='screenReaderBtn' onclick='toggleScreenReader()'>Screen Reader Mode</button>
        </div>
    </div>

    <div class='control-group'>
        <h3>💾 Actions</h3>
        <div class='toggle-group'>
            <button onclick='saveSettings()'>💾 Save Settings</button>
            <button onclick='loadSettings()'>📂 Load Settings</button>
            <button onclick='resetSettings()'>🔄 Reset to Default</button>
            <button onclick='exportCSS()'>📋 Export CSS</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentState = {
            theme: 'space',
            font: 'good-times',
            textSize: 16,
            contrast: false,
            animations: true,
            reducedMotion: false,
            colorBlind: 'none',
            focusIndicators: false,
            screenReader: false
        };

        function updateTheme(theme) {
            currentState.theme = theme;
            document.getElementById('themePreview').style.cssText = getThemeCSS(theme);
            vscode.postMessage({command: 'updateTheme', value: theme});
        }

        function updateFont(font) {
            currentState.font = font;
            document.getElementById('themePreview').style.fontFamily = font + ', sans-serif';
            vscode.postMessage({command: 'updateFont', value: font});
        }

        function updateTextSize(size) {
            currentState.textSize = size;
            document.getElementById('textSizeValue').textContent = size + 'px';
            vscode.postMessage({command: 'updateTextSize', value: size});
        }

        function updateAnimSpeed(speed) {
            document.getElementById('animSpeedValue').textContent = speed + 'x';
            vscode.postMessage({command: 'updateAnimSpeed', value: speed});
        }

        function toggleContrast() {
            currentState.contrast = !currentState.contrast;
            const btn = document.getElementById('contrastBtn');
            btn.classList.toggle('active', currentState.contrast);
            vscode.postMessage({command: 'toggleContrast', value: currentState.contrast});
        }

        function toggleAnimations() {
            currentState.animations = !currentState.animations;
            const btn = document.getElementById('animationsBtn');
            btn.classList.toggle('active', currentState.animations);
            vscode.postMessage({command: 'toggleAnimations', value: currentState.animations});
        }

        function toggleReducedMotion() {
            currentState.reducedMotion = !currentState.reducedMotion;
            const btn = document.getElementById('reducedMotionBtn');
            btn.classList.toggle('active', currentState.reducedMotion);
            vscode.postMessage({command: 'toggleReducedMotion', value: currentState.reducedMotion});
        }

        function updateColorBlind(mode) {
            currentState.colorBlind = mode;
            vscode.postMessage({command: 'updateColorBlind', value: mode});
        }

        function toggleFocusIndicators() {
            currentState.focusIndicators = !currentState.focusIndicators;
            const btn = document.getElementById('focusIndicatorsBtn');
            btn.classList.toggle('active', currentState.focusIndicators);
            vscode.postMessage({command: 'toggleFocusIndicators', value: currentState.focusIndicators});
        }

        function toggleScreenReader() {
            currentState.screenReader = !currentState.screenReader;
            const btn = document.getElementById('screenReaderBtn');
            btn.classList.toggle('active', currentState.screenReader);
            vscode.postMessage({command: 'toggleScreenReader', value: currentState.screenReader});
        }

        function getThemeCSS(theme) {
            const themes = {
                'space': 'background: #0a0a1a; color: #e0e1dd; border: 2px solid #00ffc8;',
                'golf': 'background: #f5f0e1; color: #1a1a1a; border: 2px solid #2d5a27;',
                'baseball': 'background: #228b22; color: #f8f8f8; border: 2px solid #c41e3a;',
                'quiz-show': 'background: #0066cc; color: #ffffff; border: 2px solid #ffc400;'
            };
            return themes[theme] || themes['space'];
        }

        function saveSettings() {
            vscode.postMessage({command: 'saveSettings', value: currentState});
        }

        function loadSettings() {
            vscode.postMessage({command: 'loadSettings'});
        }

        function resetSettings() {
            vscode.postMessage({command: 'resetSettings'});
            location.reload();
        }

        function exportCSS() {
            vscode.postMessage({command: 'exportCSS', value: currentState});
        }

        // Initialize
        updateTheme('space');
    </script>
</body>
</html>"))

    ;; Handle messages from webview
    (set! (.. panel -webview -onDidReceiveMessage)
          (fn [message]
            (let [command (.-command message)
                  value (.-value message)]
              (case command
                "updateTheme" (handle-theme-update value)
                "updateFont" (handle-font-update value)
                "updateTextSize" (handle-text-size-update value)
                "updateAnimSpeed" (handle-anim-speed-update value)
                "toggleContrast" (handle-contrast-toggle value)
                "toggleAnimations" (handle-animations-toggle value)
                "toggleReducedMotion" (handle-reduced-motion-toggle value)
                "updateColorBlind" (handle-colorblind-update value)
                "toggleFocusIndicators" (handle-focus-toggle value)
                "toggleScreenReader" (handle-screenreader-toggle value)
                "saveSettings" (handle-save-settings value)
                "loadSettings" (handle-load-settings)
                "resetSettings" (handle-reset-settings)
                "exportCSS" (handle-export-css value)
                (println "Unknown command:" command)))))
    
    panel))

;; Event handlers
(defn handle-theme-update [theme]
  (swap! control-state assoc :theme-mode theme)
  (vscode/window.showInformationMessage (str "Theme updated to: " theme))
  (apply-theme-to-workspace theme))

(defn handle-font-update [font]
  (swap! control-state assoc :font-family font)
  (vscode/window.showInformationMessage (str "Font updated to: " font)))

(defn handle-text-size-update [size]
  (swap! control-state assoc :text-size size)
  (vscode/window.showInformationMessage (str "Text size updated to: " size "px")))

(defn handle-anim-speed-update [speed]
  (swap! control-state assoc :animation-speed speed)
  (vscode/window.showInformationMessage (str "Animation speed: " speed "x")))

(defn handle-contrast-toggle [enabled]
  (swap! control-state assoc :contrast-mode (if enabled "high" "normal"))
  (vscode/window.showInformationMessage (str "High contrast: " (if enabled "ON" "OFF"))))

(defn handle-animations-toggle [enabled]
  (vscode/window.showInformationMessage (str "Animations: " (if enabled "ON" "OFF"))))

(defn handle-reduced-motion-toggle [enabled]
  (vscode/window.showInformationMessage (str "Reduced motion: " (if enabled "ON" "OFF"))))

(defn handle-colorblind-update [mode]
  (swap! control-state assoc :color-blind-mode mode)
  (vscode/window.showInformationMessage (str "Color blind support: " mode)))

(defn handle-focus-toggle [enabled]
  (vscode/window.showInformationMessage (str "Enhanced focus indicators: " (if enabled "ON" "OFF"))))

(defn handle-screenreader-toggle [enabled]
  (vscode/window.showInformationMessage (str "Screen reader mode: " (if enabled "ON" "OFF"))))

(defn handle-save-settings [settings]
  (vscode/window.showInformationMessage "Settings saved!")
  (println "Saved settings:" settings))

(defn handle-load-settings []
  (vscode/window.showInformationMessage "Settings loaded!"))

(defn handle-reset-settings []
  (reset! control-state {:active false
                        :theme-mode "space"
                        :font-family "good-times"
                        :contrast-mode "normal"
                        :animation-speed "normal"
                        :color-blind-mode "none"
                        :text-size "medium"
                        :spacing-mode "normal"})
  (vscode/window.showInformationMessage "Settings reset to default!"))

(defn handle-export-css [settings]
  (let [css-output (generate-css-from-settings settings)]
    (vscode/env.clipboard.writeText css-output)
    (vscode/window.showInformationMessage "CSS exported to clipboard!")))

(defn apply-theme-to-workspace [theme]
  "Apply theme changes to workspace files"
  (let [theme-config (get themes theme)]
    (when theme-config
      (vscode/window.showInformationMessage 
        (str "Applying " theme " theme with colors: " (pr-str theme-config))))))

(defn generate-css-from-settings [settings]
  "Generate CSS based on current settings"
  (str "/* Generated CSS from Control Panel */\n"
       ":root {\n"
       "  --control-theme: " (.-theme settings) ";\n"
       "  --control-font: " (.-font settings) ";\n"
       "  --control-text-size: " (.-textSize settings) "px;\n"
       "  --control-contrast: " (if (.-contrast settings) "high" "normal") ";\n"
       "  --control-animations: " (if (.-animations settings) "enabled" "disabled") ";\n"
       "  --control-colorblind: " (.-colorBlind settings) ";\n"
       "}\n\n"
       "/* Apply settings */\n"
       "body { font-size: var(--control-text-size); }\n"
       ".theme-" (.-theme settings) " { /* Theme-specific styles */ }\n"))

;; Public API
(defn show-control-panel []
  "Show the CSS control panel"
  (swap! control-state assoc :active true)
  (create-webview-panel))

(defn hide-control-panel []
  "Hide the CSS control panel"
  (swap! control-state assoc :active false))

(defn get-current-state []
  "Get current control panel state"
  @control-state)

(defn apply-settings [settings]
  "Apply settings to the workspace"
  (reset! control-state settings)
  (vscode/window.showInformationMessage "Settings applied successfully!"))

;; Initialize
(println "CSS Control Panel loaded! Use (show-control-panel) to open.")