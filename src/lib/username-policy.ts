import {
  assertNoValidationIssues,
  createValidationCollector,
  normalizeRequiredString,
  type ValidationIssue,
} from "@/lib/validation";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/;

const RESERVED_USERNAMES = [
  "admin",
  "api",
  "app",
  "contact",
  "help",
  "login",
  "logout",
  "me",
  "new",
  "root",
  "settings",
  "signup",
  "support",
  "system",
  "www",
] as const;

export type UsernameIssueCode =
  | "invalid_format"
  | "invalid_type"
  | "required"
  | "reserved"
  | "too_long"
  | "too_short";

export type UsernameValidationIssue = ValidationIssue<
  "username",
  UsernameIssueCode
>;

export type UsernameValidationResult =
  | Readonly<{
      ok: true;
      value: string;
    }>
  | Readonly<{
      issues: readonly UsernameValidationIssue[];
      ok: false;
    }>;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function getReservedUsernames(
  additionalReservedUsernames?: Iterable<string>,
): Set<string> {
  const reservedUsernames = new Set<string>(RESERVED_USERNAMES);

  if (additionalReservedUsernames) {
    for (const username of additionalReservedUsernames) {
      reservedUsernames.add(normalizeUsername(username));
    }
  }

  return reservedUsernames;
}

export function validateUsername(
  value: unknown,
  additionalReservedUsernames?: Iterable<string>,
): UsernameValidationResult {
  const collector = createValidationCollector<"username", UsernameIssueCode>();
  const usernameValue = normalizeRequiredString(value);

  if (typeof value !== "string") {
    collector.add("username", "invalid_type", "Username must be a string.");
  } else if (!usernameValue) {
    collector.add("username", "required", "Username is required.");
  } else {
    const normalizedUsername = normalizeUsername(usernameValue);

    if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
      collector.add(
        "username",
        "too_short",
        `Username must be at least ${USERNAME_MIN_LENGTH} characters long.`,
      );
    }

    if (normalizedUsername.length > USERNAME_MAX_LENGTH) {
      collector.add(
        "username",
        "too_long",
        `Username must be at most ${USERNAME_MAX_LENGTH} characters long.`,
      );
    }

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      collector.add(
        "username",
        "invalid_format",
        "Username may only contain lowercase letters, numbers, and internal underscores.",
      );
    }

    if (getReservedUsernames(additionalReservedUsernames).has(normalizedUsername)) {
      collector.add(
        "username",
        "reserved",
        "Username is reserved and cannot be used.",
      );
    }

    const issues = collector.issues();

    if (issues.length === 0) {
      return {
        ok: true,
        value: normalizedUsername,
      };
    }
  }

  return {
    issues: collector.issues(),
    ok: false,
  };
}

export function parseUsername(
  value: unknown,
  additionalReservedUsernames?: Iterable<string>,
): string {
  const result = validateUsername(value, additionalReservedUsernames);

  if (result.ok) {
    return result.value;
  }

  assertNoValidationIssues(result.issues);
  return "";
}
