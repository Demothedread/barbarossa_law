/**
 * Utility to select questions using 75%/25% reuse rule.
 */
export class QuestionManager {
  /**
   * @param {Array} data Array of question objects
   * @param {()=>number} randFn Optional RNG for testing
   */
  constructor(data, randFn = Math.random) {
    this.data = data;
    this.rand = randFn;
    this.used = new Set();
  }

  /**
   * Get the next question.
   * @returns {object}
   */
  next() {
    const total = this.data.length;
    const earlyLimit = Math.floor(total * 0.25);
    let pool;
    if (this.used.size < Math.floor(total * 0.75)) {
      pool = this.data
        .map((q, i) => i)
        .filter((i) => !this.used.has(i));
    } else {
      pool = Array.from({ length: earlyLimit }, (_, i) => i);
    }
    const index = pool[Math.floor(this.rand() * pool.length)];
    this.used.add(index);
    return this.data[index];
  }

  /** Reset selection state. */
  reset() {
    this.used.clear();
  }
}
