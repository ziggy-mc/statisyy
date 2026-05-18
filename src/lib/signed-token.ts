import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { AppError } from "@/lib/app-error";
import { isRecord } from "@/lib/validation";

type PrimitiveClaim = boolean | number | string | readonly string[] | null;

export type SignedTokenPayload = Readonly<
  {
    exp: number;
    iat: number;
  } & Record<string, PrimitiveClaim>
>;

function encodeSegment(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeSegment(value: string): string | null {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function signValue(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function getSignatureBuffer(signature: string): Buffer {
  return Buffer.from(signature, "base64url");
}

export function getSigningSecret(
  primaryEnvName: string,
  fallbackEnvName?: string,
): string {
  const primaryValue = process.env[primaryEnvName]?.trim();
  const fallbackValue = fallbackEnvName
    ? process.env[fallbackEnvName]?.trim()
    : undefined;
  const secret = primaryValue || fallbackValue;

  if (!secret) {
    throw new AppError({
      code: "CONFIGURATION_ERROR",
      details: {
        env: primaryEnvName,
      },
      message: `Missing required environment variable: ${primaryEnvName}.`,
      statusCode: 500,
    });
  }

  if (secret.length < 32) {
    throw new AppError({
      code: "CONFIGURATION_ERROR",
      details: {
        env: primaryEnvName,
        minLength: 32,
      },
      message: `${primaryEnvName} must be at least 32 characters long.`,
      statusCode: 500,
    });
  }

  return secret;
}

export function issueSignedToken(
  payload: SignedTokenPayload,
  secret: string,
): string {
  const encodedPayload = encodeSegment(JSON.stringify(payload));
  const signature = signValue(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifySignedToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): SignedTokenPayload | null {
  const [encodedPayload, encodedSignature, ...rest] = token.split(".");

  if (!encodedPayload || !encodedSignature || rest.length > 0) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload, secret);
  const providedSignatureBuffer = getSignatureBuffer(encodedSignature);
  const expectedSignatureBuffer = getSignatureBuffer(expectedSignature);

  if (
    providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  const payloadJson = decodeSegment(encodedPayload);

  if (!payloadJson) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(payloadJson) as unknown;

    if (!isRecord(parsedValue)) {
      return null;
    }

    if (
      typeof parsedValue.exp !== "number" ||
      typeof parsedValue.iat !== "number"
    ) {
      return null;
    }

    if (parsedValue.exp <= now.getTime()) {
      return null;
    }

    return parsedValue as SignedTokenPayload;
  } catch {
    return null;
  }
}

export function createTokenId(byteLength = 18): string {
  return randomBytes(byteLength).toString("base64url");
}
