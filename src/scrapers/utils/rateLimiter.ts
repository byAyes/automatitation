export class RateLimiter {
  private baseDelay: number;
  private jitter: number;

  constructor(baseDelay: number = 5000, jitter: number = 5000) {
    this.baseDelay = baseDelay;
    this.jitter = jitter;
  }

  async wait(): Promise<void> {
    const delay = this.baseDelay + Math.random() * this.jitter;
    console.log('[RateLimiter] Waiting ' + Math.round(delay / 1000) + 's before next request...');
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export const rateLimiter = new RateLimiter(5000, 5000);
