import { createStartMenu } from './lq-start-menu.js';
import { createQuiz } from './lq-quiz.js';

const app = document.getElementById('app');

function startQuiz(numQuestions) {
  app.innerHTML = '';
  const quizElement = createQuiz(numQuestions);
  app.appendChild(quizElement);
}

export function init() {
  app.innerHTML = '';
  const menu = createStartMenu(startQuiz);
  app.appendChild(menu);
}

init();
