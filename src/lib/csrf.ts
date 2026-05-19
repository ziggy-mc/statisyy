import { AppError, asAppError } from "@/lib/app-error";
import {
  createTokenId,
  getSigningSecret,
  issueSignedToken,
  verifySignedToken,
} from "@/lib/signed-token";
import { isRecord } from "@/lib/validation";
import { safeEqualTokens } from "@/lib/auth";

const CSRF_TTL_MS = 1000 * 60 * 30;

type CookieOptions = Readonly<{
  expires: Date;
  httpOnly: boolean;
  path: string;
  sameSite: "lax" | "strict";
  secure: boolean;
}>;

type CookieReader = Readonly<{
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
}>;

type CsrfPayload = Readonly<{
  nonce: string;
}>;

export type IssuedCsrfToken = Readonly<{
  cookie: Readonly<{
    name: string;
    options: CookieOptions;
    value: string;
  }>;
  expiresAt: Date;
  token: string;
}>;

function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getCsrfCookieName(): string {
  return isProductionEnvironment() ? "__Host-statisyy-csrf" : "statisyy-csrf";
}

function getCsrfCookieOptions(expiresAt: Date): CookieOptions {
  return {
    expires: expiresAt,
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: isProductionEnvironment(),
  };
}

function getCsrfSecret(): string {
  return getSigningSecret("CSRF_SECRET", "SESSION_SECRET");
}

function isCsrfPayload(value: unknown): value is CsrfPayload {
  return isRecord(value) && typeof value.nonce === "string";
}

async function getCookieStore(): Promise<CookieReader> {
  const { cookies } = await import("next/headers");
  return cookies() as unknown as CookieReader;
}

export async function issueCsrfToken(
  options?: Readonly<{
    now?: Date;
    ttlMs?: number;
  }>,
): Promise<IssuedCsrfToken> {
  const now = options?.now ?? new Date();
  const expiresAt = new Date(now.getTime() + (options?.ttlMs ?? CSRF_TTL_MS));
  const token = issueSignedToken(
    {
      exp: expiresAt.getTime(),
      iat: now.getTime(),
      nonce: createTokenId(24),
    },
    getCsrfSecret(),
  );

  return {
    cookie: {
      name: getCsrfCookieName(),
      options: getCsrfCookieOptions(expiresAt),
      value: token,
    },
    expiresAt,
    token,
  };
}

export async function setCsrfCookie(
  options?: Readonly<{
    now?: Date;
    ttlMs?: number;
  }>,
): Promise<IssuedCsrfToken> {
  const store = await getCookieStore();
  const issuedToken = await issueCsrfToken(options);

  store.set(
    issuedToken.cookie.name,
    issuedToken.cookie.value,
    issuedToken.cookie.options,
  );

  return issuedToken;
}

export async function readCsrfCookieValue(): Promise<string | null> {
  const store = await getCookieStore();

  return store.get(getCsrfCookieName())?.value ?? null;
}

export async function validateCsrfToken(
  submittedToken: string | null | undefined,
  cookieToken: string | null | undefined,
  now: Date = new Date(),
): Promise<boolean> {
  console.debug("[csrf] validation start", {
    hasCookieToken: Boolean(cookieToken),
    hasSubmittedToken: Boolean(submittedToken),
  });

  try {
    if (!submittedToken || !cookieToken || !safeEqualTokens(submittedToken, cookieToken)) {
      return false;
    }

    const payload = verifySignedToken(submittedToken, getCsrfSecret(), now);
    const isValidPayload = isCsrfPayload(payload);

    console.debug("[csrf] validation complete", {
      isValid: isValidPayload,
    });

    return isValidPayload;
  } catch (error: unknown) {
    const appError = asAppError(error, {
      code: "CSRF_VALIDATION_FAILED",
      message: "Unable to validate CSRF token.",
      statusCode: 500,
    });

    console.debug("[csrf] validation failed", {
      code: appError.code,
      statusCode: appError.statusCode,
    });

    throw appError;
  }
}

export async function validateCsrfTokenFromCookies(
  submittedToken: string | null | undefined,
  now: Date = new Date(),
): Promise<boolean> {
  const cookieToken = await readCsrfCookieValue();

  return validateCsrfToken(submittedToken, cookieToken, now);
}

export async function assertCsrfToken(
  submittedToken: string | null | undefined,
  now: Date = new Date(),
): Promise<void> {
  try {
    const isValid = await validateCsrfTokenFromCookies(submittedToken, now);

    if (!isValid) {
      throw new AppError({
        code: "INVALID_CSRF_TOKEN",
        message: "The CSRF token is missing or invalid.",
        statusCode: 403,
      });
    }
  } catch (error: unknown) {
    const appError = asAppError(error, {
      code: "CSRF_ASSERTION_FAILED",
      message: "Unable to assert CSRF token.",
      statusCode: 500,
    });

    console.debug("[csrf] assertion failed", {
      code: appError.code,
      statusCode: appError.statusCode,
    });

    throw appError;
  }
}
