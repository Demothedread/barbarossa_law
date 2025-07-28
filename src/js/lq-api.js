/**
 * Module: lq-api.js
 * Handles all (backend) API requests.
 */

import { authManager } from './lq-auth.js';

const API_BASE = 'http://localhost:5001/api'; // Change to deployed API URL as needed

// Helper function to get headers with authentication
function getHeaders(additionalHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  // Add auth headers if user is authenticated
  if (authManager && authManager.isAuthenticated()) {
    Object.assign(headers, authManager.getAuthHeaders());
  }
  
  return headers;
}

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
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
}

/**
 * Fetch AI-generated explanations for a list of question IDs
 * @param {Array<string>} questionIds - Array of question IDs
 * @returns {Promise<Object>} Object mapping question IDs to detailed explanations
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
    // Return the explanations in the format:
    // {
    //   "question_id": {
    //     "correct_answer": "A",
    //     "choice_a_explanation": "...",
    //     "choice_b_explanation": "...",
    //     "choice_c_explanation": "...",
    //     "choice_d_explanation": "...",
    //     "subtopic": "..."
    //   }
    // }
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
 * Fetch available subtopics
 * @param {string} subject - Optional subject filter
 * @returns {Promise<string[]>} - Array of subtopic names
 */
export async function fetchSubtopics(subject = '') {
  try {
    const url = new URL(`${API_BASE}/subtopics`);
    if (subject) {
      url.searchParams.append('subject', subject);
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch subtopics: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching subtopics:', error);
    throw error;
  }
}

/**
 * Fetch questions by type, subject, and subtopic
 * @param {number} n - Number of questions to fetch
 * @param {string} subject - Optional subject filter
 * @param {string} questionType - Question type (mbe, generated, mix)
 * @param {string} subtopic - Optional subtopic filter
 * @returns {Promise<Object>} - Questions data
 */
export async function fetchQuestionsByType(n = 10, subject = '', questionType = 'mbe', subtopic = '') {
  try {
    const url = new URL(`${API_BASE}/questions`);
    url.searchParams.append('n', n);
    url.searchParams.append('type', questionType);
    
    if (subject) {
      url.searchParams.append('subject', subject);
    }
    
    if (subtopic) {
      url.searchParams.append('subtopic', subtopic);
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
}

/**
 * Fetch subtopic performance statistics
 * @param {string} userId - User ID (defaults to 'anonymous')
 * @param {string} subject - Optional subject filter
 * @returns {Promise<Object>} Subtopic statistics data
 */
export async function fetchSubtopicStats(userId = 'anonymous', subject = '') {
  try {
    const url = new URL(`${API_BASE}/subtopic-stats`);
    url.searchParams.set('user_id', userId);
    if (subject) url.searchParams.set('subject', subject);
    const resp = await fetch(url);
    if (!resp.ok) {
      let errMsg = `Failed to fetch subtopic stats: ${resp.status}`;
      let errJson = {};
      try { errJson = await resp.json(); } catch {}
      if (errJson && errJson.error) errMsg += ` - ${errJson.error}`;
      throw new Error(errMsg);
    }
    const data = await resp.json();
    // Defensive: always return expected structure
    if (!data || (!Array.isArray(data.subtopic_stats) && !Array.isArray(data.subtopics))) {
      return { subtopic_stats: [], subtopics: [], error: 'Malformed subtopic stats response' };
    }
    // Normalize for downstream code
    if (!Array.isArray(data.subtopic_stats) && Array.isArray(data.subtopics)) {
      data.subtopic_stats = data.subtopics.map(sub => ({ subtopic: sub }));
    }
    if (!Array.isArray(data.subtopics) && Array.isArray(data.subtopic_stats)) {
      data.subtopics = data.subtopic_stats.map(item => item.subtopic);
    }
    return data;
  } catch (err) {
    console.error('fetchSubtopicStats error:', err);
    return { subtopic_stats: [], subtopics: [], error: err.message };
  }
}

/**
 * Fetch advanced analytics including learning trends and predictions
 * @param {string} userId - User ID (defaults to 'anonymous')
 * @param {number} days - Number of days to analyze (defaults to 30)
 * @returns {Promise<Object>} Advanced analytics data
 */
export async function fetchAdvancedAnalytics(userId = 'anonymous', days = 30) {
  try {
    const url = new URL(`${API_BASE}/analytics/advanced`);
    url.searchParams.set('user_id', userId);
    url.searchParams.set('days', days);
    
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    
    return await resp.json();
  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    throw error;
  }
}

/**
 * Export comprehensive statistics
 * @param {string} userId - User ID (defaults to 'anonymous')
 * @param {string} format - Export format ('json' or 'csv', defaults to 'json')
 * @returns {Promise<Object|Blob>} Export data or CSV blob
 */
export async function exportStatistics(userId = 'anonymous', format = 'json') {
  try {
    const url = new URL(`${API_BASE}/statistics/export`);
    url.searchParams.set('user_id', userId);
    url.searchParams.set('format', format);
    
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    
    if (format === 'csv') {
      return await resp.blob();
    }
    return await resp.json();
  } catch (error) {
    console.error('Error exporting statistics:', error);
    throw error;
  }
}

/**
 * Enhanced quiz history save with comprehensive tracking
 * @param {Object} quizData - Enhanced quiz data with timing and analytics
 * @returns {Promise<Object>} Response with success status
 */
export async function saveEnhancedQuizHistory(quizData) {
  try {
    const enhancedData = {
      user_id: quizData.user_id || localStorage.getItem('userId') || 'anonymous',
      subject: quizData.subject || '',
      subtopic: quizData.subtopic || '',
      correct: quizData.correct || 0,
      total: quizData.total || 0,
      duration_seconds: quizData.duration_seconds || 0,
      questions: quizData.questions || [],
      answers: quizData.answers || [],
      time_per_question: quizData.time_per_question || [],
      question_difficulties: quizData.question_difficulties || [],
      mode: quizData.mode || 'classic',
      negative_time: quizData.negative_time || false
    };
    
    const resp = await fetch(`${API_BASE}/quiz-history`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(enhancedData)
    });
    
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    
    return await resp.json();
  } catch (error) {
    console.error('Error saving enhanced quiz history:', error);
    throw error;
  }
}

/**
 * Get comprehensive quiz history with advanced analytics
 * @param {string} userId - User ID to filter by
 * @param {string} subject - Optional subject filter
 * @param {string} mode - Optional mode filter
 * @param {number} limit - Number of results to return
 * @returns {Promise<Object>} Comprehensive quiz history and analytics
 */
export async function getComprehensiveQuizHistory(userId = 'anonymous', subject = '', mode = '', limit = 50) {
  try {
    const url = new URL(`${API_BASE}/quiz-history`);
    url.searchParams.set('user_id', userId);
    if (subject) url.searchParams.set('subject', subject);
    if (mode) url.searchParams.set('mode', mode);
    url.searchParams.set('limit', limit);
    
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    
    return await resp.json();
  } catch (error) {
    console.error('Error fetching comprehensive quiz history:', error);
    return { history: [], stats: {}, analytics: {} };
  }
}

/**
 * Store AI explanations in the database
 * @param {Object} explanationsData - Object mapping question IDs to explanation details
 * @returns {Promise<Object>} Response with success status
 */
export async function storeAIExplanations(explanationsData) {
  try {
    const resp = await fetch(`${API_BASE}/explanations/store`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ explanations: explanationsData })
    });
    
    if (!resp.ok) {
      throw new Error(`Failed to store explanations: ${resp.statusText}`);
    }
    
    return await resp.json();
  } catch (error) {
    console.error('Error storing AI explanations:', error);
    throw error;
  }
}

/**
 * Check if explanations exist for given question IDs
 * @param {Array<string>} questionIds - Array of question IDs to check
 * @returns {Promise<Object>} Object indicating which questions have explanations
 */
export async function checkExistingExplanations(questionIds) {
  try {
    const resp = await fetch(`${API_BASE}/explanations/check`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ question_ids: questionIds })
    });
    
    if (!resp.ok) {
      throw new Error(`Failed to check explanations: ${resp.statusText}`);
    }
    
    return await resp.json();
  } catch (error) {
    console.error('Error checking existing explanations:', error);
    return {};
  }
}
