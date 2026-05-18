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
    avatarUrl: "https://example.com/avatar.png",
    bio: "  builder  ",
    displayName: "  Test User  ",
    username: "  Test_User  ",
    websiteUrl: "https://example.com/about",
  });

  assert.deepEqual(result, {
    ok: true,
    value: {
      avatarUrl: "https://example.com/avatar.png",
      bio: "builder",
      displayName: "Test User",
      username: "test_user",
      websiteUrl: "https://example.com/about",
    },
  });
});

test("validateProfileInput sanitizes display and bio text", () => {
  const result = validateProfileInput({
    bio: " <script>alert(1)</script> ",
    displayName: " <b>Builder</b> ",
    username: "valid_user",
  });

  assert.deepEqual(result, {
    ok: true,
    value: {
      avatarUrl: null,
      bio: "scriptalert(1)/script",
      displayName: "bBuilder/b",
      username: "valid_user",
      websiteUrl: null,
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

test("parseProfileInput throws on invalid avatar URLs", () => {
  assert.throws(
    () =>
      parseProfileInput({
        avatarUrl: "https://example.com/avatar.exe",
        username: "valid_user",
      }),
    (error: unknown) =>
      error instanceof ValidationError &&
      error.issues.some((issue) => issue.code === "invalid_avatar_url"),
  );
});
