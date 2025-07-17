import { createQuiz } from '../src/js/lq-quiz.js';
import { QuestionManager } from '../src/js/lq-question-manager.js';
import { ProgressTracker } from '../src/js/lq-progress.js';
import { questionData } from '../src/js/question-data.js';

test('creates quiz container', () => {
  const qm = new QuestionManager(questionData, () => 0.1);
  const tracker = new ProgressTracker();
  const quiz = createQuiz(1, qm, tracker, () => {});
  expect(quiz.className).toBe('quiz');
});
