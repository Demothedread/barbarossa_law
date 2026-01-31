(ns activate
  "Joyride workspace activation - runs when VS Code opens this workspace"
  (:require
   ["vscode" :as vscode]
   [joyride.core :as joyride]))

;; Register Copy Manager command
(defonce !copy-manager-disposable (atom nil))

(defn register-copy-manager! []
  (when-let [old @!copy-manager-disposable]
    (.dispose old))
  (reset! !copy-manager-disposable
    (vscode/commands.registerCommand
      "barbarossa.copyManager"
      (fn []
        (-> (joyride/load-file ".joyride/scripts/copy_manager.cljs")
            (.then (fn [_]
                     (let [ns (find-ns 'copy-manager)]
                       (when ns
                         ((ns-resolve ns 'main)))))))))))

;; Register on activation
(register-copy-manager!)

;; Show welcome message
(vscode/window.showInformationMessage 
  "🎭 Barbarossa Joyride activated! Use Cmd+Shift+P → 'Barbarossa: Copy Manager'")

(println "Joyride activated for barbarossa_law workspace")
(println "Commands registered:")
(println "  - barbarossa.copyManager (Cmd+Shift+P → 'Barbarossa: Copy Manager')")
