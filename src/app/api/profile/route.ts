import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { assertCsrfToken } from "@/lib/csrf";
import { parseJsonBodyOrEmpty } from "@/lib/http-body";
import { enforceQuota } from "@/lib/quota";
import { getRequestContextSafe } from "@/lib/request-context";
import { writeAuditLog } from "@/lib/audit-log";

import { getAccountUser } from "@/features/auth/service";
import { profileErrorResponse } from "@/features/profile/api";
import {
  getOwnerProfile,
  saveOwnerProfileDraft,
} from "@/features/profile/service";

async function resolveSessionUsername(userId: string, username?: string): Promise<string> {
  if (username) {
    return username;
  }

  const user = await getAccountUser(userId);
  return user.username;
}

export async function GET(): Promise<NextResponse> {
  const requestContext = await getRequestContextSafe("api.profile.GET");

  try {
    console.debug("[route] api.profile.GET start", {
      requestId: requestContext.requestId,
    });

    const session = await requireSession();
    const username = await resolveSessionUsername(session.userId, session.username);
    const profile = await getOwnerProfile(session.userId, username);

    writeAuditLog({
      action: "api.profile.getOwner",
      actorId: session.userId,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    console.debug("[route] api.profile.GET failure", {
      requestId: requestContext.requestId,
    });

    writeAuditLog({
      action: "api.profile.getOwner",
      code: "PROFILE_READ_FAILED",
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "failure",
      requestId: requestContext.requestId,
    });

    return profileErrorResponse(error, {
      code: "PROFILE_READ_FAILED",
      message: "Unable to load owner profile.",
    });
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  const requestContext = await getRequestContextSafe("api.profile.PUT");

  try {
    console.debug("[route] api.profile.PUT start", {
      requestId: requestContext.requestId,
    });

    await assertCsrfToken(request.headers.get("x-csrf-token"));

    const session = await requireSession();
    const username = await resolveSessionUsername(session.userId, session.username);
    enforceQuota("profile.saveDraft", `${requestContext.clientIp}:${session.userId}`);
    const payload = await parseJsonBodyOrEmpty(request);
    const profile = await saveOwnerProfileDraft({
      ownerId: session.userId,
      payload,
      username,
    });

    writeAuditLog({
      action: "api.profile.saveDraft",
      actorId: session.userId,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    console.debug("[route] api.profile.PUT failure", {
      requestId: requestContext.requestId,
    });

    writeAuditLog({
      action: "api.profile.saveDraft",
      code: "PROFILE_UPDATE_FAILED",
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "failure",
      requestId: requestContext.requestId,
    });

    return profileErrorResponse(error, {
      code: "PROFILE_UPDATE_FAILED",
      message: "Unable to update owner profile.",
    });
  }
}
