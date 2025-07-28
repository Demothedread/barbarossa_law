import { fetchQuestionsByType, fetchSubjects, getVectorStoreStatus } from './lq-api.js';

/**
 * Create a start menu allowing users to choose number, subject, question type, and timer options.
 * @param {(opts:object)=>void} onStart Callback invoked when quiz should start.
 * @param {(opts:object)=>void} onGenerateQuestions Callback invoked when question generation is requested.
 * @returns {HTMLElement}
 */
export function createStartMenu(onStart, onGenerateQuestions) {
  const container = document.createElement('div');
  container.className = 'start-menu';

  // Create Question Generator Section
  const generatorSection = createQuestionGeneratorSection(onGenerateQuestions);
  container.appendChild(generatorSection);

  // Create divider
  const divider = document.createElement('div');
  divider.className = 'section-divider';
  divider.innerHTML = `
    <div class="divider-line"></div>
    <span class="divider-text">OR</span>
    <div class="divider-line"></div>
  `;
  container.appendChild(divider);

  // Create Quiz Setup Section
  const quizSection = document.createElement('div');
  quizSection.className = 'quiz-setup-section';
  
  const quizHeader = document.createElement('div');
  quizHeader.className = 'section-header';
  quizHeader.innerHTML = `
    <h3>🎯 Start Quiz with Existing Questions</h3>
    <p>Choose from our database of law questions</p>
  `;
  quizSection.appendChild(quizHeader);

  const form = document.createElement('form');

  // Number of questions
  const labelNum = document.createElement('label');
  labelNum.textContent = 'Number of Questions: ';
  const inputNum = document.createElement('input');
  inputNum.type = 'number';
  inputNum.min = '1';
  inputNum.value = '5';
  labelNum.appendChild(inputNum);
  form.appendChild(labelNum);

  // Subject
  const labelSub = document.createElement('label');
  labelSub.textContent = ' Subject: ';
  const selectSub = document.createElement('select');
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '(Any)';
  selectSub.appendChild(defaultOpt);
  labelSub.appendChild(selectSub);
  form.appendChild(labelSub);

  // Question Type
  const labelType = document.createElement('label');
  labelType.textContent = ' Question Type: ';
  const selectType = document.createElement('select');
  
  const mixOpt = document.createElement('option');
  mixOpt.value = 'mix';
  mixOpt.textContent = 'Mix (All Questions)';
  selectType.appendChild(mixOpt);
  
  const mbeOpt = document.createElement('option');
  mbeOpt.value = 'mbe';
  mbeOpt.textContent = 'MBE Only';
  selectType.appendChild(mbeOpt);
  
  const generatedOpt = document.createElement('option');
  generatedOpt.value = 'generated';
  generatedOpt.textContent = 'AI Generated Only';
  selectType.appendChild(generatedOpt);
  
  labelType.appendChild(selectType);
  form.appendChild(labelType);

  // Quiz Mode Selection
  const labelMode = document.createElement('label');
  labelMode.textContent = ' Quiz Mode: ';
  const selectMode = document.createElement('select');
  
  const standardOpt = document.createElement('option');
  standardOpt.value = 'standard';
  standardOpt.textContent = 'Standard Quiz';
  selectMode.appendChild(standardOpt);
  
  const quizShowOpt = document.createElement('option');
  quizShowOpt.value = 'quiz-show';
  quizShowOpt.textContent = '📺 Quiz Show Mode (1970s Game Show)';
  selectMode.appendChild(quizShowOpt);
  
  const friendlyOpt = document.createElement('option');
  friendlyOpt.value = 'friendly';
  friendlyOpt.textContent = '⚾ Friendly Mode (Baseball Theme)';
  selectMode.appendChild(friendlyOpt);
  
  labelMode.appendChild(selectMode);
  form.appendChild(labelMode);

  // Timer setting
  const labelTimer = document.createElement('label');
  labelTimer.textContent = ' Minutes per Question: ';
  const inputTimer = document.createElement('input');
  inputTimer.type = 'number';
  inputTimer.min = '0.5';
  inputTimer.max = '10';
  inputTimer.step = '0.1';
  inputTimer.value = '1.8';
  labelTimer.appendChild(inputTimer);
  form.appendChild(labelTimer);

  // Quiz Show mode description
  const quizShowDesc = document.createElement('div');
  quizShowDesc.className = 'quiz-show-description';
  quizShowDesc.style.display = 'none';
  quizShowDesc.innerHTML = `
    <div class="mode-description">
      <h4>🎭 Quiz Show Mode Features:</h4>
      <ul>
        <li>📺 TV show intro sequence</li>
        <li>🏆 Game show scoring with time bonuses</li>
        <li>⏰ Dramatic 1970s-style timer with 10-second warning</li>
        <li>✨ Retro gameboard background with glowing squares</li>
        <li>🎯 High score leaderboard</li>
        <li>🎪 Game show host personality and encouragement</li>
      </ul>
      <p><em>Experience law quizzing like a classic 1970s game show!</em></p>
    </div>
  `;
  form.appendChild(quizShowDesc);

  // Friendly mode description
  const friendlyDesc = document.createElement('div');
  friendlyDesc.className = 'friendly-description';
  friendlyDesc.style.display = 'none';
  friendlyDesc.innerHTML = `
    <div class="mode-description">
      <h4>⚾ Friendly Mode Features:</h4>
      <ul>
        <li>🏟️ Baseball stadium intro with diamond background</li>
        <li>📚 No timer - take your time to learn!</li>
        <li>✅ Immediate answer reveal after each question</li>
        <li>🏏 "On deck" and "In the hole" topic selection</li>
        <li>📊 Baseball scoreboard with runs for/against</li>
        <li>⚾ Baseball terminology and encouragement</li>
        <li>🎯 Educational focus with detailed explanations</li>
      </ul>
      <p><em>A relaxed, educational experience with baseball charm!</em></p>
    </div>
  `;
  form.appendChild(friendlyDesc);

  // Update description visibility based on mode selection
  selectMode.addEventListener('change', () => {
    // Hide all descriptions first
    quizShowDesc.style.display = 'none';
    friendlyDesc.style.display = 'none';
    
    if (selectMode.value === 'quiz-show') {
      quizShowDesc.style.display = 'block';
      // Auto-switch to quiz-show theme if not already
      if (window.themeManager && window.themeManager.currentTheme !== 'quiz-show') {
        window.themeManager.applyTheme('quiz-show');
      }
    } else if (selectMode.value === 'friendly') {
      friendlyDesc.style.display = 'block';
      // Auto-switch to friendly theme if not already
      if (window.themeManager && window.themeManager.currentTheme !== 'friendly') {
        window.themeManager.applyTheme('friendly');
      }
    }
  });

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = '🚀 Start Quiz';
  submitBtn.className = 'btn btn-primary start-btn';
  form.appendChild(submitBtn);

  quizSection.appendChild(form);
  container.appendChild(quizSection);

  // Load subjects and set up form
  loadSubjects();
  
  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = parseInt(inputNum.value) || 5;
    const subject = selectSub.value;
    const questionType = selectType.value;
    const quizMode = selectMode.value;
    const timer = parseFloat(inputTimer.value) || 1.8;
    
    if (n > 0) {
      onStart({ n, subject, questionType, quizMode, timer });
    }
  });

  // Update max questions based on filters
  async function updateMax() {
    const subject = selectSub.value;
    const questionType = selectType.value;
    let n = 999;
    try {
      const res = await fetchQuestionsByType(999, subject, questionType);
      n = res.available || 999;
    } catch (error) {
      console.error('Error fetching available questions:', error);
    }
    inputNum.max = n;
    if (parseInt(inputNum.value) > n) inputNum.value = n;
  }
  
  selectSub.addEventListener('change', updateMax);
  selectType.addEventListener('change', updateMax);
  updateMax();

  return container;

  // === HELPER FUNCTIONS ===

  function createQuestionGeneratorSection(onGenerateQuestions) {
    const section = document.createElement('div');
    section.className = 'generator-section';
    
    const header = document.createElement('div');
    header.className = 'section-header featured';
    header.innerHTML = `
      <h3>🤖 AI Question Generator</h3>
      <p>Create new custom questions with AI</p>
      <div class="feature-badges">
        <span class="badge">Custom Instructions</span>
        <span class="badge">Subject Targeting</span>
        <span class="badge">Difficulty Control</span>
      </div>
    `;
    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'generator-content';
    content.id = 'generatorContent';
    
    // Quick setup form
    const quickForm = document.createElement('div');
    quickForm.className = 'quick-generator-form';
    quickForm.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label for="quickQuestions">Questions:</label>
          <select id="quickQuestions" class="form-select">
            <option value="5">5 Questions</option>
            <option value="10" selected>10 Questions</option>
            <option value="15">15 Questions</option>
            <option value="20">20 Questions</option>
            <option value="25">25 Questions</option>
          </select>
        </div>
        <div class="form-group">
          <label for="quickSubject">Focus:</label>
          <select id="quickSubject" class="form-select">
            <option value="">All Subjects</option>
            <option value="contracts">Contracts</option>
            <option value="torts">Torts</option>
            <option value="criminal-law">Criminal Law</option>
            <option value="constitutional-law">Constitutional Law</option>
          </select>
        </div>
      </div>
      <div class="generator-actions">
        <button type="button" class="btn btn-secondary btn-full" id="advancedGeneratorBtn">
          ⚙️ Advanced Options
        </button>
        <button type="button" class="btn btn-primary btn-full" id="quickGenerateBtn">
          🚀 Generate Questions
        </button>
      </div>
    `;
    
    content.appendChild(quickForm);
    
    // Status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'generator-status-mini';
    statusIndicator.id = 'generatorStatus';
    statusIndicator.innerHTML = `
      <div class="status-checking">
        <span class="status-icon">⏳</span>
        <span class="status-text">Checking AI availability...</span>
      </div>
    `;
    content.appendChild(statusIndicator);

    section.appendChild(content);

    // Set up event listeners
    setupGeneratorEvents(onGenerateQuestions);
    
    // Check generator status
    checkGeneratorStatus();

    return section;
  }

  function setupGeneratorEvents(onGenerateQuestions) {
    // Quick generate button
    setTimeout(() => {
      const quickBtn = document.getElementById('quickGenerateBtn');
      if (quickBtn) {
        quickBtn.addEventListener('click', () => {
          const numQuestions = parseInt(document.getElementById('quickQuestions').value);
          const subject = document.getElementById('quickSubject').value;
          
          if (onGenerateQuestions) {
            onGenerateQuestions({
              mode: 'quick',
              numQuestions,
              subject,
              customInstructions: ''
            });
          }
        });
      }

      // Advanced options button
      const advancedBtn = document.getElementById('advancedGeneratorBtn');
      if (advancedBtn) {
        advancedBtn.addEventListener('click', () => {
          if (onGenerateQuestions) {
            onGenerateQuestions({
              mode: 'advanced'
            });
          }
        });
      }
    }, 100);
  }

  async function checkGeneratorStatus() {
    setTimeout(async () => {
      const statusEl = document.getElementById('generatorStatus');
      if (!statusEl) return;

      try {
        const status = await getVectorStoreStatus();
        
        if (status.available) {
          statusEl.innerHTML = `
            <div class="status-ready">
              <span class="status-icon">✅</span>
              <span class="status-text">AI Generator Ready</span>
            </div>
          `;
          
          // Enable generator buttons
          const quickBtn = document.getElementById('quickGenerateBtn');
          const advancedBtn = document.getElementById('advancedGeneratorBtn');
          if (quickBtn) quickBtn.disabled = false;
          if (advancedBtn) advancedBtn.disabled = false;
        } else {
          statusEl.innerHTML = `
            <div class="status-unavailable">
              <span class="status-icon">❌</span>
              <span class="status-text">AI Generator Unavailable</span>
            </div>
          `;
          
          // Disable generator buttons
          const quickBtn = document.getElementById('quickGenerateBtn');
          const advancedBtn = document.getElementById('advancedGeneratorBtn');
          if (quickBtn) quickBtn.disabled = true;
          if (advancedBtn) advancedBtn.disabled = true;
        }
      } catch (error) {
        statusEl.innerHTML = `
          <div class="status-error">
            <span class="status-icon">⚠️</span>
            <span class="status-text">Connection Error</span>
          </div>
        `;
        
        // Disable generator buttons
        const quickBtn = document.getElementById('quickGenerateBtn');
        const advancedBtn = document.getElementById('advancedGeneratorBtn');
        if (quickBtn) quickBtn.disabled = true;
        if (advancedBtn) advancedBtn.disabled = true;
      }
    }, 500);
  }

  async function loadSubjects() {
    try {
      const subjects = await fetchSubjects();
      subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        selectSub.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  }
}
