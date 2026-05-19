import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { assertCsrfToken } from "@/lib/csrf";
import { enforceQuota } from "@/lib/quota";
import { getRequestContextSafe } from "@/lib/request-context";
import { writeAuditLog } from "@/lib/audit-log";

import { profileErrorResponse } from "@/features/profile/api";
import { publishOwnerProfile } from "@/features/profile/service";

export async function POST(request: Request): Promise<NextResponse> {
  const requestContext = await getRequestContextSafe("api.profile.publish.POST");

  try {
    console.debug("[route] api.profile.publish.POST start", {
      requestId: requestContext.requestId,
    });

    await assertCsrfToken(request.headers.get("x-csrf-token"));

    const session = await requireSession();
    enforceQuota("profile.publish", `${requestContext.clientIp}:${session.userId}`);
    const profile = await publishOwnerProfile(session.userId);

    writeAuditLog({
      action: "api.profile.publish",
      actorId: session.userId,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    console.debug("[route] api.profile.publish.POST failure", {
      requestId: requestContext.requestId,
    });

    writeAuditLog({
      action: "api.profile.publish",
      code: "PROFILE_PUBLISH_FAILED",
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "failure",
      requestId: requestContext.requestId,
    });

    return profileErrorResponse(error, {
      code: "PROFILE_PUBLISH_FAILED",
      message: "Unable to publish profile.",
    });
  }
}
