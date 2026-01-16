
import { fetchAIExplanations } from './lq-api.js';
import { EnhancedHighlighting } from './enhanced-highlighting.js';
import { EnhancedScratchPaper } from './enhanced-scratch-paper.js';

function createChoice(text, index, selected, eliminated, onSelect, onEliminate) {
  const li = document.createElement('li');
  const button = document.createElement('button');
  button.textContent = text;
  button.className = selected ? 'selected' : '';
  
  // Add click handler with sound and visual feedback
  button.addEventListener('click', () => {
    // Clear any previous golden selections in this choice list
    const choicesList = li.closest('.choices-list');
    if (choicesList) {
      choicesList.querySelectorAll('li, button').forEach(el => {
        el.classList.remove('golden-selected');
        el.style.boxShadow = '';
        el.style.borderColor = '';
        el.style.backgroundColor = '';
      });
    }
    
    // Play click sound effect (browser beep as fallback)
    try {
      // Try to use Web Audio API for a simple click sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Click sound generation failed:', error);
    }
    
    // Enhanced deep golden glow effect for user selection
    li.style.boxShadow = '0 0 25px rgba(255, 215, 0, 0.9), 0 0 50px rgba(218, 165, 32, 0.6), inset 0 0 15px rgba(255, 215, 0, 0.3)';
    li.style.borderColor = '#DAA520'; // Deep gold border
    li.style.backgroundColor = 'rgba(255, 215, 0, 0.1)'; // Subtle golden background
    li.style.transform = 'scale(1.02)';
    li.style.transition = 'all 0.3s ease-in-out';
    
    // Add persistent golden glow for selected state
    button.classList.add('golden-selected');
    li.classList.add('golden-selected');
    
    // Remove temporary animation effects but keep selection styling
    setTimeout(() => {
      li.style.transform = '';
      // Keep the golden glow for selected state
      li.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.7), inset 0 0 10px rgba(255, 215, 0, 0.2)';
    }, 300);
    
    onSelect(index);
  });

  const elim = document.createElement('button');
  elim.textContent = '✖';
  elim.className = 'elim';
  elim.type = 'button';
  elim.setAttribute('aria-label', 'Cross out this choice');
  elim.title = 'Cross out this choice';
  elim.addEventListener('click', (e) => {
    e.stopPropagation();
    li.classList.toggle('eliminated');
    onEliminate(index, li.classList.contains('eliminated'));
  });
  if (eliminated) li.classList.add('eliminated');

  li.appendChild(button);
  li.appendChild(elim);
  return li;
}

function renderQuestion(container, q, state) {
  container.innerHTML = '';
  
  // Create a wrapper for better layout
  const questionWrapper = document.createElement('div');
  questionWrapper.className = 'question-wrapper';
  
  // Add prompt if exists
  if (q.prompt) {
    const ctx = document.createElement('div');
    ctx.className = 'prompt';
    ctx.innerHTML = q.prompt;
    questionWrapper.appendChild(ctx);
  }
  
  // Add main question text
  const text = document.createElement('div');
  text.className = 'question-text';
  text.innerHTML = q.question;
  text.contentEditable = true;
  text.spellcheck = false;
  text.style.outline = '1px dashed #eee';
  questionWrapper.appendChild(text);
  
  // Initialize enhanced highlighting system
  const questionId = q.idx || state.current;
  const enhancedHighlighting = new EnhancedHighlighting(text, questionId, (highlights) => {
    // Store highlights in question state for persistence
    if (!state.questionHighlights) state.questionHighlights = {};
    state.questionHighlights[questionId] = highlights;
    localStorage.setItem('lq_question_highlights', JSON.stringify(state.questionHighlights));
  });
  
  // Store reference for cleanup
  text._enhancedHighlighting = enhancedHighlighting;

  const list = document.createElement('ul');
  list.className = 'choices-list';
  q.choices.forEach((choice, idx) => {
    const item = createChoice(
      choice,
      idx,
      state.answers[state.current] === idx,
      state.eliminated[state.current]?.[idx],
      (i) => { state.answers[state.current] = i; renderQuestion(container, q, state); },
      (i, el) => {
        if (!state.eliminated[state.current]) state.eliminated[state.current] = {};
        state.eliminated[state.current][i] = el;
      },
    );
    list.appendChild(item);
  });
  questionWrapper.appendChild(list);
  
  // Finally append the wrapper to the container
  container.appendChild(questionWrapper);
}

// Dynamic/API-based quiz creator: accepts question array, options, and onComplete callback
export function createApiQuiz(questions, opts, onComplete) {
  console.log('[DEBUG] Creating API quiz with:', {
    questionCount: questions?.length,
    opts,
    hasCallback: typeof onComplete === 'function'
  });

  if (!questions || !questions.length) {
    console.error('[DEBUG] No questions provided to createApiQuiz');
    return null;
  }

  const total = questions.length;
  const container = document.createElement('div');
  container.className = 'quiz';

  if (opts.quizMode === 'barbarossa-overtime') {
    const overtimeBanner = document.createElement('div');
    overtimeBanner.className = 'overtime-banner';
    overtimeBanner.innerHTML = `
      <strong>☠️ Barbarossa Overtime:</strong>
      Cross out options, keep changing answers after time expires, and watch the clock dip into negative time.
    `;
    container.appendChild(overtimeBanner);
  }
  
  const state = {
    current: 0,
    answers: new Array(total).fill(null), // index of choice
    eliminated: {}, // { qIndex: { [choiceIdx]: true } }
    startTime: Date.now(),
    aiExplanations: null, // Store fetched explanations
    backgroundFetchStarted: false,
    questionHighlights: JSON.parse(localStorage.getItem('lq_question_highlights') || '{}')
  };

  console.log('[DEBUG] Quiz state initialized:', {
    total,
    currentQuestion: state.current,
    hasHighlights: Object.keys(state.questionHighlights).length > 0
  });

  // --- Enhanced Digital Scratch Paper ---
  console.log('[DEBUG] Initializing quiz with scratch paper');
  const scratchContainer = document.createElement('div');
  let enhancedScratchPaper;
  
  try {
    // Check if custom element is already defined
    if (!customElements.get('mce-autosize-textarea')) {
      enhancedScratchPaper = new EnhancedScratchPaper(scratchContainer, {
        autoSave: true,
        autoSaveInterval: 2000,
        richText: true,
        search: true,
        templates: true
      });
    } else {
      console.log('[DEBUG] Scratch paper custom element already defined, skipping initialization');
      scratchContainer.innerHTML = '<div class="scratch-paper-placeholder">Scratch Paper</div>';
    }
  } catch (error) {
    console.error('[DEBUG] Error initializing scratch paper:', error);
    scratchContainer.innerHTML = '<div class="scratch-paper-fallback">Scratch Paper Unavailable</div>';
  }
  
  // Place scratch paper in container
  console.log('[DEBUG] Appending scratch container to quiz');
  container.appendChild(scratchContainer);

  // Start fetching AI explanations in the background
  const startBackgroundFetch = async () => {
    if (state.backgroundFetchStarted) return;
    state.backgroundFetchStarted = true;
    
    try {
      console.log('Starting background fetch of AI explanations...');
      const questionIds = questions.map(q => q.idx);
      state.aiExplanations = await fetchAIExplanations(questionIds);
      console.log('Background AI explanations fetch completed');
    } catch (error) {
      console.error('Background AI explanations fetch failed:', error);
      state.aiExplanations = {};
    }
  };

  // Start the background fetch immediately when quiz starts
  startBackgroundFetch();

  const questionContainer = document.createElement('div');
  container.appendChild(questionContainer);

  // Navigation
  const nav = document.createElement('div');
  nav.className = 'quiz-nav';
  const prev = document.createElement('button');
  prev.textContent = '< Prev';
  const next = document.createElement('button');
  next.textContent = 'Next >';
  
  // Add finish quiz button
  const finishButton = document.createElement('button');
  finishButton.textContent = 'End Exam';
  finishButton.className = 'finish-button';
  finishButton.onclick = () => {
    // Create confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.className = 'confirm-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to end the exam?';
    
    const btnContainer = document.createElement('div');
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => document.body.removeChild(confirmModal);
    
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Yes, End Exam';
    confirmBtn.className = 'confirm-btn';
    confirmBtn.onclick = () => {
      document.body.removeChild(confirmModal);
      finishQuiz();
    };
    
    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);
    
    modalContent.appendChild(message);
    modalContent.appendChild(btnContainer);
    confirmModal.appendChild(modalContent);
    
    document.body.appendChild(confirmModal);
  };
  
  nav.appendChild(prev);
  nav.appendChild(next);
  nav.appendChild(finishButton);
  container.appendChild(nav);

  // Timer with enhanced pause functionality
  let totalSecs = Math.ceil(opts.timer * 60 * total);
  const timerContainer = document.createElement('div');
  timerContainer.className = 'timer-container';
  if (opts.quizMode === 'barbarossa-overtime') {
    timerContainer.classList.add('overtime-enabled');
  }
  
  const timerDisplay = document.createElement('span');
  timerDisplay.className = 'timer-display';
  
  const pauseButton = document.createElement('button');
  pauseButton.textContent = '⏸️ Pause';
  pauseButton.className = 'pause-button';
  pauseButton.title = 'Pause/Resume Timer (Spacebar)';
  
  timerContainer.appendChild(timerDisplay);
  timerContainer.appendChild(pauseButton);
  
  // Add helpful tip about spacebar shortcut
  const shortcutTip = document.createElement('div');
  shortcutTip.className = 'shortcut-tip';
  shortcutTip.textContent = 'Tip: Press Spacebar to pause/resume';
  timerContainer.appendChild(shortcutTip);
  
  container.appendChild(timerContainer);
  
  let timerStop = false;
  let timerPaused = false;
  let timerVal = totalSecs;
  let isNegativeTime = false;
  
  // Get theme audio manager for pause/resume sounds
  let audioManager = null;
  if (window.themeManager && window.themeManager.audioManager) {
    audioManager = window.themeManager.audioManager;
  }
  
  // Enhanced pause/resume function
  function togglePause() {
    // Prevent rapid toggle during transitions
    if (pauseButton.disabled) return;
    
    // Temporarily disable button to prevent rapid clicking
    pauseButton.disabled = true;
    setTimeout(() => {
      pauseButton.disabled = false;
    }, 250);
    
    timerPaused = !timerPaused;
    
    // Play pause/resume sound
    if (audioManager) {
      audioManager.playSound('timer', 0.4);
    }
    
    if (timerPaused) {
      pauseButton.textContent = '▶️ Resume';
      pauseButton.classList.add('paused');
      pauseButton.title = 'Resume Timer (Spacebar)';
      timerDisplay.classList.add('paused');
      timerContainer.classList.add('paused');
      
      // Add paused indicator text
      if (!timerDisplay.querySelector('.pause-indicator')) {
        const pauseIndicator = document.createElement('span');
        pauseIndicator.className = 'pause-indicator';
        pauseIndicator.textContent = ' (PAUSED)';
        timerDisplay.appendChild(pauseIndicator);
      }
      
      // Add accessibility announcement
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = 'Timer paused. Press spacebar or click Resume to continue.';
      container.appendChild(announcement);
      setTimeout(() => announcement.remove(), 3000);
      
    } else {
      pauseButton.textContent = '⏸️ Pause';
      pauseButton.classList.remove('paused');
      pauseButton.title = 'Pause Timer (Spacebar)';
      timerDisplay.classList.remove('paused');
      timerContainer.classList.remove('paused');
      
      // Remove paused indicator text
      const pauseIndicator = timerDisplay.querySelector('.pause-indicator');
      if (pauseIndicator) {
        pauseIndicator.remove();
      }
      
      // Add accessibility announcement
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = 'Timer resumed.';
      container.appendChild(announcement);
      setTimeout(() => announcement.remove(), 3000);
    }
  }
  
  // Pause button functionality
  pauseButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePause();
  });
  
  // Keyboard shortcut for pause/resume (spacebar)
  const handleKeydown = (e) => {
    // Only trigger if not typing in an input field and spacebar is pressed
    // Also check if timer is not stopped to prevent action after quiz ends
    if (e.code === 'Space' && !e.target.matches('input, textarea, [contenteditable]') && !timerStop) {
      e.preventDefault();
      e.stopPropagation();
      togglePause();
    }
  };
  
  document.addEventListener('keydown', handleKeydown);
  
  // Store reference for cleanup
  container.addEventListener('DOMNodeRemoved', () => {
    document.removeEventListener('keydown', handleKeydown);
  });
  
  const timerTick = () => {
    if (timerStop || timerPaused) return;
    
    if (timerVal > 0) {
      timerDisplay.textContent = `Time: ${Math.floor(timerVal/60)}m ${timerVal%60}s`;
      timerVal--;
    } else {
      // When time is up, continue counting but in negative
      isNegativeTime = true;
      const negativeSeconds = Math.abs(timerVal);
      timerDisplay.textContent = `Time: -${Math.floor(negativeSeconds/60)}m ${negativeSeconds%60}s`;
      timerDisplay.classList.add('negative-time');
      timerVal--;
      
      // If this is the first second of overtime, show a notification
      if (negativeSeconds === 1) {
        const timeUpNotice = document.createElement('div');
        timeUpNotice.className = 'time-up-notice';
        timeUpNotice.textContent = 'Time is up! You can still complete the exam, but you are now in overtime.';
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => container.removeChild(timeUpNotice);
        timeUpNotice.appendChild(closeBtn);
        
        container.insertBefore(timeUpNotice, questionContainer);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          if (container.contains(timeUpNotice)) {
            container.removeChild(timeUpNotice);
          }
        }, 10000);
      }
    }
    
    // Always continue the timer
    setTimeout(timerTick, 1000);
  };
  
  timerTick();

  function showQuestion(index) {
    state.current = index;
    renderQuestion(questionContainer, questions[index], state);
    prev.disabled = index === 0;
    next.textContent = (index === total - 1 ? 'Finish' : 'Next >');
    
    // Maintain pause state across question navigation
    if (timerPaused) {
      // Ensure visual indicators remain consistent
      pauseButton.textContent = '▶️ Resume';
      pauseButton.classList.add('paused');
      timerDisplay.classList.add('paused');
      timerContainer.classList.add('paused');
      
      // Ensure pause indicator text is present
      if (!timerDisplay.querySelector('.pause-indicator')) {
        const pauseIndicator = document.createElement('span');
        pauseIndicator.className = 'pause-indicator';
        pauseIndicator.textContent = ' (PAUSED)';
        timerDisplay.appendChild(pauseIndicator);
      }
    }
  }
  prev.onclick = () => {
    if (state.current > 0) showQuestion(state.current - 1);
  };
  next.onclick = () => {
    if (state.current < total - 1) {
      showQuestion(state.current + 1);
    } else {
      finishQuiz();
    }
  };

  function finishQuiz() {
    timerStop = true;
    
    // Clean up keyboard event listener
    document.removeEventListener('keydown', handleKeydown);
    
    // Clean up enhanced highlighting instances
    const questionTexts = container.querySelectorAll('.question-text');
    questionTexts.forEach(text => {
      if (text._enhancedHighlighting) {
        text._enhancedHighlighting.destroy();
      }
    });
    
    // Clean up enhanced scratch paper
    if (enhancedScratchPaper) {
      enhancedScratchPaper.destroy();
    }
    
    // Disable pause button when quiz is finished
    pauseButton.disabled = true;
    pauseButton.style.opacity = '0.5';
    
    const duration = Math.ceil((Date.now() - state.startTime) / 1000);
    // meta: correct, total, duration, answers, eliminated, and pre-fetched AI explanations
    let correct = 0;
    questions.forEach((q, i) => {
      if (state.answers[i] !== null &&
         'ABCD'[state.answers[i]]===q.answer) correct++;
    });
    onComplete(questions, state.answers, {
      correct,
      total,
      duration_s: duration,
      eliminated: state.eliminated,
      negative_time: isNegativeTime,
      timer: opts.timer,
      aiExplanations: state.aiExplanations, // Pass pre-fetched explanations
      questionHighlights: state.questionHighlights // Pass highlights for review
    });
  }

  showQuestion(0);
  return container;
}
// Static quiz creator: accepts number of questions, a QuestionManager, a ProgressTracker, and onComplete callback
function createStaticQuiz(_count, _questionManager, _progressTracker, _onComplete) {
  const container = document.createElement('div');
  container.className = 'quiz';
  // Basic static quiz placeholder. Extend with UI logic as needed.
  return container;
}

/**
 * createQuiz dispatcher: static or API-based quiz creator
 * @param {...*} args - arguments for static (count, qm, tracker, onComplete) or dynamic (questions, opts, onComplete)
 */
export function createQuiz(...args) {
  if (typeof args[0] === 'number') {
    return createStaticQuiz(...args);
  }
  return createApiQuiz(...args);
}
