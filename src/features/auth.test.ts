import assert from "node:assert/strict";
import test from "node:test";

import { hashPassword, verifyPassword } from "@/features/auth/password";
import { parseLoginInput, parseSignupInput } from "@/features/auth/validation";
import { ValidationError } from "@/lib/validation";

test("hashPassword and verifyPassword validate correct credentials", async () => {
  const password = "my-strong-password-value";
  const hashed = await hashPassword(password);

  assert.equal(await verifyPassword(password, hashed.salt, hashed.hash), true);
  assert.equal(await verifyPassword("wrong-password", hashed.salt, hashed.hash), false);
});

test("parseSignupInput returns normalized signup values", () => {
  const result = parseSignupInput({
    email: " Test@Example.com ",
    password: "1234567890",
    username: " Test_User ",
  });

  assert.deepEqual(result, {
    email: "test@example.com",
    password: "1234567890",
    username: "test_user",
  });
});

test("parseLoginInput rejects missing credentials", () => {
  assert.throws(
    () =>
      parseLoginInput({
        password: "",
        usernameOrEmail: "",
      }),
    (error: unknown) => error instanceof ValidationError,
  );
});
