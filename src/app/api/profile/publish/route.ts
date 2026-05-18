import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";

import { profileErrorResponse } from "@/features/profile/api";
import { publishOwnerProfile } from "@/features/profile/service";

export async function POST(): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const profile = await publishOwnerProfile(session.userId);

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    return profileErrorResponse(error, {
      code: "PROFILE_PUBLISH_FAILED",
      message: "Unable to publish profile.",
    });
  }
}
