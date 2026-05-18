import assert from "node:assert/strict";
import test from "node:test";

import {
  issueSession,
  validateSessionToken,
} from "@/lib/auth";
import {
  issueCsrfToken,
  validateCsrfToken,
} from "@/lib/csrf";
import { InMemoryRateLimiter } from "@/lib/rate-limit";

const PREVIOUS_SESSION_SECRET = process.env.SESSION_SECRET;
const PREVIOUS_CSRF_SECRET = process.env.CSRF_SECRET;
const FIXED_NOW = new Date("2026-01-01T00:00:00.000Z");

process.env.SESSION_SECRET = "session-secret-value-with-at-least-thirty-two-chars";
process.env.CSRF_SECRET = "csrf-secret-value-with-at-least-thirty-two-chars";

test("issueSession creates a verifiable signed session token", async () => {
  const session = await issueSession(
    {
      userId: "user_123",
      username: "tester",
    },
    {
      now: FIXED_NOW,
      ttlMs: 1_000,
    },
  );

  const validatedSession = await validateSessionToken(
    session.cookie.value,
    new Date("2026-01-01T00:00:00.500Z"),
  );

  assert.deepEqual(validatedSession, {
    expiresAt: new Date("2026-01-01T00:00:01.000Z"),
    issuedAt: new Date("2026-01-01T00:00:00.000Z"),
    sessionId: session.record.sessionId,
    userId: "user_123",
    username: "tester",
  });
});

test("validateSessionToken rejects expired tokens", async () => {
  const session = await issueSession(
    {
      userId: "user_123",
    },
    {
      now: FIXED_NOW,
      ttlMs: 1_000,
    },
  );

  const validatedSession = await validateSessionToken(
    session.cookie.value,
    new Date("2026-01-01T00:00:01.001Z"),
  );

  assert.equal(validatedSession, null);
});

test("issueCsrfToken creates a token that validates against the cookie value", async () => {
  const issuedToken = await issueCsrfToken({
    now: FIXED_NOW,
    ttlMs: 5_000,
  });

  const isValid = await validateCsrfToken(
    issuedToken.token,
    issuedToken.cookie.value,
    new Date("2026-01-01T00:00:02.000Z"),
  );

  assert.equal(isValid, true);
});

test("validateCsrfToken rejects mismatched tokens", async () => {
  const firstToken = await issueCsrfToken();
  const secondToken = await issueCsrfToken();
  const isValid = await validateCsrfToken(
    firstToken.token,
    secondToken.cookie.value,
  );

  assert.equal(isValid, false);
});

test("InMemoryRateLimiter blocks requests above the configured limit", () => {
  const limiter = new InMemoryRateLimiter({
    max: 2,
    windowMs: 10_000,
  });
  const now = FIXED_NOW;

  assert.equal(limiter.consume("127.0.0.1", now).allowed, true);
  assert.equal(limiter.consume("127.0.0.1", now).allowed, true);

  const limitedResult = limiter.consume("127.0.0.1", now);

  assert.equal(limitedResult.allowed, false);
  assert.equal(limitedResult.remaining, 0);
  assert.equal(limitedResult.retryAfterSeconds, 10);
});

test.after(() => {
  if (PREVIOUS_SESSION_SECRET === undefined) {
    delete process.env.SESSION_SECRET;
  } else {
    process.env.SESSION_SECRET = PREVIOUS_SESSION_SECRET;
  }

  if (PREVIOUS_CSRF_SECRET === undefined) {
    delete process.env.CSRF_SECRET;
  } else {
    process.env.CSRF_SECRET = PREVIOUS_CSRF_SECRET;
  }
});
