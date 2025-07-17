import { createQuiz } from '../src/js/lq-quiz.js';

test('creates quiz container', () => {
  const quiz = createQuiz(1);
  expect(quiz.className).toBe('quiz');
});
