import { AppError } from "@/lib/app-error";
import {
  createValidationCollector,
  isRecord,
  normalizeOptionalString,
  ValidationError,
  type ValidationIssue,
} from "@/lib/validation";
import { validateUsername, type UsernameIssueCode } from "@/lib/username-policy";

const EMAIL_MAX_LENGTH = 320;
const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 256;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignupInput = Readonly<{
  email: string;
  password: string;
  username: string;
}>;

export type LoginInput = Readonly<{
  password: string;
  usernameOrEmail: string;
}>;

type SignupField = keyof SignupInput;

type SignupIssueCode =
  | UsernameIssueCode
  | "invalid_email"
  | "invalid_type"
  | "password_too_long"
  | "password_too_short"
  | "required";

type LoginField = keyof LoginInput;

type LoginIssueCode = "invalid_type" | "required";

export type SignupValidationIssue = ValidationIssue<SignupField, SignupIssueCode>;
export type LoginValidationIssue = ValidationIssue<LoginField, LoginIssueCode>;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function parseSignupInput(value: unknown): SignupInput {
  if (!isRecord(value)) {
    throw new AppError({
      code: "INVALID_SIGNUP_INPUT",
      message: "Signup input must be an object.",
      statusCode: 400,
    });
  }

  const collector = createValidationCollector<SignupField, SignupIssueCode>();
  const usernameResult = validateUsername(value.username);

  if (!usernameResult.ok) {
    for (const issue of usernameResult.issues) {
      collector.add(issue.field, issue.code, issue.message);
    }
  }

  const normalizedEmailValue = normalizeOptionalString(value.email);

  if (typeof value.email !== "string") {
    collector.add("email", "invalid_type", "Email must be a string.");
  } else if (!normalizedEmailValue) {
    collector.add("email", "required", "Email is required.");
  } else {
    const email = normalizeEmail(normalizedEmailValue);

    if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
      collector.add("email", "invalid_email", "Email address is invalid.");
    }
  }

  const rawPassword = value.password;

  if (typeof rawPassword !== "string") {
    collector.add("password", "invalid_type", "Password must be a string.");
  } else if (rawPassword.length < PASSWORD_MIN_LENGTH) {
    collector.add(
      "password",
      "password_too_short",
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    );
  } else if (rawPassword.length > PASSWORD_MAX_LENGTH) {
    collector.add(
      "password",
      "password_too_long",
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters long.`,
    );
  }

  const issues = collector.issues();

  if (issues.length > 0 || !usernameResult.ok || !normalizedEmailValue) {
    throw new ValidationError(issues);
  }

  if (typeof rawPassword !== "string") {
    throw new AppError({
      code: "INVALID_SIGNUP_INPUT",
      message: "Password must be a string.",
      statusCode: 400,
    });
  }

  return {
    email: normalizeEmail(normalizedEmailValue),
    password: rawPassword,
    username: usernameResult.value,
  };
}

export function parseLoginInput(value: unknown): LoginInput {
  if (!isRecord(value)) {
    throw new AppError({
      code: "INVALID_LOGIN_INPUT",
      message: "Login input must be an object.",
      statusCode: 400,
    });
  }

  const collector = createValidationCollector<LoginField, LoginIssueCode>();
  const usernameOrEmail = normalizeOptionalString(value.usernameOrEmail);

  if (typeof value.usernameOrEmail !== "string") {
    collector.add(
      "usernameOrEmail",
      "invalid_type",
      "Username or email must be a string.",
    );
  } else if (!usernameOrEmail) {
    collector.add("usernameOrEmail", "required", "Username or email is required.");
  }

  const rawPassword = value.password;

  if (typeof rawPassword !== "string") {
    collector.add("password", "invalid_type", "Password must be a string.");
  } else if (rawPassword.length < 1) {
    collector.add("password", "required", "Password is required.");
  }

  const issues = collector.issues();

  if (issues.length > 0 || !usernameOrEmail) {
    throw new ValidationError(issues);
  }

  if (typeof rawPassword !== "string") {
    throw new AppError({
      code: "INVALID_LOGIN_INPUT",
      message: "Password must be a string.",
      statusCode: 400,
    });
  }

  return {
    password: rawPassword,
    usernameOrEmail,
  };
}

export function normalizeLoginIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function parseVerificationToken(value: unknown): string {
  const token = normalizeOptionalString(value);

  if (!token) {
    throw new AppError({
      code: "INVALID_VERIFICATION_TOKEN",
      message: "Verification token is required.",
      statusCode: 400,
    });
  }

  return token;
}
