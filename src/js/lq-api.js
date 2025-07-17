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
export async function fetchQuestions(n, subject = '', timer = null) {
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
