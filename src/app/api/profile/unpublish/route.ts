import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { assertCsrfToken } from "@/lib/csrf";
import { enforceQuota } from "@/lib/quota";
import { getRequestContext } from "@/lib/request-context";
import { writeAuditLog } from "@/lib/audit-log";

import { profileErrorResponse } from "@/features/profile/api";
import { unpublishOwnerProfile } from "@/features/profile/service";

export async function POST(request: Request): Promise<NextResponse> {
  const requestContext = await getRequestContext();

  try {
    await assertCsrfToken(request.headers.get("x-csrf-token"));

    const session = await requireSession();
    enforceQuota("profile.unpublish", `${requestContext.clientIp}:${session.userId}`);
    const profile = await unpublishOwnerProfile(session.userId);

    writeAuditLog({
      action: "api.profile.unpublish",
      actorId: session.userId,
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    writeAuditLog({
      action: "api.profile.unpublish",
      code: "PROFILE_UNPUBLISH_FAILED",
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "failure",
      requestId: requestContext.requestId,
    });

    return profileErrorResponse(error, {
      code: "PROFILE_UNPUBLISH_FAILED",
      message: "Unable to unpublish profile.",
    });
  }
}
