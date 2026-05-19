"use server";

import { redirect } from "next/navigation";

import { asAppError } from "@/lib/app-error";
import { writeAuditLog } from "@/lib/audit-log";
import { requireSession, type SessionRecord } from "@/lib/auth";
import { assertCsrfToken } from "@/lib/csrf";
import { enforceQuota } from "@/lib/quota";
import { getRequestContext } from "@/lib/request-context";
import { ValidationError } from "@/lib/validation";

import { getAccountUser } from "@/features/auth/service";
import {
  publishOwnerProfile,
  saveOwnerProfileDraft,
  unpublishOwnerProfile,
} from "@/features/profile/service";

function getStringValue(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  return typeof value === "string" ? value : null;
}

function getValidationErrorCode(error: ValidationError): string {
  return error.issues[0]?.code ?? "VALIDATION_ERROR";
}

function getAuditOutcome(statusCode: number): "denied" | "failure" {
  return statusCode === 429 || statusCode === 403 ? "denied" : "failure";
}

async function resolveSessionUsername(session: SessionRecord): Promise<string> {
  if (session.username) {
    return session.username;
  }

  const user = await getAccountUser(session.userId);
  return user.username;
}

export async function saveProfileDraftAction(formData: FormData): Promise<void> {
  const requestContext = await getRequestContext();

  try {
    await assertCsrfToken(getStringValue(formData, "csrfToken"));

    const session = await requireSession();
    const username = await resolveSessionUsername(session);
    enforceQuota("profile.saveDraft", `${requestContext.clientIp}:${session.userId}`);

    await saveOwnerProfileDraft({
      ownerId: session.userId,
      payload: {
        avatarUrl: getStringValue(formData, "avatarUrl"),
        bio: getStringValue(formData, "bio"),
        displayName: getStringValue(formData, "displayName"),
        websiteUrl: getStringValue(formData, "websiteUrl"),
      },
      username,
    });

    writeAuditLog({
      action: "profile.saveDraft",
      actorId: session.userId,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    redirect("/account?profile_saved=1");
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      writeAuditLog({
        action: "profile.saveDraft",
        code: getValidationErrorCode(error),
        details: {
          clientIp: requestContext.clientIp,
        },
        outcome: "failure",
        requestId: requestContext.requestId,
      });

      redirect(
        `/account?profile_error=${encodeURIComponent(getValidationErrorCode(error))}`,
      );
    }

    const appError = asAppError(error, {
      code: "SAVE_PROFILE_FAILED",
      message: "Unable to save profile draft.",
      statusCode: 500,
    });

    writeAuditLog({
      action: "profile.saveDraft",
      code: appError.code,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: getAuditOutcome(appError.statusCode),
      requestId: requestContext.requestId,
    });

    redirect(`/account?profile_error=${encodeURIComponent(appError.code)}`);
  }
}

export async function publishProfileAction(formData: FormData): Promise<void> {
  const requestContext = await getRequestContext();

  try {
    await assertCsrfToken(getStringValue(formData, "csrfToken"));

    const session = await requireSession();
    enforceQuota("profile.publish", `${requestContext.clientIp}:${session.userId}`);

    await publishOwnerProfile(session.userId);

    writeAuditLog({
      action: "profile.publish",
      actorId: session.userId,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    redirect("/account?profile_published=1");
  } catch (error: unknown) {
    const appError = asAppError(error, {
      code: "PUBLISH_PROFILE_FAILED",
      message: "Unable to publish profile.",
      statusCode: 500,
    });

    writeAuditLog({
      action: "profile.publish",
      code: appError.code,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: getAuditOutcome(appError.statusCode),
      requestId: requestContext.requestId,
    });

    redirect(`/account?profile_error=${encodeURIComponent(appError.code)}`);
  }
}

export async function unpublishProfileAction(formData: FormData): Promise<void> {
  const requestContext = await getRequestContext();

  try {
    await assertCsrfToken(getStringValue(formData, "csrfToken"));

    const session = await requireSession();
    enforceQuota("profile.unpublish", `${requestContext.clientIp}:${session.userId}`);

    await unpublishOwnerProfile(session.userId);

    writeAuditLog({
      action: "profile.unpublish",
      actorId: session.userId,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    redirect("/account?profile_unpublished=1");
  } catch (error: unknown) {
    const appError = asAppError(error, {
      code: "UNPUBLISH_PROFILE_FAILED",
      message: "Unable to unpublish profile.",
      statusCode: 500,
    });

    writeAuditLog({
      action: "profile.unpublish",
      code: appError.code,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: getAuditOutcome(appError.statusCode),
      requestId: requestContext.requestId,
    });

    redirect(`/account?profile_error=${encodeURIComponent(appError.code)}`);
  }
}
