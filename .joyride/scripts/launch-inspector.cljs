(ns launch-inspector
  "Quick launcher for the Source Inspector"
  (:require
   ["vscode" :as vscode]
   [promesa.core :as p]))

;; Launch the inspector with a menu of options
(p/let [choice (vscode/window.showQuickPick
                (clj->js
                 [{:label "🌐 Open Site in Simple Browser"
                   :description "Launch localhost:3000 in VS Code's Simple Browser"
                   :action :browser}
                  {:label "🔍 Search by Element ID"
                   :description "Find code for a specific #id"
                   :action :id}
                  {:label "🎨 Search by CSS Class"
                   :description "Find code for a .class-name"
                   :action :class}
                  {:label "📝 Search by Text Content"
                   :description "Find code containing specific text"
                   :action :text}
                  {:label "📋 Copy Inspector Script"
                   :description "Copy JS to paste in browser DevTools"
                   :action :script}
                  {:label "❓ How to Use"
                   :description "Show instructions"
                   :action :help}])
                #js {:placeHolder "Source Inspector - Find code for page elements"
                     :title "🔍 Source Inspector"})]
  (when choice
    (case (keyword (.-action choice))
      :browser
      (do
        (vscode/commands.executeCommand "simpleBrowser.show" "http://localhost:3000")
        (vscode/window.showInformationMessage 
         "Site opened! Right-click → Open DevTools → Paste inspector script"))
      
      :id
      (p/let [id (vscode/window.showInputBox
                  #js {:prompt "Enter element ID to search for"
                       :placeHolder "homeBtn, loginBtn, authSection"})]
        (when id
          (vscode/commands.executeCommand 
           "workbench.action.findInFiles"
           #js {:query id
                :isRegex false
                :isCaseSensitive false
                :matchWholeWord false
                :filesToInclude "src/**,lunaire-spa/**,backend/**"
                :filesToExclude "**/node_modules/**,**/.nuxt/**"})))
      
      :class
      (p/let [cls (vscode/window.showInputBox
                   #js {:prompt "Enter CSS class to search for"
                        :placeHolder "lunaire-nav__btn, btn-lunaire--primary"})]
        (when cls
          (vscode/commands.executeCommand 
           "workbench.action.findInFiles"
           #js {:query cls
                :isRegex false
                :filesToInclude "src/**,lunaire-spa/**"
                :filesToExclude "**/node_modules/**"})))
      
      :text
      (p/let [text (vscode/window.showInputBox
                    #js {:prompt "Enter text to search for"
                         :placeHolder "Clubhouse, Start Quiz, Barbarossa"})]
        (when text
          (vscode/commands.executeCommand 
           "workbench.action.findInFiles"
           #js {:query text
                :filesToInclude "src/**,lunaire-spa/**,backend/**"
                :filesToExclude "**/node_modules/**,**/.nuxt/**"})))
      
      :script
      (let [script "
/* Source Inspector - Paste this in browser DevTools console */
(function() {
  if (window.__sourceInspectorActive) { console.log('Already active!'); return; }
  window.__sourceInspectorActive = true;
  
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;pointer-events:none;border:2px dashed #00ffc8;background:rgba(0,255,200,0.1);z-index:999999;display:none;transition:all 0.1s';
  document.body.appendChild(overlay);
  
  const tooltip = document.createElement('div');
  tooltip.style.cssText = 'position:fixed;background:#1a1a2e;color:#00ffc8;padding:8px 12px;border-radius:6px;font-family:monospace;font-size:12px;z-index:1000000;pointer-events:none;max-width:400px;box-shadow:0 4px 20px rgba(0,0,0,0.5);border:1px solid #00ffc8;display:none';
  document.body.appendChild(tooltip);
  
  const status = document.createElement('div');
  status.innerHTML = '🔍 Inspector Active<br><small>Dbl-click to copy • Esc to exit</small>';
  status.style.cssText = 'position:fixed;top:10px;right:10px;background:#1a1a2e;color:#00ffc8;padding:12px;border-radius:8px;font-family:sans-serif;font-size:14px;z-index:1000001;border:2px solid #00ffc8';
  document.body.appendChild(status);
  
  let current = null;
  
  function getInfo(el) {
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: Array.from(el.classList),
      text: (el.textContent || '').trim().substring(0, 60)
    };
  }
  
  document.addEventListener('mousemove', e => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && !el.id?.includes('source-inspector')) {
      current = el;
      const rect = el.getBoundingClientRect();
      overlay.style.cssText += ';display:block;top:'+rect.top+'px;left:'+rect.left+'px;width:'+rect.width+'px;height:'+rect.height+'px';
      const info = getInfo(el);
      tooltip.innerHTML = '<b>&lt;'+info.tag+'&gt;</b>'+(info.id?' <span style=\"color:#ffd700\">#'+info.id+'</span>':'')+(info.classes.length?'<br><span style=\"color:#87ceeb\">.'+info.classes.join('.')+'</span>':'');
      tooltip.style.cssText += ';display:block;top:'+(rect.bottom+10)+'px;left:'+rect.left+'px';
    }
  });
  
  document.addEventListener('dblclick', e => {
    e.preventDefault();
    if (current) {
      const info = getInfo(current);
      const searchTerms = [info.id, ...info.classes.slice(0,3), info.text?.substring(0,30)].filter(Boolean).join(' | ');
      navigator.clipboard?.writeText(searchTerms);
      console.log('📋 Copied:', searchTerms);
      console.log('Element info:', info);
      status.innerHTML = '✓ Copied!<br><small>'+searchTerms.substring(0,40)+'</small>';
      setTimeout(() => { status.innerHTML = '🔍 Inspector Active<br><small>Dbl-click to copy • Esc to exit</small>'; }, 2000);
    }
  }, true);
  
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      window.__sourceInspectorActive = false;
      overlay.remove(); tooltip.remove(); status.remove();
      console.log('Inspector deactivated');
    }
  });
  
  console.log('🔍 Source Inspector ready! Double-click elements to copy search terms.');
})();
"]
        (-> (vscode/env.clipboard.writeText script)
            (.then #(vscode/window.showInformationMessage 
                     "✓ Inspector script copied! Paste in browser DevTools (F12 → Console)"))))
      
      :help
      (vscode/window.showInformationMessage
       "Source Inspector Help:

1. Start your dev server (npm start)
2. Open site in Simple Browser or external browser
3. Open DevTools (F12) → Console tab
4. Paste the inspector script
5. Double-click any element to copy search terms
6. Use Search by ID/Class/Text to find code in VS Code

The inspector highlights elements as you hover and copies identifiers when you double-click!"
       "Got it!"))))

"Inspector launcher ready!"
