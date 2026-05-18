import { createHash } from "node:crypto";

import { ObjectId, type Collection } from "mongodb";

import { AppError } from "@/lib/app-error";
import { getMongoDb } from "@/lib/mongodb";

export type AuthUserDocument = Readonly<{
  _id: ObjectId;
  createdAt: Date;
  email: string;
  emailVerifiedAt: Date | null;
  passwordHash: string;
  passwordSalt: string;
  updatedAt: Date;
  username: string;
}>;

type NewAuthUser = Readonly<{
  email: string;
  now: Date;
  passwordHash: string;
  passwordSalt: string;
  username: string;
}>;

type EmailVerificationDocument = Readonly<{
  _id: ObjectId;
  createdAt: Date;
  expiresAt: Date;
  tokenHash: string;
  usedAt: Date | null;
  userId: ObjectId;
}>;

type AuthCollections = Readonly<{
  users: Collection<AuthUserDocument>;
  verificationTokens: Collection<EmailVerificationDocument>;
}>;

declare global {
  var __statisyyAuthIndexesReady: Promise<void> | undefined;
}

let authIndexesReadyPromise = globalThis.__statisyyAuthIndexesReady;

function mapUserDocument(document: AuthUserDocument): AuthUserDocument {
  return {
    ...document,
  };
}

async function getAuthCollections(): Promise<AuthCollections> {
  const db = await getMongoDb();

  return {
    users: db.collection<AuthUserDocument>("auth_users"),
    verificationTokens: db.collection<EmailVerificationDocument>(
      "auth_email_verification_tokens",
    ),
  };
}

async function ensureAuthIndexes(): Promise<void> {
  if (!authIndexesReadyPromise) {
    authIndexesReadyPromise = (async () => {
      const { users, verificationTokens } = await getAuthCollections();

      await users.createIndexes([
        {
          key: { email: 1 },
          name: "auth_users_email_unique",
          unique: true,
        },
        {
          key: { username: 1 },
          name: "auth_users_username_unique",
          unique: true,
        },
      ]);

      await verificationTokens.createIndexes([
        {
          key: { expiresAt: 1 },
          expireAfterSeconds: 0,
          name: "auth_email_verification_tokens_expires_ttl",
        },
        {
          key: { tokenHash: 1 },
          name: "auth_email_verification_tokens_token_hash_unique",
          unique: true,
        },
        {
          key: { userId: 1, usedAt: 1 },
          name: "auth_email_verification_tokens_user_status",
        },
      ]);
    })().catch((error: unknown) => {
      authIndexesReadyPromise = undefined;
      globalThis.__statisyyAuthIndexesReady = undefined;

      throw new AppError({
        cause: error,
        code: "DATABASE_INDEX_ERROR",
        message: "Unable to initialize auth database indexes.",
        statusCode: 500,
      });
    });
  }

  globalThis.__statisyyAuthIndexesReady = authIndexesReadyPromise;

  await authIndexesReadyPromise;
}

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAuthUser(input: NewAuthUser): Promise<AuthUserDocument> {
  await ensureAuthIndexes();

  const { users } = await getAuthCollections();
  const document: Omit<AuthUserDocument, "_id"> = {
    createdAt: input.now,
    email: input.email,
    emailVerifiedAt: null,
    passwordHash: input.passwordHash,
    passwordSalt: input.passwordSalt,
    updatedAt: input.now,
    username: input.username,
  };

  try {
    const result = await users.insertOne(document as AuthUserDocument);
    const createdUser = await users.findOne({ _id: result.insertedId });

    if (!createdUser) {
      throw new AppError({
        code: "DATABASE_WRITE_ERROR",
        message: "User was not persisted correctly.",
        statusCode: 500,
      });
    }

    return mapUserDocument(createdUser);
  } catch (error) {
    throw new AppError({
      cause: error,
      code: "DATABASE_WRITE_ERROR",
      message: "Unable to create user account.",
      statusCode: 500,
    });
  }
}

export async function findAuthUserByUsernameOrEmail(
  usernameOrEmail: string,
): Promise<AuthUserDocument | null> {
  await ensureAuthIndexes();

  const { users } = await getAuthCollections();
  const document = await users.findOne({
    $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
  });

  return document ? mapUserDocument(document) : null;
}

export async function findAuthUserById(userId: string): Promise<AuthUserDocument | null> {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  await ensureAuthIndexes();

  const { users } = await getAuthCollections();
  const document = await users.findOne({ _id: new ObjectId(userId) });

  return document ? mapUserDocument(document) : null;
}

export async function createEmailVerificationToken(input: {
  expiresAt: Date;
  now: Date;
  tokenHash: string;
  userId: string;
}): Promise<void> {
  if (!ObjectId.isValid(input.userId)) {
    throw new AppError({
      code: "INVALID_USER_ID",
      message: "User identifier is invalid.",
      statusCode: 400,
    });
  }

  await ensureAuthIndexes();

  const { verificationTokens } = await getAuthCollections();

  await verificationTokens.insertOne({
    _id: new ObjectId(),
    createdAt: input.now,
    expiresAt: input.expiresAt,
    tokenHash: input.tokenHash,
    usedAt: null,
    userId: new ObjectId(input.userId),
  });
}

export async function consumeEmailVerificationToken(input: {
  now: Date;
  tokenHash: string;
}): Promise<{ userId: string } | null> {
  await ensureAuthIndexes();

  const { verificationTokens } = await getAuthCollections();
  const tokenRecord = await verificationTokens.findOne({
    expiresAt: { $gt: input.now },
    tokenHash: input.tokenHash,
    usedAt: null,
  });

  if (!tokenRecord) {
    return null;
  }

  const updateResult = await verificationTokens.updateOne(
    {
      _id: tokenRecord._id,
      usedAt: null,
    },
    {
      $set: { usedAt: input.now },
    },
  );

  if (updateResult.modifiedCount !== 1) {
    return null;
  }

  return {
    userId: tokenRecord.userId.toHexString(),
  };
}

export async function markUserEmailVerified(input: {
  now: Date;
  userId: string;
}): Promise<void> {
  if (!ObjectId.isValid(input.userId)) {
    throw new AppError({
      code: "INVALID_USER_ID",
      message: "User identifier is invalid.",
      statusCode: 400,
    });
  }

  await ensureAuthIndexes();

  const { users } = await getAuthCollections();

  await users.updateOne(
    {
      _id: new ObjectId(input.userId),
    },
    {
      $set: {
        emailVerifiedAt: input.now,
        updatedAt: input.now,
      },
    },
  );
}
