/**
 * Module: lq-api.js
 * Handles all (backend) API requests.
 */

const API_BASE = 'http://localhost:5001/api'; // Change to deployed API URL as needed

export async function fetchSubjects() {
  const resp = await fetch(`${API_BASE}/subjects`);
  const data = await resp.json();
  return data.subjects;
}

/**
 * Fetch N random questions (optionally per subject)
 * @param {number} n - Number of questions to fetch
 * @param {string} subject - Subject filter (empty for all)
 * @returns {Promise<Array>} Array of questions
 */
export async function fetchQuestions(n, subject = '', _timer = null) {
  const url = new URL(`${API_BASE}/questions`);
  url.searchParams.set('n', n);
  if (subject) url.searchParams.set('subject', subject);
  const resp = await fetch(url);
  const data = await resp.json();
  return data;
}

/**
 * Log quiz results to backend
 */
export async function logQuizAttempt(payload) {
  await fetch(`${API_BASE}/log`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
}

/**
 * Fetch AI-generated explanations for a list of question IDs
 * @param {Array<string>} questionIds - Array of question IDs
 * @returns {Promise<Object>} Object mapping question IDs to explanations
 */
export async function fetchAIExplanations(questionIds) {
  try {
    const resp = await fetch(`${API_BASE}/explanations`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ question_ids: questionIds })
    });
    
    if (!resp.ok) {
      console.error('Failed to fetch AI explanations:', await resp.text());
      return {};
    }
    
    const data = await resp.json();
    return data.explanations || {};
  } catch (error) {
    console.error('Error fetching AI explanations:', error);
    return {};
  }
}

/**
 * Log quiz history with detailed stats
 * @param {Object} quizData - Quiz data to log
 * @returns {Promise<Object>} Response with success status
 */
export async function saveQuizHistory(quizData) {
  try {
    const resp = await fetch(`${API_BASE}/quiz-history`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(quizData)
    });
    return await resp.json();
  } catch (error) {
    console.error('Error saving quiz history:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get quiz history with optional filters
 * @param {string} userId - User ID to filter by
 * @param {string} subject - Optional subject filter
 * @returns {Promise<Object>} Quiz history and statistics
 */
export async function getQuizHistory(userId = 'anonymous', subject = '') {
  try {
    const url = new URL(`${API_BASE}/quiz-history`);
    url.searchParams.set('user_id', userId);
    if (subject) url.searchParams.set('subject', subject);
    
    const resp = await fetch(url);
    return await resp.json();
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    return { history: [], stats: {} };
  }
}

/**
 * Extract questions from OpenAI vector store
 * @param {number} numQuestions - Number of questions to generate (1-50)
 * @returns {Promise<Object>} Generation results
 */
export async function extractQuestionsFromVectorStore(numQuestions) {
  try {
    const resp = await fetch(`${API_BASE}/extract-questions`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ num_questions: numQuestions })
    });
    
    if (!resp.ok) {
      const errorData = await resp.json();
      throw new Error(errorData.error || 'Failed to extract questions');
    }
    
    return await resp.json();
  } catch (error) {
    console.error('Error extracting questions:', error);
    throw error;
  }
}

/**
 * Get vector store status
 * @returns {Promise<Object>} Vector store status
 */
export async function getVectorStoreStatus() {
  try {
    const resp = await fetch(`${API_BASE}/vector-store/status`);
    return await resp.json();
  } catch (error) {
    console.error('Error checking vector store status:', error);
    return { available: false, message: 'Connection error' };
  }
}

/**
 * Fetch questions with type filter
 * @param {number} n - Number of questions to fetch
 * @param {string} subject - Subject filter (empty for all)
 * @param {string} questionType - Question type filter ('generated', 'mbe', 'mix')
 * @returns {Promise<Array>} Array of questions
 */
export async function fetchQuestionsByType(n, subject = '', questionType = 'mix') {
  const url = new URL(`${API_BASE}/questions`);
  url.searchParams.set('n', n);
  if (subject) url.searchParams.set('subject', subject);
  if (questionType && questionType !== 'mix') {
    url.searchParams.set('type', questionType);
  }
  
  const resp = await fetch(url);
  const data = await resp.json();
  return data;
}
