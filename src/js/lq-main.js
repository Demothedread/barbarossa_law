import { createStartMenu } from './lq-start-menu.js';
import { createQuiz } from './lq-quiz.js';
import { createReview } from './lq-review.js';
import { fetchQuestions, logQuizAttempt } from './lq-api.js';

const app = document.getElementById('app');

async function startQuiz(opts) {
  app.innerHTML = 'Loading questions...';
  // Fetch N Qs with subject/timer
  const res = await fetchQuestions(opts.n, opts.subject);
  const questions = res.questions;
  if (!questions || !questions.length) {
    app.innerHTML = '<div>No questions available. Try a different subject or number.</div>';
    return;
  }
  app.innerHTML = '';
  const quizElement = createQuiz(questions, opts, async (qs, answers, meta) => {
    // POST quiz log
    await logQuizAttempt({datetime: new Date().toISOString(), opts, answers, meta});
    app.innerHTML = '';
    const review = createReview(qs, answers, meta);
    app.appendChild(review);
  });
  app.appendChild(quizElement);
}

export function init() {
  app.innerHTML = '';
  const menu = createStartMenu(startQuiz);
  app.appendChild(menu);
}

init();
