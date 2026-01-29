(ns launch-css-panel
  (:require
   [css-control-panel :as panel]))

;; Launch the CSS Control Panel
(panel/show-control-panel)

(println "🎨 CSS Control Panel launched!")
(println "Use the panel to adjust:")
(println "  • Theme modes (Space, Golf, Baseball, Quiz Show)")  
(println "  • Typography (10 TypeKit fonts available)")
(println "  • Accessibility options")
(println "  • Animation controls")
(println "  • Color blind support")
(println "")