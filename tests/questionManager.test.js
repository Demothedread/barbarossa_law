import { QuestionManager } from '../src/js/lq-question-manager.js';

const sample = [{id:'1'},{id:'2'},{id:'3'},{id:'4'}];

test('reuses early questions after 75%', () => {
  const seq = [0.1, 0.2, 0.3, 0.9];
  let idx = 0;
  const qm = new QuestionManager(sample, () => seq[idx++]);
  qm.next();
  qm.next();
  qm.next(); // used 75%
  const q = qm.next();
  expect(q).toBe(sample[0]);
});
