import { AppError } from "@/lib/app-error";
import { parseProfileInput } from "@/lib/profile-validation";
import { parseUsername } from "@/lib/username-policy";
import { isRecord } from "@/lib/validation";

import {
  findProfileByOwnerId,
  findPublicProfileByUsername,
  saveProfileDraft,
  setProfilePublishedState,
  type ProfileDocument,
} from "@/features/profile/repository";

export type OwnerProfile = Readonly<{
  avatarUrl: string | null;
  bio: string | null;
  displayName: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  updatedAt: Date | null;
  username: string;
  websiteUrl: string | null;
}>;

export type PublicProfile = Readonly<{
  avatarUrl: string | null;
  bio: string | null;
  displayName: string | null;
  publishedAt: Date;
  username: string;
  websiteUrl: string | null;
}>;

type SaveOwnerProfileDraftInput = Readonly<{
  ownerId: string;
  payload: unknown;
  username: string;
}>;

function mapOwnerProfile(document: ProfileDocument): OwnerProfile {
  return {
    avatarUrl: document.avatarUrl,
    bio: document.bio,
    displayName: document.displayName,
    isPublished: document.publishedAt !== null,
    publishedAt: document.publishedAt,
    updatedAt: document.updatedAt,
    username: document.username,
    websiteUrl: document.websiteUrl,
  };
}

function mapPublicProfile(document: ProfileDocument): PublicProfile {
  if (!document.publishedAt) {
    throw new AppError({
      code: "PROFILE_NOT_PUBLISHED",
      message: "Profile is not published.",
      statusCode: 404,
    });
  }

  return {
    avatarUrl: document.avatarUrl,
    bio: document.bio,
    displayName: document.displayName,
    publishedAt: document.publishedAt,
    username: document.username,
    websiteUrl: document.websiteUrl,
  };
}

function toProfilePayload(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload)) {
    return {};
  }

  return payload;
}

function getDefaultOwnerProfile(username: string): OwnerProfile {
  return {
    avatarUrl: null,
    bio: null,
    displayName: null,
    isPublished: false,
    publishedAt: null,
    updatedAt: null,
    username,
    websiteUrl: null,
  };
}

export async function getOwnerProfile(
  ownerId: string,
  fallbackUsername?: string,
): Promise<OwnerProfile> {
  const profile = await findProfileByOwnerId(ownerId);

  if (profile) {
    return mapOwnerProfile(profile);
  }

  if (!fallbackUsername) {
    throw new AppError({
      code: "PROFILE_USERNAME_REQUIRED",
      message: "Username is required to initialize a profile draft.",
      statusCode: 400,
    });
  }

  return getDefaultOwnerProfile(parseUsername(fallbackUsername));
}

export async function saveOwnerProfileDraft(
  input: SaveOwnerProfileDraftInput,
): Promise<OwnerProfile> {
  const profilePayload = toProfilePayload(input.payload);
  const validatedProfile = parseProfileInput({
    ...profilePayload,
    username: input.username,
  });

  const profile = await saveProfileDraft({
    now: new Date(),
    ownerId: input.ownerId,
    profile: validatedProfile,
  });

  return mapOwnerProfile(profile);
}

export async function publishOwnerProfile(ownerId: string): Promise<OwnerProfile> {
  const profile = await setProfilePublishedState({
    now: new Date(),
    ownerId,
    published: true,
  });

  if (!profile) {
    throw new AppError({
      code: "PROFILE_NOT_FOUND",
      message: "Profile draft does not exist.",
      statusCode: 404,
    });
  }

  return mapOwnerProfile(profile);
}

export async function unpublishOwnerProfile(ownerId: string): Promise<OwnerProfile> {
  const profile = await setProfilePublishedState({
    now: new Date(),
    ownerId,
    published: false,
  });

  if (!profile) {
    throw new AppError({
      code: "PROFILE_NOT_FOUND",
      message: "Profile draft does not exist.",
      statusCode: 404,
    });
  }

  return mapOwnerProfile(profile);
}

export async function getPublishedProfile(
  rawUsername: unknown,
): Promise<PublicProfile | null> {
  const username = parseUsername(rawUsername);
  const profile = await findPublicProfileByUsername(username);

  if (!profile) {
    return null;
  }

  return mapPublicProfile(profile);
}
