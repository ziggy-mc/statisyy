import assert from "node:assert/strict";
import test from "node:test";

import {
  parseProfileInput,
  validateProfileInput,
} from "@/lib/profile-validation";
import {
  parseUsername,
  validateUsername,
} from "@/lib/username-policy";
import { ValidationError } from "@/lib/validation";

test("validateUsername normalizes valid usernames", () => {
  const result = validateUsername("  Example_User  ");

  assert.deepEqual(result, {
    ok: true,
    value: "example_user",
  });
});

test("validateUsername rejects reserved usernames", () => {
  const result = validateUsername("admin");

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.deepEqual(result.issues, [
      {
        code: "reserved",
        field: "username",
        message: "Username is reserved and cannot be used.",
      },
    ]);
  }
});

test("parseUsername throws a typed validation error on invalid input", () => {
  assert.throws(
    () => parseUsername("ab"),
    (error: unknown) =>
      error instanceof ValidationError &&
      error.issues.some((issue) => issue.code === "too_short"),
  );
});

test("validateProfileInput returns normalized profile data", () => {
  const result = validateProfileInput({
    bio: "  builder  ",
    displayName: "  Test User  ",
    username: "  Test_User  ",
    websiteUrl: "https://example.com/about",
  });

  assert.deepEqual(result, {
    ok: true,
    value: {
      bio: "builder",
      displayName: "Test User",
      username: "test_user",
      websiteUrl: "https://example.com/about",
    },
  });
});

test("parseProfileInput throws on invalid website URLs", () => {
  assert.throws(
    () =>
      parseProfileInput({
        username: "valid_user",
        websiteUrl: "mailto:test@example.com",
      }),
    (error: unknown) =>
      error instanceof ValidationError &&
      error.issues.some((issue) => issue.code === "invalid_url"),
  );
});
