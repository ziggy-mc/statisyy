"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { asAppError } from "@/lib/app-error";
import { writeAuditLog } from "@/lib/audit-log";
import { setSessionCookie, clearSessionCookie, getSessionFromCookies } from "@/lib/auth";
import { assertCsrfToken } from "@/lib/csrf";
import { enforceQuota } from "@/lib/quota";
import { getRequestContextSafe } from "@/lib/request-context";
import { ValidationError } from "@/lib/validation";

import {
  getAccountUser,
  loginUser,
  signupUser,
  verifyEmailToken,
} from "@/features/auth/service";

function getStringValue(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  return typeof value === "string" ? value : null;
}

function getValidationErrorCode(error: ValidationError): string {
  return error.issues[0]?.code ?? "VALIDATION_ERROR";
}

const MISSING_EMAIL = "MISSING_EMAIL";
const MISSING_IDENTIFIER = "MISSING_IDENTIFIER";
const MISSING_TOKEN = "MISSING_TOKEN";
const MISSING_USERNAME = "MISSING_USERNAME";

function getAuditOutcome(statusCode: number): "denied" | "failure" {
  return statusCode === 429 || statusCode === 403 ? "denied" : "failure";
}

export async function signupAction(formData: FormData): Promise<void> {
  const requestContext = await getRequestContextSafe("signupAction");

  try {
    console.debug("[auth-action] signup start", {
      requestId: requestContext.requestId,
    });

    const username = getStringValue(formData, "username") ?? MISSING_USERNAME;
    const email = getStringValue(formData, "email") ?? MISSING_EMAIL;

    await assertCsrfToken(getStringValue(formData, "csrfToken"));
    enforceQuota("auth.signup", `${requestContext.clientIp}:${email}:${username}`);

    const result = await signupUser({
      email: getStringValue(formData, "email"),
      password: getStringValue(formData, "password"),
      username: getStringValue(formData, "username"),
    });

    await setSessionCookie({
      userId: result.user.id,
      username: result.user.username,
    });

    writeAuditLog({
      action: "auth.signup",
      actorId: result.user.id,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    redirect(`/verify-email?token=${encodeURIComponent(result.verificationToken)}`);
  } catch (error: unknown) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof ValidationError) {
      console.debug("[auth-action] signup validation failure", {
        code: getValidationErrorCode(error),
        requestId: requestContext.requestId,
      });

      writeAuditLog({
        action: "auth.signup",
        code: getValidationErrorCode(error),
        details: {
          clientIp: requestContext.clientIp,
        },
        outcome: "failure",
        requestId: requestContext.requestId,
      });

      redirect(`/signup?error=${encodeURIComponent(getValidationErrorCode(error))}`);
    }

    const appError = asAppError(error, {
      code: "SIGNUP_FAILED",
      message: "Unable to create account.",
      statusCode: 500,
    });

    writeAuditLog({
      action: "auth.signup",
      code: appError.code,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: getAuditOutcome(appError.statusCode),
      requestId: requestContext.requestId,
    });

    redirect(`/signup?error=${encodeURIComponent(appError.code)}`);
  }
}

export async function loginAction(formData: FormData): Promise<void> {
  const requestContext = await getRequestContextSafe("loginAction");

  try {
    console.debug("[auth-action] login start", {
      requestId: requestContext.requestId,
    });

    const identifier = getStringValue(formData, "usernameOrEmail") ?? MISSING_IDENTIFIER;

    await assertCsrfToken(getStringValue(formData, "csrfToken"));
    enforceQuota("auth.login", `${requestContext.clientIp}:${identifier}`);

    const user = await loginUser({
      password: getStringValue(formData, "password"),
      usernameOrEmail: getStringValue(formData, "usernameOrEmail"),
    });

    await setSessionCookie({
      userId: user.id,
      username: user.username,
    });

    writeAuditLog({
      action: "auth.login",
      actorId: user.id,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    redirect("/account");
  } catch (error: unknown) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof ValidationError) {
      console.debug("[auth-action] login validation failure", {
        code: getValidationErrorCode(error),
        requestId: requestContext.requestId,
      });

      writeAuditLog({
        action: "auth.login",
        code: getValidationErrorCode(error),
        details: {
          clientIp: requestContext.clientIp,
        },
        outcome: "failure",
        requestId: requestContext.requestId,
      });

      redirect(`/login?error=${encodeURIComponent(getValidationErrorCode(error))}`);
    }

    const appError = asAppError(error, {
      code: "LOGIN_FAILED",
      message: "Unable to log in.",
      statusCode: 500,
    });

    writeAuditLog({
      action: "auth.login",
      code: appError.code,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: getAuditOutcome(appError.statusCode),
      requestId: requestContext.requestId,
    });

    redirect(`/login?error=${encodeURIComponent(appError.code)}`);
  }
}

export async function logoutAction(formData: FormData): Promise<void> {
  const requestContext = await getRequestContextSafe("logoutAction");

  try {
    console.debug("[auth-action] logout start", {
      requestId: requestContext.requestId,
    });

    await assertCsrfToken(getStringValue(formData, "csrfToken"));

    const session = await getSessionFromCookies();
    await clearSessionCookie();

    writeAuditLog({
      action: "auth.logout",
      actorId: session?.userId,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    redirect("/login?logged_out=1");
  } catch (error: unknown) {
    if (isRedirectError(error)) {
      throw error;
    }

    const appError = asAppError(error, {
      code: "LOGOUT_FAILED",
      message: "Unable to log out.",
      statusCode: 500,
    });

    writeAuditLog({
      action: "auth.logout",
      code: appError.code,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: getAuditOutcome(appError.statusCode),
      requestId: requestContext.requestId,
    });

    redirect(`/account?error=${encodeURIComponent(appError.code)}`);
  }
}

export async function verifyEmailAction(formData: FormData): Promise<void> {
  const requestContext = await getRequestContextSafe("verifyEmailAction");

  try {
    console.debug("[auth-action] verify-email start", {
      requestId: requestContext.requestId,
    });

    const token = getStringValue(formData, "token") ?? MISSING_TOKEN;

    await assertCsrfToken(getStringValue(formData, "csrfToken"));
    enforceQuota("auth.verifyEmail", `${requestContext.clientIp}:${token}`);

    const result = await verifyEmailToken(getStringValue(formData, "token"));
    const session = await getSessionFromCookies();

    if (!session) {
      const user = await getAccountUser(result.userId);

      await setSessionCookie({
        userId: result.userId,
        username: user.username,
      });
    }

    writeAuditLog({
      action: "auth.verifyEmail",
      actorId: result.userId,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    redirect("/account?verified=1");
  } catch (error: unknown) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof ValidationError) {
      console.debug("[auth-action] verify-email validation failure", {
        code: getValidationErrorCode(error),
        requestId: requestContext.requestId,
      });

      writeAuditLog({
        action: "auth.verifyEmail",
        code: getValidationErrorCode(error),
        details: {
          clientIp: requestContext.clientIp,
        },
        outcome: "failure",
        requestId: requestContext.requestId,
      });

      redirect(`/verify-email?error=${encodeURIComponent(getValidationErrorCode(error))}`);
    }

    const appError = asAppError(error, {
      code: "VERIFY_EMAIL_FAILED",
      message: "Unable to verify email.",
      statusCode: 500,
    });

    writeAuditLog({
      action: "auth.verifyEmail",
      code: appError.code,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: getAuditOutcome(appError.statusCode),
      requestId: requestContext.requestId,
    });

    redirect(`/verify-email?error=${encodeURIComponent(appError.code)}`);
  }
}
    console.debug("[auth-action] verify-email failure", {
      code: appError.code,
      requestId: requestContext.requestId,
      statusCode: appError.statusCode,
    });

    console.debug("[auth-action] logout failure", {
      code: appError.code,
      requestId: requestContext.requestId,
      statusCode: appError.statusCode,
    });

    console.debug("[auth-action] login failure", {
      code: appError.code,
      requestId: requestContext.requestId,
      statusCode: appError.statusCode,
    });

    console.debug("[auth-action] signup failure", {
      code: appError.code,
      requestId: requestContext.requestId,
      statusCode: appError.statusCode,
    });
