/**
 * Timer utility for countdown operations.
 */
export class Timer {
  constructor(durationSeconds, onTick, onComplete) {
    this.remaining = durationSeconds;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.interval = null;
  }

  start() {
    this.interval = setInterval(() => {
      this.remaining -= 1;
      if (this.onTick) this.onTick(this.remaining);
      if (this.remaining <= 0) {
        this.stop();
        if (this.onComplete) this.onComplete();
      }
    }, 1000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }
}
