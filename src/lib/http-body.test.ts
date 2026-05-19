import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "@/lib/app-error";
import { parseJsonBodyOrEmpty } from "@/lib/http-body";

test("parseJsonBodyOrEmpty returns parsed JSON object for valid payload", async () => {
  const request = new Request("https://example.com", {
    body: JSON.stringify({ displayName: "Alice" }),
    method: "PUT",
  });

  const body = await parseJsonBodyOrEmpty(request);

  assert.deepEqual(body, { displayName: "Alice" });
});

test("parseJsonBodyOrEmpty returns empty object for an empty body", async () => {
  const request = new Request("https://example.com", {
    body: "",
    method: "PUT",
  });

  const body = await parseJsonBodyOrEmpty(request);

  assert.deepEqual(body, {});
});

test("parseJsonBodyOrEmpty throws AppError for malformed JSON", async () => {
  const request = new Request("https://example.com", {
    body: "{invalid-json}",
    method: "PUT",
  });

  await assert.rejects(
    async () => {
      await parseJsonBodyOrEmpty(request);
    },
    (error: unknown) => {
      assert.equal(error instanceof AppError, true);
      assert.equal((error as AppError).code, "INVALID_JSON_BODY");
      assert.equal((error as AppError).statusCode, 400);
      return true;
    },
  );
});
