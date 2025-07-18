import { fetchQuestions, logQuizAttempt } from './lq-api.js';
import { createQuiz } from './lq-quiz.js';
import { createReview } from './lq-review.js';
import { createStartMenu } from './lq-start-menu.js';

const app = document.getElementById('app');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');

// Navigation and modal elements
const homeBtn = document.getElementById('homeBtn');
const statisticsBtn = document.getElementById('statisticsBtn');
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const statisticsModal = document.getElementById('statisticsModal');
const retryBtn = document.getElementById('retryBtn');

// State management
let currentPage = 'home';
let quizHistory = JSON.parse(localStorage.getItem('lawQuizHistory') || '[]');

async function startQuiz(opts) {
  showLoading('Loading questions...');
  
  try {
    const res = await fetchQuestions(opts.n, opts.subject);
    const questions = res.questions;
    
    if (!questions || !questions.length) {
      showError('No questions available. Try a different subject or number.');
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

function showStatistics() {
  const statsContent = document.getElementById('statsContent');
  
  if (quizHistory.length === 0) {
    statsContent.innerHTML = '<p>Complete a quiz to see your statistics!</p>';
  } else {
    const totalQuizzes = quizHistory.length;
    const totalQuestions = quizHistory.reduce((sum, quiz) => sum + quiz.meta.total, 0);
    const totalCorrect = quizHistory.reduce((sum, quiz) => sum + quiz.meta.correct, 0);
    const avgScore = ((totalCorrect / totalQuestions) * 100).toFixed(1);
    
    // Subject breakdown
    const subjectStats = {};
    quizHistory.forEach(quiz => {
      const subject = quiz.opts.subject || 'All Subjects';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, correct: 0, quizzes: 0 };
      }
      subjectStats[subject].total += quiz.meta.total;
      subjectStats[subject].correct += quiz.meta.correct;
      subjectStats[subject].quizzes += 1;
    });
    
    let html = `
      <div class="stats-overview">
        <h4>Overall Performance</h4>
        <p><strong>Total Quizzes:</strong> ${totalQuizzes}</p>
        <p><strong>Total Questions:</strong> ${totalQuestions}</p>
        <p><strong>Overall Average:</strong> ${avgScore}%</p>
      </div>
      <div class="stats-subjects">
        <h4>Performance by Subject</h4>
    `;
    
    Object.entries(subjectStats).forEach(([subject, stats]) => {
      const subjectAvg = ((stats.correct / stats.total) * 100).toFixed(1);
      html += `
        <div class="subject-stat">
          <strong>${subject}:</strong> ${subjectAvg}% 
          (${stats.correct}/${stats.total} questions, ${stats.quizzes} quizzes)
        </div>
      `;
    });
    
    html += '</div>';
    statsContent.innerHTML = html;
  }
  
  statisticsModal.style.display = 'flex';
}

function updateNavigation() {
  homeBtn.classList.toggle('active', currentPage === 'home');
  statisticsBtn.classList.remove('active');
  aboutBtn.classList.remove('active');
}

// Event listeners
homeBtn.addEventListener('click', navigateToHome);
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
