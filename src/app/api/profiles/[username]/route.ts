import { NextResponse } from "next/server";

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
  try {
    const params = await context.params;
    const profile = await getPublishedProfile(params.username);

    if (!profile) {
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

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    return profileErrorResponse(error, {
      code: "PROFILE_READ_FAILED",
      message: "Unable to load public profile.",
    });
  }
}
