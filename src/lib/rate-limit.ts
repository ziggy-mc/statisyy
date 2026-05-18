import { AppError } from "@/lib/app-error";

type RateLimitState = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = Readonly<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}>;

export type RateLimiterOptions = Readonly<{
  max: number;
  windowMs: number;
}>;

export class InMemoryRateLimiter {
  readonly #max: number;
  readonly #windowMs: number;
  readonly #store = new Map<string, RateLimitState>();

  constructor(options: RateLimiterOptions) {
    if (options.max < 1 || !Number.isInteger(options.max)) {
      throw new AppError({
        code: "INVALID_RATE_LIMIT_CONFIGURATION",
        message: "Rate limit max must be a positive integer.",
        statusCode: 500,
      });
    }

    if (options.windowMs < 1 || !Number.isInteger(options.windowMs)) {
      throw new AppError({
        code: "INVALID_RATE_LIMIT_CONFIGURATION",
        message: "Rate limit window must be a positive integer.",
        statusCode: 500,
      });
    }

    this.#max = options.max;
    this.#windowMs = options.windowMs;
  }

  consume(key: string, now: Date = new Date()): RateLimitResult {
    if (key.length === 0) {
      throw new AppError({
        code: "INVALID_RATE_LIMIT_KEY",
        message: "Rate limit key is required.",
        statusCode: 500,
      });
    }

    this.prune(now);

    const nowValue = now.getTime();
    const existingState = this.#store.get(key);
    const resetAt = existingState?.resetAt ?? nowValue + this.#windowMs;
    const nextCount =
      existingState && existingState.resetAt > nowValue
        ? existingState.count + 1
        : 1;

    this.#store.set(key, {
      count: nextCount,
      resetAt,
    });

    const remaining = Math.max(this.#max - nextCount, 0);
    const allowed = nextCount <= this.#max;

    return {
      allowed,
      limit: this.#max,
      remaining,
      resetAt: new Date(resetAt),
      retryAfterSeconds: allowed ? 0 : Math.max(Math.ceil((resetAt - nowValue) / 1000), 1),
    };
  }

  reset(key: string): void {
    this.#store.delete(key);
  }

  prune(now: Date = new Date()): void {
    const nowValue = now.getTime();

    for (const [key, state] of this.#store.entries()) {
      if (state.resetAt <= nowValue) {
        this.#store.delete(key);
      }
    }
  }
}

export function createRateLimiter(
  options: RateLimiterOptions = {
    max: 10,
    windowMs: 60_000,
  },
): InMemoryRateLimiter {
  return new InMemoryRateLimiter(options);
}

export const defaultRateLimiter = createRateLimiter();
