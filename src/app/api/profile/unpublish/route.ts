import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";

import { profileErrorResponse } from "@/features/profile/api";
import { unpublishOwnerProfile } from "@/features/profile/service";

export async function POST(): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const profile = await unpublishOwnerProfile(session.userId);

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    return profileErrorResponse(error, {
      code: "PROFILE_UNPUBLISH_FAILED",
      message: "Unable to unpublish profile.",
    });
  }
}
