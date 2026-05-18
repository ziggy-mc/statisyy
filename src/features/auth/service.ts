import { AppError } from "@/lib/app-error";
import { createTokenId } from "@/lib/signed-token";

import { hashPassword, verifyPassword } from "@/features/auth/password";
import {
  consumeEmailVerificationToken,
  createAuthUser,
  createEmailVerificationToken,
  findAuthUserById,
  findAuthUserByUsernameOrEmail,
  hashVerificationToken,
  markUserEmailVerified,
} from "@/features/auth/repository";
import {
  normalizeLoginIdentifier,
  parseLoginInput,
  parseSignupInput,
  parseVerificationToken,
  type LoginInput,
  type SignupInput,
} from "@/features/auth/validation";

const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;

export type AuthUser = Readonly<{
  email: string;
  emailVerifiedAt: Date | null;
  id: string;
  username: string;
}>;

function toAuthUser(document: {
  _id: { toHexString: () => string };
  email: string;
  emailVerifiedAt: Date | null;
  username: string;
}): AuthUser {
  return {
    email: document.email,
    emailVerifiedAt: document.emailVerifiedAt,
    id: document._id.toHexString(),
    username: document.username,
  };
}

async function assertUsernameAndEmailAreAvailable(input: SignupInput): Promise<void> {
  const existingByUsername = await findAuthUserByUsernameOrEmail(input.username);

  if (existingByUsername && existingByUsername.username === input.username) {
    throw new AppError({
      code: "USERNAME_ALREADY_EXISTS",
      message: "Username is already in use.",
      statusCode: 409,
    });
  }

  const existingByEmail = await findAuthUserByUsernameOrEmail(input.email);

  if (existingByEmail && existingByEmail.email === input.email) {
    throw new AppError({
      code: "EMAIL_ALREADY_EXISTS",
      message: "Email is already in use.",
      statusCode: 409,
    });
  }
}

export async function signupUser(rawInput: unknown): Promise<{
  user: AuthUser;
  verificationToken: string;
}> {
  const input = parseSignupInput(rawInput);

  await assertUsernameAndEmailAreAvailable(input);

  const now = new Date();
  const hashedPassword = await hashPassword(input.password);

  const user = await createAuthUser({
    email: input.email,
    now,
    passwordHash: hashedPassword.hash,
    passwordSalt: hashedPassword.salt,
    username: input.username,
  });

  const verificationToken = createTokenId(24);

  await createEmailVerificationToken({
    expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
    now,
    tokenHash: hashVerificationToken(verificationToken),
    userId: user._id.toHexString(),
  });

  return {
    user: toAuthUser(user),
    verificationToken,
  };
}

export async function loginUser(rawInput: unknown): Promise<AuthUser> {
  const input: LoginInput = parseLoginInput(rawInput);
  const identifier = normalizeLoginIdentifier(input.usernameOrEmail);
  const user = await findAuthUserByUsernameOrEmail(identifier);

  if (!user) {
    throw new AppError({
      code: "INVALID_CREDENTIALS",
      message: "Invalid credentials.",
      statusCode: 401,
    });
  }

  const isPasswordValid = await verifyPassword(
    input.password,
    user.passwordSalt,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError({
      code: "INVALID_CREDENTIALS",
      message: "Invalid credentials.",
      statusCode: 401,
    });
  }

  return toAuthUser(user);
}

export async function verifyEmailToken(rawToken: unknown): Promise<{ userId: string }> {
  const token = parseVerificationToken(rawToken);
  const now = new Date();
  const consumedToken = await consumeEmailVerificationToken({
    now,
    tokenHash: hashVerificationToken(token),
  });

  if (!consumedToken) {
    throw new AppError({
      code: "INVALID_VERIFICATION_TOKEN",
      message: "Verification token is invalid or expired.",
      statusCode: 400,
    });
  }

  await markUserEmailVerified({
    now,
    userId: consumedToken.userId,
  });

  return {
    userId: consumedToken.userId,
  };
}

export async function getAccountUser(userId: string): Promise<AuthUser> {
  const user = await findAuthUserById(userId);

  if (!user) {
    throw new AppError({
      code: "USER_NOT_FOUND",
      message: "User account no longer exists.",
      statusCode: 404,
    });
  }

  return toAuthUser(user);
}
