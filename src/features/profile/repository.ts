import { ObjectId, type Collection } from "mongodb";

import { AppError } from "@/lib/app-error";
import { getMongoDb } from "@/lib/mongodb";
import type { ValidatedProfileInput } from "@/lib/profile-validation";

export type ProfileDocument = Readonly<{
  _id: ObjectId;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  displayName: string | null;
  ownerId: ObjectId;
  publishedAt: Date | null;
  updatedAt: Date;
  username: string;
  websiteUrl: string | null;
}>;

type ProfileCollections = Readonly<{
  profiles: Collection<ProfileDocument>;
}>;

type SaveProfileDraftInput = Readonly<{
  now: Date;
  ownerId: string;
  profile: ValidatedProfileInput;
}>;

type SetProfilePublishedStateInput = Readonly<{
  now: Date;
  ownerId: string;
  published: boolean;
}>;

declare global {
  var __statisyyProfileIndexesReady: Promise<void> | undefined;
}

let profileIndexesReadyPromise = globalThis.__statisyyProfileIndexesReady;

function mapProfileDocument(document: ProfileDocument): ProfileDocument {
  return {
    ...document,
  };
}

function toOwnerObjectId(ownerId: string): ObjectId {
  if (!ObjectId.isValid(ownerId)) {
    throw new AppError({
      code: "INVALID_USER_ID",
      message: "User identifier is invalid.",
      statusCode: 400,
    });
  }

  return new ObjectId(ownerId);
}

async function getProfileCollections(): Promise<ProfileCollections> {
  const db = await getMongoDb();

  return {
    profiles: db.collection<ProfileDocument>("profiles"),
  };
}

async function ensureProfileIndexes(): Promise<void> {
  if (!profileIndexesReadyPromise) {
    profileIndexesReadyPromise = (async () => {
      const { profiles } = await getProfileCollections();

      await profiles.createIndexes([
        {
          key: { ownerId: 1 },
          name: "profiles_owner_id_unique",
          unique: true,
        },
        {
          key: { username: 1 },
          name: "profiles_username_unique",
          unique: true,
        },
        {
          key: { username: 1, publishedAt: 1 },
          name: "profiles_public_lookup",
        },
      ]);
    })().catch((error: unknown) => {
      profileIndexesReadyPromise = undefined;
      globalThis.__statisyyProfileIndexesReady = undefined;

      throw new AppError({
        cause: error,
        code: "DATABASE_INDEX_ERROR",
        message: "Unable to initialize profile database indexes.",
        statusCode: 500,
      });
    });
  }

  globalThis.__statisyyProfileIndexesReady = profileIndexesReadyPromise;

  await profileIndexesReadyPromise;
}

export async function findProfileByOwnerId(
  ownerId: string,
): Promise<ProfileDocument | null> {
  const ownerObjectId = toOwnerObjectId(ownerId);

  await ensureProfileIndexes();

  const { profiles } = await getProfileCollections();
  const document = await profiles.findOne({ ownerId: ownerObjectId });

  return document ? mapProfileDocument(document) : null;
}

export async function findPublicProfileByUsername(
  username: string,
): Promise<ProfileDocument | null> {
  await ensureProfileIndexes();

  const { profiles } = await getProfileCollections();
  const document = await profiles.findOne({
    publishedAt: { $ne: null },
    username,
  });

  return document ? mapProfileDocument(document) : null;
}

export async function saveProfileDraft(
  input: SaveProfileDraftInput,
): Promise<ProfileDocument> {
  const ownerObjectId = toOwnerObjectId(input.ownerId);

  await ensureProfileIndexes();

  const { profiles } = await getProfileCollections();

  try {
    const updatedDocument = await profiles.findOneAndUpdate(
      {
        ownerId: ownerObjectId,
      },
      {
        $set: {
          avatarUrl: input.profile.avatarUrl,
          bio: input.profile.bio,
          displayName: input.profile.displayName,
          updatedAt: input.now,
          username: input.profile.username,
          websiteUrl: input.profile.websiteUrl,
        },
        $setOnInsert: {
          createdAt: input.now,
          publishedAt: null,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
      },
    );

    if (!updatedDocument) {
      throw new AppError({
        code: "DATABASE_WRITE_ERROR",
        message: "Profile was not persisted correctly.",
        statusCode: 500,
      });
    }

    return mapProfileDocument(updatedDocument);
  } catch (error: unknown) {
    throw new AppError({
      cause: error,
      code: "DATABASE_WRITE_ERROR",
      message: "Unable to save profile draft.",
      statusCode: 500,
    });
  }
}

export async function setProfilePublishedState(
  input: SetProfilePublishedStateInput,
): Promise<ProfileDocument | null> {
  const ownerObjectId = toOwnerObjectId(input.ownerId);

  await ensureProfileIndexes();

  const { profiles } = await getProfileCollections();

  const document = await profiles.findOneAndUpdate(
    {
      ownerId: ownerObjectId,
    },
    {
      $set: {
        publishedAt: input.published ? input.now : null,
        updatedAt: input.now,
      },
    },
    {
      returnDocument: "after",
    },
  );

  return document ? mapProfileDocument(document) : null;
}
