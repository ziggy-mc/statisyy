"use server";

import { redirect } from "next/navigation";

import { asAppError } from "@/lib/app-error";
import { setSessionCookie, clearSessionCookie, getSessionFromCookies } from "@/lib/auth";
import { assertCsrfToken } from "@/lib/csrf";
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

export async function signupAction(formData: FormData): Promise<void> {
  try {
    await assertCsrfToken(getStringValue(formData, "csrfToken"));

    const result = await signupUser({
      email: getStringValue(formData, "email"),
      password: getStringValue(formData, "password"),
      username: getStringValue(formData, "username"),
    });

    await setSessionCookie({
      userId: result.user.id,
      username: result.user.username,
    });

    redirect(`/verify-email?token=${encodeURIComponent(result.verificationToken)}`);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      redirect(`/signup?error=${encodeURIComponent(getValidationErrorCode(error))}`);
    }

    const appError = asAppError(error, {
      code: "SIGNUP_FAILED",
      message: "Unable to create account.",
      statusCode: 500,
    });

    redirect(`/signup?error=${encodeURIComponent(appError.code)}`);
  }
}

export async function loginAction(formData: FormData): Promise<void> {
  try {
    await assertCsrfToken(getStringValue(formData, "csrfToken"));

    const user = await loginUser({
      password: getStringValue(formData, "password"),
      usernameOrEmail: getStringValue(formData, "usernameOrEmail"),
    });

    await setSessionCookie({
      userId: user.id,
      username: user.username,
    });

    redirect("/account");
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      redirect(`/login?error=${encodeURIComponent(getValidationErrorCode(error))}`);
    }

    const appError = asAppError(error, {
      code: "LOGIN_FAILED",
      message: "Unable to log in.",
      statusCode: 500,
    });

    redirect(`/login?error=${encodeURIComponent(appError.code)}`);
  }
}

export async function logoutAction(formData: FormData): Promise<void> {
  try {
    await assertCsrfToken(getStringValue(formData, "csrfToken"));
    await clearSessionCookie();
    redirect("/login?logged_out=1");
  } catch (error: unknown) {
    const appError = asAppError(error, {
      code: "LOGOUT_FAILED",
      message: "Unable to log out.",
      statusCode: 500,
    });

    redirect(`/account?error=${encodeURIComponent(appError.code)}`);
  }
}

export async function verifyEmailAction(formData: FormData): Promise<void> {
  try {
    await assertCsrfToken(getStringValue(formData, "csrfToken"));

    const result = await verifyEmailToken(getStringValue(formData, "token"));
    const session = await getSessionFromCookies();

    if (!session) {
      const user = await getAccountUser(result.userId);

      await setSessionCookie({
        userId: result.userId,
        username: user.username,
      });
    }

    redirect("/account?verified=1");
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      redirect(`/verify-email?error=${encodeURIComponent(getValidationErrorCode(error))}`);
    }

    const appError = asAppError(error, {
      code: "VERIFY_EMAIL_FAILED",
      message: "Unable to verify email.",
      statusCode: 500,
    });

    redirect(`/verify-email?error=${encodeURIComponent(appError.code)}`);
  }
}
