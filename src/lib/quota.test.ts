import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { AppError } from "@/lib/app-error";
import { enforceQuota } from "@/lib/quota";

test("enforceQuota allows requests within the configured limit", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const key = `quota-allow-${randomUUID()}`;

  for (let index = 0; index < 10; index += 1) {
    const result = enforceQuota("auth.login", key, now);
    assert.equal(result.allowed, true);
  }
});

test("enforceQuota throws typed AppError after quota is exceeded", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const key = `quota-deny-${randomUUID()}`;

  for (let index = 0; index < 10; index += 1) {
    enforceQuota("auth.login", key, now);
  }

  assert.throws(() => {
    enforceQuota("auth.login", key, now);
  }, (error: unknown) => {
    assert.equal(error instanceof AppError, true);
    assert.equal((error as AppError).code, "QUOTA_EXCEEDED");
    assert.equal((error as AppError).statusCode, 429);
    return true;
  });
});
