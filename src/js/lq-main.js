import { createStartMenu } from './lq-start-menu.js';
import { createQuiz } from './lq-quiz.js';
import { QuestionManager } from './lq-question-manager.js';
import { ProgressTracker } from './lq-progress.js';
import { questionData } from './question-data.js';
import { createReview } from './lq-review.js';

const app = document.getElementById('app');

function startQuiz(numQuestions) {
  app.innerHTML = '';
  const manager = new QuestionManager(questionData);
  const tracker = new ProgressTracker();
  const quizElement = createQuiz(numQuestions, manager, tracker, (qs, ans) => {
    app.innerHTML = '';
    const review = createReview(qs, ans, tracker);
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
