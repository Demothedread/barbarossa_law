/**
 * Track answered questions and compute stats by topic.
 */
export class ProgressTracker {
  constructor() {
    this.records = [];
    this.current = null;
  }

  /** Begin timing for a question. */
  start(question) {
    this.current = { id: question.id, topic: question.topic, start: performance.now() };
  }

  /**
   * Stop timing and store answer info.
   * @param {number|null} answerIndex User answer
   * @param {number} correctIndex Correct answer
   */
  stop(answerIndex, correctIndex) {
    if (!this.current) return;
    const r = this.current;
    r.timeMs = performance.now() - r.start;
    r.answer = answerIndex;
    r.correctIndex = correctIndex;
    r.correct = answerIndex === correctIndex;
    this.records.push(r);
    this.current = null;
  }

  /** Get summary stats grouped by topic. */
  getTopicStats() {
    const total = this.records.length;
    const map = {};
    this.records.forEach((r) => {
      if (!map[r.topic]) map[r.topic] = { count: 0, correct: 0, time: 0 };
      const m = map[r.topic];
      m.count += 1;
      if (r.correct) m.correct += 1;
      m.time += r.timeMs;
    });
    for (const t of Object.keys(map)) {
      const m = map[t];
      m.percentOfTotal = (m.count / total) * 100;
      m.correctPercent = (m.correct / m.count) * 100;
      m.avgTimeMs = m.time / m.count;
    }
    return map;
  }
}
