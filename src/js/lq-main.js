import { fetchQuestionsByType, logQuizAttempt } from './lq-api.js';
import { createQuestionGenerator } from './lq-question-generator.js';
import { createQuiz } from './lq-quiz.js';
import { createReview } from './lq-review.js';
import { createStartMenu } from './lq-start-menu.js';
import { createStatisticsPage } from './lq-statistics.js';

const app = document.getElementById('app');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');

// Navigation and modal elements
const homeBtn = document.getElementById('homeBtn');
const generatorBtn = document.getElementById('generatorBtn');
const statisticsBtn = document.getElementById('statisticsBtn');
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const retryBtn = document.getElementById('retryBtn');

// State management
let currentPage = 'home';
let quizHistory = JSON.parse(localStorage.getItem('lawQuizHistory') || '[]');

// Generate and store a user ID if one doesn't exist yet
if (!localStorage.getItem('userId')) {
  const userId = 'user_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('userId', userId);
}

async function startQuiz(opts) {
  showLoading('Loading questions...');
  
  try {
    const res = await fetchQuestionsByType(opts.n, opts.subject, opts.questionType);
    const questions = res.questions;
    
    if (!questions || !questions.length) {
      showError('No questions available. Try a different subject, question type, or number.');
      return;
    }
    
    hideLoading();
    hideError();
    app.innerHTML = '';
    
    const quizElement = createQuiz(questions, opts, async (qs, answers, meta) => {
      try {
        // Save to history
        const result = {
          datetime: new Date().toISOString(),
          opts,
          answers,
          meta,
          questions: qs
        };
        quizHistory.unshift(result);
        quizHistory = quizHistory.slice(0, 50); // Keep last 50 attempts
        localStorage.setItem('lawQuizHistory', JSON.stringify(quizHistory));
        
        // Log to backend
        await logQuizAttempt(result);
        
        // Show review
        app.innerHTML = '';
        const review = createReview(qs, answers, meta);
        app.appendChild(review);
      } catch (error) {
        console.error('Error logging quiz attempt:', error);
        // Still show review even if logging fails
        app.innerHTML = '';
        const review = createReview(qs, answers, meta);
        app.appendChild(review);
      }
    });
    
    app.appendChild(quizElement);
  } catch (error) {
    console.error('Error starting quiz:', error);
    showError('Failed to load questions. Please check your connection and try again.');
  }
}

function showLoading(message = 'Loading...') {
  loadingEl.querySelector('p').textContent = message;
  loadingEl.style.display = 'block';
  app.style.display = 'none';
  errorEl.style.display = 'none';
}

function hideLoading() {
  loadingEl.style.display = 'none';
  app.style.display = 'block';
}

function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  errorEl.style.display = 'block';
  app.style.display = 'none';
  loadingEl.style.display = 'none';
}

function hideError() {
  errorEl.style.display = 'none';
  app.style.display = 'block';
}

function navigateToHome() {
  currentPage = 'home';
  updateNavigation();
  hideLoading();
  hideError();
  init();
}

async function showQuestionGenerator() {
  currentPage = 'generator';
  updateNavigation();
  hideLoading();
  hideError();
  
  app.innerHTML = '';
  const generatorPage = createQuestionGenerator(startQuiz);
  app.appendChild(generatorPage);
}

async function showStatistics() {
  currentPage = 'statistics';
  updateNavigation();
  hideLoading();
  hideError();
  
  app.innerHTML = '';
  showLoading('Loading statistics...');
  
  try {
    const statsPage = await createStatisticsPage();
    hideLoading();
    app.appendChild(statsPage);
  } catch (error) {
    console.error('Error loading statistics:', error);
    hideLoading();
    showError('Failed to load statistics. Please try again.');
  }
}

function updateNavigation() {
  homeBtn.classList.toggle('active', currentPage === 'home');
  generatorBtn.classList.toggle('active', currentPage === 'generator');
  statisticsBtn.classList.toggle('active', currentPage === 'statistics');
  aboutBtn.classList.remove('active');
}

// Event listeners
homeBtn.addEventListener('click', navigateToHome);
generatorBtn.addEventListener('click', showQuestionGenerator);
statisticsBtn.addEventListener('click', showStatistics);
aboutBtn.addEventListener('click', () => {
  aboutModal.style.display = 'flex';
});

retryBtn.addEventListener('click', navigateToHome);

// Modal close functionality
document.querySelectorAll('.modal-close').forEach(closeBtn => {
  closeBtn.addEventListener('click', (e) => {
    e.target.closest('.modal').style.display = 'none';
  });
});

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

export function init() {
  hideLoading();
  hideError();
  app.innerHTML = '';
  const menu = createStartMenu(startQuiz);
  app.appendChild(menu);
}

// Initialize the application
init();
