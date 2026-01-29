import { jest } from '@jest/globals';

const fetchAIExplanations = jest.fn();
const saveQuizHistory = jest.fn();

jest.unstable_mockModule('../src/js/lq-api.js', () => ({
  fetchAIExplanations,
  saveQuizHistory
}));

const { createReview } = await import('../src/js/lq-review.js');

const baseQuestion = {
  idx: 'q1',
  subject: 'Contracts',
  prompt: '',
  question: 'What is consideration?',
  choices: ['A', 'B', 'C', 'D'],
  answer: 'A',
  gold_passage: ''
};

describe('createReview', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    fetchAIExplanations.mockReset();
    saveQuizHistory.mockReset().mockResolvedValue({});
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => []
    });
    global.Audio = class {
      constructor() {
        this.currentTime = 0;
        this.volume = 1;
      }
      load() {}
      play() {
        return Promise.resolve();
      }
      pause() {}
      addEventListener() {}
    };
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders review with preloaded AI explanations', async () => {
    const meta = {
      correct: 1,
      total: 1,
      duration_s: 45,
      timer: 1,
      aiExplanations: {
        q1: {
          explanations: { A: 'Because it is a bargained-for exchange.' },
          subtopic: 'Offer and Acceptance'
        }
      }
    };

    const review = createReview([baseQuestion], [0], meta);
    document.body.appendChild(review);

    await jest.runAllTimersAsync();

    expect(review.querySelector('.review-header')).not.toBeNull();
    expect(review.querySelector('.ai-explanation-text').textContent)
      .toContain('bargained-for exchange');
  });

  test('handles AI explanation fetch failures gracefully', async () => {
    fetchAIExplanations.mockRejectedValue(new Error('API down'));

    const meta = {
      correct: 0,
      total: 1,
      duration_s: 30,
      timer: 1
    };

    const review = createReview([baseQuestion], [1], meta);
    document.body.appendChild(review);

    await jest.runAllTimersAsync();

    expect(review.querySelector('.question-review')).not.toBeNull();
    expect(review.querySelector('.ai-loading')).toBeNull();
  });
});
