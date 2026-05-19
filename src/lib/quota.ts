import { AppError } from "@/lib/app-error";
import {
  InMemoryRateLimiter,
  type RateLimitResult,
  type RateLimiterOptions,
} from "@/lib/rate-limit";

export type QuotaPolicy =
  | "auth.login"
  | "auth.signup"
  | "auth.verifyEmail"
  | "profile.publish"
  | "profile.readPublic"
  | "profile.saveDraft"
  | "profile.unpublish";

const DEFAULT_POLICY_OPTIONS: Readonly<Record<QuotaPolicy, RateLimiterOptions>> = {
  "auth.login": { max: 10, windowMs: 60_000 },
  "auth.signup": { max: 5, windowMs: 60_000 },
  "auth.verifyEmail": { max: 20, windowMs: 60_000 },
  "profile.publish": { max: 20, windowMs: 60_000 },
  "profile.readPublic": { max: 120, windowMs: 60_000 },
  "profile.saveDraft": { max: 30, windowMs: 60_000 },
  "profile.unpublish": { max: 20, windowMs: 60_000 },
};

const limiterByPolicy = new Map<QuotaPolicy, InMemoryRateLimiter>();

function getLimiter(policy: QuotaPolicy): InMemoryRateLimiter {
  const existing = limiterByPolicy.get(policy);

  if (existing) {
    return existing;
  }

  const limiter = new InMemoryRateLimiter(DEFAULT_POLICY_OPTIONS[policy]);
  limiterByPolicy.set(policy, limiter);
  return limiter;
}

function normalizeQuotaKey(key: string): string {
  const normalized = key.trim();

  if (!normalized) {
    throw new AppError({
      code: "INVALID_RATE_LIMIT_KEY",
      message: "Quota key is required.",
      statusCode: 500,
    });
  }

  return normalized;
}

export function enforceQuota(
  policy: QuotaPolicy,
  key: string,
  now: Date = new Date(),
): RateLimitResult {
  const limiter = getLimiter(policy);
  const result = limiter.consume(`${policy}:${normalizeQuotaKey(key)}`, now);

  if (result.allowed) {
    return result;
  }

  throw new AppError({
    code: "QUOTA_EXCEEDED",
    details: {
      limit: result.limit,
      policy,
      retryAfterSeconds: result.retryAfterSeconds,
    },
    message: "Request quota exceeded. Please retry later.",
    statusCode: 429,
  });
}
