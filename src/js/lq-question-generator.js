/**
 * Module: lq-question-generator.js
 * Handles question generation from the vector store
 */

import { extractQuestionsFromVectorStore, getVectorStoreStatus } from './lq-api.js';

/**
 * Create a question generation interface
 * @param {Function} onComplete - Callback when questions are generated
 * @returns {HTMLElement}
 */
export function createQuestionGenerator(onComplete) {
  const container = document.createElement('div');
  container.className = 'question-generator';

  // Header
  const header = document.createElement('div');
  header.className = 'generator-header';
  header.innerHTML = `
    <h2>🤖 AI Question Generator</h2>
    <p>Generate new law questions using OpenAI's vector store technology</p>
  `;
  container.appendChild(header);

  // Status section
  const statusSection = document.createElement('div');
  statusSection.className = 'generator-status';
  statusSection.innerHTML = '<p>⏳ Checking vector store status...</p>';
  container.appendChild(statusSection);

  // Generation form
  const formSection = document.createElement('div');
  formSection.className = 'generator-form';
  formSection.style.display = 'none';

  const form = document.createElement('form');
  form.innerHTML = `
    <div class="form-group">
      <label for="numQuestions">Number of Questions to Generate:</label>
      <input type="number" id="numQuestions" min="1" max="50" value="10" required>
      <small>Between 1 and 50 questions</small>
    </div>
    
    <div class="form-group">
      <button type="submit" class="btn btn-primary">
        <span class="btn-icon">🚀</span>
        Generate Questions
      </button>
    </div>
  `;

  formSection.appendChild(form);
  container.appendChild(formSection);

  // Results section
  const resultsSection = document.createElement('div');
  resultsSection.className = 'generator-results';
  resultsSection.style.display = 'none';
  container.appendChild(resultsSection);

  // Loading state
  const loadingSection = document.createElement('div');
  loadingSection.className = 'generator-loading';
  loadingSection.style.display = 'none';
  loadingSection.innerHTML = `
    <div class="loading-spinner"></div>
    <p>Generating questions... This may take a few moments.</p>
    <small>The AI is analyzing legal documents and creating new questions.</small>
  `;
  container.appendChild(loadingSection);

  // Check vector store status
  async function checkStatus() {
    try {
      const status = await getVectorStoreStatus();
      
      if (status.available) {
        statusSection.innerHTML = `
          <div class="status-success">
            <span class="status-icon">✅</span>
            <div>
              <strong>Vector Store Ready</strong>
              <p>${status.message}</p>
              ${status.vector_store_id ? `<small>Store ID: ${status.vector_store_id}</small>` : ''}
            </div>
          </div>
        `;
        formSection.style.display = 'block';
      } else {
        statusSection.innerHTML = `
          <div class="status-error">
            <span class="status-icon">❌</span>
            <div>
              <strong>Vector Store Unavailable</strong>
              <p>${status.message}</p>
              <small>Please ensure the OpenAI API key is configured correctly.</small>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error checking vector store status:', error);
      statusSection.innerHTML = `
        <div class="status-error">
          <span class="status-icon">⚠️</span>
          <div>
            <strong>Connection Error</strong>
            <p>Unable to check vector store status. Please try again.</p>
          </div>
        </div>
      `;
    }
  }

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const numQuestions = parseInt(document.getElementById('numQuestions').value);
    
    if (numQuestions < 1 || numQuestions > 50) {
      showResults('error', 'Please enter a number between 1 and 50.');
      return;
    }

    // Show loading state
    formSection.style.display = 'none';
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';

    try {
      const result = await extractQuestionsFromVectorStore(numQuestions);
      
      if (result.success) {
        showResults('success', `
          <h3>✅ Questions Generated Successfully!</h3>
          <div class="result-stats">
            <div class="stat">
              <span class="stat-number">${result.results.questions_extracted}</span>
              <span class="stat-label">Questions Extracted</span>
            </div>
            <div class="stat">
              <span class="stat-number">${result.results.questions_saved}</span>
              <span class="stat-label">Questions Saved</span>
            </div>
          </div>
          <p>${result.message}</p>
          <div class="result-actions">
            <button id="generateMore" class="btn btn-secondary">Generate More</button>
            <button id="startQuiz" class="btn btn-primary">Start Quiz with Generated Questions</button>
          </div>
        `);

        // Add event listeners for action buttons
        document.getElementById('generateMore').addEventListener('click', () => {
          formSection.style.display = 'block';
          resultsSection.style.display = 'none';
        });

        document.getElementById('startQuiz').addEventListener('click', () => {
          if (onComplete) {
            onComplete({
              n: Math.min(result.results.questions_saved, 10),
              subject: '',
              questionType: 'generated',
              timer: 1.8
            });
          }
        });
      } else {
        throw new Error(result.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      showResults('error', `
        <h3>❌ Generation Failed</h3>
        <p>${error.message}</p>
        <button id="tryAgain" class="btn btn-primary">Try Again</button>
      `);

      document.getElementById('tryAgain').addEventListener('click', () => {
        formSection.style.display = 'block';
        resultsSection.style.display = 'none';
      });
    } finally {
      loadingSection.style.display = 'none';
    }
  });

  function showResults(type, content) {
    resultsSection.className = `generator-results ${type}`;
    resultsSection.innerHTML = content;
    resultsSection.style.display = 'block';
  }

  // Initialize
  checkStatus();

  return container;
}
