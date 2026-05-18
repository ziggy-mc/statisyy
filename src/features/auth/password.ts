import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

import { AppError } from "@/lib/app-error";

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, PASSWORD_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(
          new AppError({
            cause: error,
            code: "PASSWORD_HASH_ERROR",
            message: "Unable to hash password.",
            statusCode: 500,
          }),
        );
        return;
      }

      resolve(derivedKey as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<{
  hash: string;
  salt: string;
}> {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString("base64url");
  const hash = (await scryptAsync(password, salt)).toString("base64url");

  return {
    hash,
    salt,
  };
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const derivedHash = await scryptAsync(password, salt);
  const expectedBuffer = Buffer.from(expectedHash, "base64url");

  if (expectedBuffer.length !== derivedHash.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, derivedHash);
}
