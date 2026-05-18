import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";

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
  try {
    const session = await requireSession();
    const username = await resolveSessionUsername(session.userId, session.username);
    const profile = await getOwnerProfile(session.userId, username);

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    return profileErrorResponse(error, {
      code: "PROFILE_READ_FAILED",
      message: "Unable to load owner profile.",
    });
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const username = await resolveSessionUsername(session.userId, session.username);
    const payload = (await request.json()) as unknown;
    const profile = await saveOwnerProfileDraft({
      ownerId: session.userId,
      payload,
      username,
    });

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    return profileErrorResponse(error, {
      code: "PROFILE_UPDATE_FAILED",
      message: "Unable to update owner profile.",
    });
  }
}
