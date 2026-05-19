import { NextResponse } from "next/server";

import { enforceQuota } from "@/lib/quota";
import { getRequestContextSafe } from "@/lib/request-context";
import { writeAuditLog } from "@/lib/audit-log";

import { profileErrorResponse } from "@/features/profile/api";
import { getPublishedProfile } from "@/features/profile/service";

export async function GET(
  _request: Request,
  context: Readonly<{
    params: Promise<{
      username: string;
    }>;
  }>,
): Promise<NextResponse> {
  const requestContext = await getRequestContextSafe("api.profiles.username.GET");

  try {
    console.debug("[route] api.profiles.username.GET start", {
      requestId: requestContext.requestId,
    });

    const params = await context.params;
    enforceQuota("profile.readPublic", `${requestContext.clientIp}:${params.username}`);
    const profile = await getPublishedProfile(params.username);

    if (!profile) {
      writeAuditLog({
        action: "api.profile.getPublic",
        code: "PROFILE_NOT_FOUND",
        details: {
          clientIp: requestContext.clientIp,
        },
        outcome: "failure",
        requestId: requestContext.requestId,
      });

      return NextResponse.json(
        {
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "Profile was not found.",
          },
        },
        {
          status: 404,
        },
      );
    }

    writeAuditLog({
      action: "api.profile.getPublic",
      details: {
        clientIp: requestContext.clientIp,
        username: profile.username,
      },
      outcome: "success",
      requestId: requestContext.requestId,
    });

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    console.debug("[route] api.profiles.username.GET failure", {
      requestId: requestContext.requestId,
    });

    writeAuditLog({
      action: "api.profile.getPublic",
      code: "PROFILE_READ_FAILED",
      details: {
        clientIp: requestContext.clientIp,
      },
      outcome: "failure",
      requestId: requestContext.requestId,
    });

    return profileErrorResponse(error, {
      code: "PROFILE_READ_FAILED",
      message: "Unable to load public profile.",
    });
  }
}
