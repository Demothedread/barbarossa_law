/**
 * Module: lq-question-generator.js
 * Comprehensive question generation interface with advanced features
 */

import { extractQuestionsFromVectorStore, getVectorStoreStatus } from './lq-api.js';
import { authManager } from './lq-auth.js';
import { FREE_RANGE_PREFILL_KEY } from './lq-free-range.js';

/**
 * Create a comprehensive question generation interface
 * @param {Function} onComplete - Callback when questions are generated
 * @returns {HTMLElement}
 */
export function createQuestionGenerator(onComplete) {
  const container = document.createElement('div');
  container.className = 'question-generator';

  // Initialize user statistics
  let userStats = getUserStats();
  let generationHistory = getGenerationHistory();

  // Create main sections
  container.appendChild(createHeader());
  container.appendChild(createStatusDashboard());
  container.appendChild(createGenerationForm());
  container.appendChild(createHistorySection());
  container.appendChild(createLoadingSection());
  container.appendChild(createResultsSection());

  // Initialize the interface
  initializeGenerator();

  return container;

  // === HEADER SECTION ===
  function createHeader() {
    const header = document.createElement('div');
    header.className = 'generator-header';
    header.innerHTML = `
      <div class="header-content">
        <div class="header-main">
          <h2 class="generator-title">
            <span class="generator-icon">🤖</span>
            AI Question Generator
          </h2>
          <p class="generator-subtitle">
            Generate custom law questions using OpenAI's advanced vector store technology
          </p>
        </div>
        <div class="header-stats">
          <div class="quick-stat">
            <span class="stat-number" id="totalGenerated">${userStats.totalGenerated}</span>
            <span class="stat-label">Total Generated</span>
          </div>
          <div class="quick-stat">
            <span class="stat-number" id="sessionCount">${generationHistory.length}</span>
            <span class="stat-label">Sessions</span>
          </div>
        </div>
      </div>
    `;
    return header;
  }

  // === STATUS DASHBOARD ===
  function createStatusDashboard() {
    const dashboard = document.createElement('div');
    dashboard.className = 'generator-dashboard';
    dashboard.id = 'statusDashboard';
    dashboard.innerHTML = `
      <div class="dashboard-card">
        <div class="card-header">
          <h3>📊 Database Status</h3>
        </div>
        <div class="card-content" id="databaseStatus">
          <div class="status-loading">
            <div class="loading-dots"></div>
            <p>Checking database status...</p>
          </div>
        </div>
      </div>
      <div class="dashboard-card">
        <div class="card-header">
          <h3>🔗 Vector Store Connection</h3>
        </div>
        <div class="card-content" id="vectorStoreStatus">
          <div class="status-loading">
            <div class="loading-dots"></div>
            <p>Verifying connection...</p>
          </div>
        </div>
      </div>
    `;
    return dashboard;
  }

  // === GENERATION FORM ===
  function createGenerationForm() {
    const formSection = document.createElement('div');
    formSection.className = 'generator-form-section';
    formSection.id = 'formSection';
    formSection.style.display = 'none';

    formSection.innerHTML = `
      <div class="form-container">
        <div class="form-header">
          <h3>⚙️ Generation Settings</h3>
          <p>Configure your question generation parameters</p>
        </div>
        
        <form id="generationForm" class="generation-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="numQuestions" class="form-label">
                <span class="label-text">Number of Questions</span>
                <span class="label-hint">How many questions to generate</span>
              </label>
              <div class="input-with-slider">
                <input type="range" id="questionsSlider" min="1" max="50" value="10" class="slider">
                <input type="number" id="numQuestions" min="1" max="50" value="10" class="number-input">
              </div>
              <div class="range-labels">
                <span>1</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>

            <div class="form-group">
              <label for="subjectFocus" class="form-label">
                <span class="label-text">Subject Focus</span>
                <span class="label-hint">Optional subject area targeting</span>
              </label>
              <select id="subjectFocus" class="form-select">
                <option value="">All Legal Subjects</option>
                <option value="contracts">Contracts</option>
                <option value="torts">Torts</option>
                <option value="criminal-law">Criminal Law</option>
                <option value="constitutional-law">Constitutional Law</option>
                <option value="evidence">Evidence</option>
                <option value="civil-procedure">Civil Procedure</option>
                <option value="property">Property Law</option>
                <option value="business-law">Business Law</option>
              </select>
            </div>

            <div class="form-group">
              <label for="difficultyLevel" class="form-label">
                <span class="label-text">Difficulty Level</span>
                <span class="label-hint">Target question complexity</span>
              </label>
              <select id="difficultyLevel" class="form-select">
                <option value="mixed">Mixed Difficulty</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div class="form-group">
              <label for="focusTopic" class="form-label">
                <span class="label-text">Focus Topic</span>
                <span class="label-hint">Pinpoint a specific doctrine or theme</span>
              </label>
              <input id="focusTopic" type="text" class="form-input" placeholder="e.g., hearsay exceptions, UCC remedies" />
            </div>
            <div class="form-group">
              <label for="questionSet" class="form-label">
                <span class="label-text">Question Set</span>
                <span class="label-hint">Choose the drill format</span>
              </label>
              <select id="questionSet" class="form-select">
                <option value="mixed">Mixed MBE + Essays</option>
                <option value="mbe">MBE Only</option>
                <option value="essay">Essay Focus</option>
              </select>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="customInstructions" class="form-label">
              <span class="label-text">Custom Instructions</span>
              <span class="label-hint">Additional guidance for question generation</span>
            </label>
            <textarea
              id="customInstructions"
              class="form-textarea"
              rows="4"
              placeholder="Example: Focus on constitutional rights cases, emphasize procedural aspects, include recent legal developments..."
            ></textarea>
            <div class="textarea-footer">
              <span class="char-count" id="charCount">0/500</span>
              <button type="button" class="btn-link" id="showExamples">Show Examples</button>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="previewBtn">
              <span class="btn-icon">👁️</span>
              Preview Settings
            </button>
            <button type="submit" class="btn btn-primary" id="generateBtn">
              <span class="btn-icon">🚀</span>
              Generate Questions
            </button>
          </div>
        </form>
      </div>
    `;

    return formSection;
  }

  // === HISTORY SECTION ===
  function createHistorySection() {
    const historySection = document.createElement('div');
    historySection.className = 'generator-history';
    historySection.id = 'historySection';
    
    historySection.innerHTML = `
      <div class="history-header">
        <h3>📋 Generation History</h3>
        <div class="history-controls">
          <button class="btn btn-outline" id="clearHistoryBtn">Clear History</button>
          <button class="btn btn-outline" id="exportHistoryBtn">Export History</button>
        </div>
      </div>
      <div class="history-content" id="historyContent">
        ${generationHistory.length > 0 ? renderHistory() : '<p class="no-history">No generation history yet. Start generating questions to see your history here.</p>'}
      </div>
    `;

    return historySection;
  }

  // === LOADING SECTION ===
  function createLoadingSection() {
    const loadingSection = document.createElement('div');
    loadingSection.className = 'generator-loading';
    loadingSection.id = 'loadingSection';
    loadingSection.style.display = 'none';
    
    loadingSection.innerHTML = `
      <div class="loading-container">
        <div class="loading-animation">
          <div class="loading-spinner"></div>
          <div class="loading-progress">
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
            </div>
            <span class="progress-text" id="progressText">Initializing generation...</span>
          </div>
        </div>
        <div class="loading-steps">
          <div class="step" id="step1">
            <span class="step-icon">🔍</span>
            <span class="step-text">Analyzing vector store content</span>
          </div>
          <div class="step" id="step2">
            <span class="step-icon">🤖</span>
            <span class="step-text">AI processing legal materials</span>
          </div>
          <div class="step" id="step3">
            <span class="step-icon">✍️</span>
            <span class="step-text">Generating questions</span>
          </div>
          <div class="step" id="step4">
            <span class="step-icon">💾</span>
            <span class="step-text">Saving to database</span>
          </div>
        </div>
        <button class="btn btn-secondary" id="cancelGeneration" style="margin-top: 2rem;">
          Cancel Generation
        </button>
      </div>
    `;

    return loadingSection;
  }

  // === RESULTS SECTION ===
  function createResultsSection() {
    const resultsSection = document.createElement('div');
    resultsSection.className = 'generator-results';
    resultsSection.id = 'resultsSection';
    resultsSection.style.display = 'none';
    return resultsSection;
  }

  // === INITIALIZATION ===
  async function initializeGenerator() {
    await checkVectorStoreStatus();
    await updateDatabaseStatus();
    setupFormInteractions();
    setupHistoryInteractions();
    applyFreeRangePrefill();
  }

  // === STATUS CHECKING ===
  async function checkVectorStoreStatus() {
    const statusEl = document.getElementById('vectorStoreStatus');
    
    try {
      const status = await getVectorStoreStatus();
      
      if (status.available) {
        statusEl.innerHTML = `
          <div class="status-success">
            <div class="status-icon">✅</div>
            <div class="status-info">
              <div class="status-title">Connected</div>
              <div class="status-details">${status.message}</div>
              ${status.vector_store_id ? `<div class="status-meta">Store ID: ${status.vector_store_id}</div>` : ''}
            </div>
          </div>
        `;
        document.getElementById('formSection').style.display = 'block';
      } else {
        statusEl.innerHTML = `
          <div class="status-error">
            <div class="status-icon">❌</div>
            <div class="status-info">
              <div class="status-title">Unavailable</div>
              <div class="status-details">${status.message}</div>
              <div class="status-meta">Check OpenAI API configuration</div>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error checking vector store status:', error);
      statusEl.innerHTML = `
        <div class="status-error">
          <div class="status-icon">⚠️</div>
          <div class="status-info">
            <div class="status-title">Connection Error</div>
            <div class="status-details">Unable to verify status</div>
            <button class="btn btn-sm btn-outline" onclick="location.reload()">Retry</button>
          </div>
        </div>
      `;
    }
  }

  async function updateDatabaseStatus() {
    const statusEl = document.getElementById('databaseStatus');
    
    // Simulate database status check (would be real API call in production)
    setTimeout(() => {
      const remainingQuestions = Math.floor(Math.random() * 5000) + 1000; // Simulated
      const generatedToday = Math.floor(Math.random() * 50);
      
      statusEl.innerHTML = `
        <div class="database-stats">
          <div class="db-stat">
            <div class="stat-icon">📚</div>
            <div class="stat-info">
              <div class="stat-number">${remainingQuestions.toLocaleString()}</div>
              <div class="stat-label">Remaining Questions</div>
            </div>
          </div>
          <div class="db-stat">
            <div class="stat-icon">🔥</div>
            <div class="stat-info">
              <div class="stat-number">${generatedToday}</div>
              <div class="stat-label">Generated Today</div>
            </div>
          </div>
          <div class="db-stat">
            <div class="stat-icon">📈</div>
            <div class="stat-info">
              <div class="stat-number">${userStats.totalGenerated}</div>
              <div class="stat-label">Your Total</div>
            </div>
          </div>
        </div>
      `;
    }, 1000);
  }

  // === FORM INTERACTIONS ===
  function setupFormInteractions() {
    const form = document.getElementById('generationForm');
    const slider = document.getElementById('questionsSlider');
    const numberInput = document.getElementById('numQuestions');
    const textarea = document.getElementById('customInstructions');
    const charCount = document.getElementById('charCount');

    // Sync slider and number input
    slider.addEventListener('input', () => {
      numberInput.value = slider.value;
    });

    numberInput.addEventListener('input', () => {
      slider.value = numberInput.value;
    });

    // Character count for textarea
    textarea.addEventListener('input', () => {
      const count = textarea.value.length;
      charCount.textContent = `${count}/500`;
      if (count > 500) {
        textarea.value = textarea.value.substring(0, 500);
        charCount.textContent = '500/500';
      }
    });

    // Show examples for custom instructions
    document.getElementById('showExamples').addEventListener('click', () => {
      showInstructionExamples();
    });

    // Preview settings
    document.getElementById('previewBtn').addEventListener('click', () => {
      showGenerationPreview();
    });

    // Handle form submission
    form.addEventListener('submit', handleGeneration);
  }

  function applyFreeRangePrefill() {
    const prefill = localStorage.getItem(FREE_RANGE_PREFILL_KEY);
    if (!prefill) return;

    try {
      const data = JSON.parse(prefill);
      const count = Math.min(Math.max(data.count || 10, 1), 50);

      document.getElementById('numQuestions').value = count;
      document.getElementById('questionsSlider').value = count;
      const focusTopic = data.topic || '';
      document.getElementById('focusTopic').value = focusTopic;
      document.getElementById('questionSet').value = data.questionSet || 'mixed';
      const instructionsField = document.getElementById('customInstructions');
      if (data.notes) {
        instructionsField.value = data.notes;
        document.getElementById('charCount').textContent = `${data.notes.length}/500`;
      } else if (focusTopic) {
        const autoNote = `Focus on: ${focusTopic}`;
        instructionsField.value = autoNote;
        document.getElementById('charCount').textContent = `${autoNote.length}/500`;
      }
    } catch (error) {
      console.warn('Unable to apply free-range prefill:', error);
    } finally {
      localStorage.removeItem(FREE_RANGE_PREFILL_KEY);
    }
  }

  // === HISTORY INTERACTIONS ===
  function setupHistoryInteractions() {
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your generation history?')) {
        localStorage.removeItem('questionGenerationHistory');
        generationHistory = [];
        updateHistoryDisplay();
      }
    });

    document.getElementById('exportHistoryBtn').addEventListener('click', () => {
      exportGenerationHistory();
    });
  }

  // === GENERATION HANDLING ===
  async function handleGeneration(e) {
    e.preventDefault();
    
    const formData = getFormData();
    
    if (!validateFormData(formData)) {
      return;
    }

    showLoadingState();
    
    try {
      const result = await performGeneration(formData);
      
      if (result.success) {
        addToHistory(formData, result);
        showSuccessResults(result, formData);
        updateUserStats(result);
      } else {
        throw new Error(result.message || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      showErrorResults(error.message);
    } finally {
      hideLoadingState();
    }
  }

  function getFormData() {
    return {
      numQuestions: parseInt(document.getElementById('numQuestions').value),
      subjectFocus: document.getElementById('subjectFocus').value,
      difficultyLevel: document.getElementById('difficultyLevel').value,
      focusTopic: document.getElementById('focusTopic').value.trim(),
      questionSet: document.getElementById('questionSet').value,
      customInstructions: document.getElementById('customInstructions').value.trim(),
      timestamp: new Date().toISOString(),
      userId: getCurrentUserId()
    };
  }

  function validateFormData(formData) {
    if (formData.numQuestions < 1 || formData.numQuestions > 50) {
      alert('Please enter a number between 1 and 50 questions.');
      return false;
    }
    return true;
  }

  async function performGeneration(formData) {
    // Simulate generation steps with progress updates
    updateProgress(0, 'Initializing generation...');
    await delay(1000);
    
    updateProgress(25, 'Analyzing vector store content...');
    setStepActive('step1');
    await delay(1500);
    
    updateProgress(50, 'AI processing legal materials...');
    setStepActive('step2');
    await delay(2000);
    
    updateProgress(75, 'Generating questions...');
    setStepActive('step3');
    
    // Make actual API call
    const result = await extractQuestionsFromVectorStore(formData.numQuestions, {
      subject_focus: formData.subjectFocus,
      difficulty_level: formData.difficultyLevel,
      focus_topic: formData.focusTopic,
      question_set: formData.questionSet,
      instructions: formData.customInstructions
    });
    
    updateProgress(90, 'Saving to database...');
    setStepActive('step4');
    await delay(1000);
    
    updateProgress(100, 'Complete!');
    
    return result;
  }

  // === UI STATE MANAGEMENT ===
  function showLoadingState() {
    document.getElementById('formSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';
    resetLoadingSteps();
  }

  function hideLoadingState() {
    document.getElementById('loadingSection').style.display = 'none';
  }

  function resetLoadingSteps() {
    document.querySelectorAll('.step').forEach(step => {
      step.classList.remove('active', 'completed');
    });
  }

  function setStepActive(stepId) {
    const step = document.getElementById(stepId);
    step.classList.add('active');
    
    // Mark previous steps as completed
    const stepNumber = parseInt(stepId.replace('step', ''));
    for (let i = 1; i < stepNumber; i++) {
      document.getElementById(`step${i}`).classList.add('completed');
    }
  }

  function updateProgress(percentage, text) {
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = text;
  }

  function showSuccessResults(result, formData) {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.className = 'generator-results success';
    resultsSection.innerHTML = `
      <div class="results-container">
        <div class="results-header">
          <h3>🎉 Questions Generated Successfully!</h3>
          <p>Your questions have been created and added to the database.</p>
        </div>
        
        <div class="results-stats">
          <div class="result-stat">
            <div class="stat-icon">📝</div>
            <div class="stat-info">
              <div class="stat-number">${result.results.questions_extracted}</div>
              <div class="stat-label">Questions Created</div>
            </div>
          </div>
          <div class="result-stat">
            <div class="stat-icon">💾</div>
            <div class="stat-info">
              <div class="stat-number">${result.results.questions_saved}</div>
              <div class="stat-label">Saved to Database</div>
            </div>
          </div>
          <div class="result-stat">
            <div class="stat-icon">⚡</div>
            <div class="stat-info">
              <div class="stat-number">${Math.round(result.results.questions_saved / formData.numQuestions * 100)}%</div>
              <div class="stat-label">Success Rate</div>
            </div>
          </div>
        </div>

        <div class="results-actions">
          <button class="btn btn-primary" id="startQuizBtn">
            <span class="btn-icon">🎯</span>
            Start Quiz with New Questions
          </button>
          <button class="btn btn-secondary" id="generateMoreBtn">
            <span class="btn-icon">🔄</span>
            Generate More
          </button>
          <button class="btn btn-outline" id="viewHistoryBtn">
            <span class="btn-icon">📋</span>
            View History
          </button>
        </div>
      </div>
    `;

    setupResultActions(result, formData);
    resultsSection.style.display = 'block';
  }

  function showErrorResults(message) {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.className = 'generator-results error';
    resultsSection.innerHTML = `
      <div class="results-container">
        <div class="results-header">
          <h3>❌ Generation Failed</h3>
          <p>${message}</p>
        </div>
        
        <div class="results-actions">
          <button class="btn btn-primary" id="retryBtn">
            <span class="btn-icon">🔄</span>
            Try Again
          </button>
          <button class="btn btn-outline" id="reportIssueBtn">
            <span class="btn-icon">🐛</span>
            Report Issue
          </button>
        </div>
      </div>
    `;

    document.getElementById('retryBtn').addEventListener('click', () => {
      document.getElementById('formSection').style.display = 'block';
      resultsSection.style.display = 'none';
    });

    resultsSection.style.display = 'block';
  }

  function setupResultActions(result, formData) {
    document.getElementById('startQuizBtn').addEventListener('click', () => {
      if (onComplete) {
        onComplete({
          n: Math.min(result.results.questions_saved, 20),
          subject: formData.subjectFocus || '',
          questionType: 'generated',
          timer: 1.8
        });
      }
    });

    document.getElementById('generateMoreBtn').addEventListener('click', () => {
      document.getElementById('formSection').style.display = 'block';
      document.getElementById('resultsSection').style.display = 'none';
    });

    document.getElementById('viewHistoryBtn').addEventListener('click', () => {
      document.getElementById('historySection').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // === UTILITY FUNCTIONS ===
  function getCurrentUserId() {
    if (authManager.isAuthenticated()) {
      const user = authManager.getCurrentUser();
      return user ? `user_${user.id}` : getAnonymousUserId();
    }
    return getAnonymousUserId();
  }

  function getAnonymousUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'anonymous_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  function getUserStats() {
    const stats = localStorage.getItem('questionGeneratorStats');
    return stats ? JSON.parse(stats) : {
      totalGenerated: 0,
      totalSessions: 0,
      lastGeneration: null,
      successfulGenerations: 0
    };
  }

  function updateUserStats(result) {
    userStats.totalGenerated += result.results.questions_saved;
    userStats.totalSessions += 1;
    userStats.lastGeneration = new Date().toISOString();
    userStats.successfulGenerations += 1;
    
    localStorage.setItem('questionGeneratorStats', JSON.stringify(userStats));
    
    // Update header stats
    document.getElementById('totalGenerated').textContent = userStats.totalGenerated;
    document.getElementById('sessionCount').textContent = generationHistory.length;
  }

  function getGenerationHistory() {
    const history = localStorage.getItem('questionGenerationHistory');
    return history ? JSON.parse(history) : [];
  }

  function addToHistory(formData, result) {
    const historyEntry = {
      id: Date.now(),
      timestamp: formData.timestamp,
      settings: formData,
      results: result.results,
      success: result.success
    };
    
    generationHistory.unshift(historyEntry);
    
    // Keep only last 20 entries
    if (generationHistory.length > 20) {
      generationHistory = generationHistory.slice(0, 20);
    }
    
    localStorage.setItem('questionGenerationHistory', JSON.stringify(generationHistory));
    updateHistoryDisplay();
  }

  function updateHistoryDisplay() {
    const historyContent = document.getElementById('historyContent');
    historyContent.innerHTML = generationHistory.length > 0 ? renderHistory() : '<p class="no-history">No generation history yet.</p>';
  }

  function renderHistory() {
    return generationHistory.map(entry => `
      <div class="history-entry ${entry.success ? 'success' : 'failed'}">
        <div class="entry-header">
          <div class="entry-time">${new Date(entry.timestamp).toLocaleString()}</div>
          <div class="entry-status ${entry.success ? 'success' : 'failed'}">
            ${entry.success ? '✅ Success' : '❌ Failed'}
          </div>
        </div>
        <div class="entry-details">
          <span class="detail">${entry.settings.numQuestions} questions</span>
          ${entry.settings.subjectFocus ? `<span class="detail">${entry.settings.subjectFocus}</span>` : ''}
          ${entry.settings.difficultyLevel !== 'mixed' ? `<span class="detail">${entry.settings.difficultyLevel}</span>` : ''}
          ${entry.settings.focusTopic ? `<span class="detail">${entry.settings.focusTopic}</span>` : ''}
          ${entry.settings.questionSet ? `<span class="detail">${entry.settings.questionSet}</span>` : ''}
          ${entry.success ? `<span class="detail success">${entry.results.questions_saved} saved</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  function exportGenerationHistory() {
    const dataStr = JSON.stringify(generationHistory, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `question-generation-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function showInstructionExamples() {
    const examples = [
      "Focus on constitutional law with emphasis on civil rights and due process",
      "Generate questions about contract formation and breach of contract remedies",
      "Include recent Supreme Court cases and their precedential value",
      "Emphasize practical applications over theoretical concepts",
      "Create scenario-based questions that test analytical skills"
    ];
    
    alert('Example Instructions:\n\n' + examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n\n'));
  }

  function showGenerationPreview() {
    const formData = getFormData();
    const preview = `
Generation Preview:
• Questions: ${formData.numQuestions}
• Subject: ${formData.subjectFocus || 'All subjects'}
• Difficulty: ${formData.difficultyLevel}
• Focus Topic: ${formData.focusTopic || 'None'}
• Question Set: ${formData.questionSet || 'Mixed'}
• Instructions: ${formData.customInstructions || 'None'}
    `.trim();
    
    alert(preview);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
