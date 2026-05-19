import { timingSafeEqual } from "node:crypto";

import { AppError, asAppError } from "@/lib/app-error";
import {
  createTokenId,
  getSigningSecret,
  issueSignedToken,
  verifySignedToken,
} from "@/lib/signed-token";
import { isRecord } from "@/lib/validation";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

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

export type SessionClaims = Readonly<{
  sessionId: string;
  userId: string;
  username?: string;
}>;

export type SessionRecord = Readonly<
  SessionClaims & {
    expiresAt: Date;
    issuedAt: Date;
  }
>;

export type IssuedSession = Readonly<{
  cookie: Readonly<{
    name: string;
    options: CookieOptions;
    value: string;
  }>;
  record: SessionRecord;
}>;

function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getSessionCookieName(): string {
  return isProductionEnvironment() ? "__Host-statisyy-session" : "statisyy-session";
}

function getSessionCookieOptions(expiresAt: Date): CookieOptions {
  return {
    expires: expiresAt,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isProductionEnvironment(),
  };
}

function getSessionSecret(): string {
  return getSigningSecret("SESSION_SECRET");
}

function getIssuedAt(now: Date): number {
  return now.getTime();
}

function getExpiresAt(now: Date, ttlMs: number): number {
  return now.getTime() + ttlMs;
}

function isSessionClaims(value: unknown): value is SessionClaims {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.sessionId !== "string" || typeof value.userId !== "string") {
    return false;
  }

  if (value.username !== undefined && typeof value.username !== "string") {
    return false;
  }

  return true;
}

async function getCookieStore(): Promise<CookieReader> {
  const { cookies } = await import("next/headers");
  return cookies() as unknown as CookieReader;
}

export async function issueSession(
  claims: Omit<SessionClaims, "sessionId"> & Partial<Pick<SessionClaims, "sessionId">>,
  options?: Readonly<{
    now?: Date;
    ttlMs?: number;
  }>,
): Promise<IssuedSession> {
  const now = options?.now ?? new Date();
  const ttlMs = options?.ttlMs ?? SESSION_TTL_MS;
  const issuedAt = getIssuedAt(now);
  const expiresAt = getExpiresAt(now, ttlMs);
  const sessionClaims: SessionClaims = {
    ...claims,
    sessionId: claims.sessionId ?? createTokenId(),
  };
  const token = issueSignedToken(
    {
      ...sessionClaims,
      exp: expiresAt,
      iat: issuedAt,
    },
    getSessionSecret(),
  );

  return {
    cookie: {
      name: getSessionCookieName(),
      options: getSessionCookieOptions(new Date(expiresAt)),
      value: token,
    },
    record: {
      ...sessionClaims,
      expiresAt: new Date(expiresAt),
      issuedAt: new Date(issuedAt),
    },
  };
}

export async function validateSessionToken(
  token: string | null | undefined,
  now: Date = new Date(),
): Promise<SessionRecord | null> {
  try {
    if (!token) {
      return null;
    }

    const payload = verifySignedToken(token, getSessionSecret(), now);

    if (!payload || !isSessionClaims(payload)) {
      return null;
    }

    return {
      expiresAt: new Date(payload.exp),
      issuedAt: new Date(payload.iat),
      sessionId: payload.sessionId,
      userId: payload.userId,
      username: payload.username,
    };
  } catch (error: unknown) {
    const appError = asAppError(error, {
      code: "SESSION_TOKEN_VALIDATION_FAILED",
      message: "Unable to validate session token.",
      statusCode: 500,
    });

    console.debug("[session] token validation failed", {
      code: appError.code,
      statusCode: appError.statusCode,
    });

    throw appError;
  }
}

export async function setSessionCookie(
  claims: Omit<SessionClaims, "sessionId"> & Partial<Pick<SessionClaims, "sessionId">>,
  options?: Readonly<{
    now?: Date;
    ttlMs?: number;
  }>,
): Promise<SessionRecord> {
  const store = await getCookieStore();
  const issuedSession = await issueSession(claims, options);

  store.set(
    issuedSession.cookie.name,
    issuedSession.cookie.value,
    issuedSession.cookie.options,
  );

  return issuedSession.record;
}

export async function getSessionFromCookies(): Promise<SessionRecord | null> {
  console.debug("[session] retrieval start");

  try {
    const store = await getCookieStore();
    const token = store.get(getSessionCookieName())?.value;
    const session = await validateSessionToken(token);

    console.debug("[session] retrieval complete", {
      hasSession: Boolean(session),
    });

    return session;
  } catch (error: unknown) {
    const appError = asAppError(error, {
      code: "SESSION_RETRIEVAL_FAILED",
      message: "Unable to read session from cookies.",
      statusCode: 500,
    });

    console.debug("[session] retrieval failed", {
      code: appError.code,
      statusCode: appError.statusCode,
    });

    throw appError;
  }
}

export async function requireSession(): Promise<SessionRecord> {
  const session = await getSessionFromCookies();

  if (!session) {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
      statusCode: 401,
    });
  }

  return session;
}

export async function clearSessionCookie(): Promise<void> {
  const store = await getCookieStore();

  store.set(getSessionCookieName(), "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isProductionEnvironment(),
  });
}

export function safeEqualTokens(
  left: string,
  right: string,
): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
