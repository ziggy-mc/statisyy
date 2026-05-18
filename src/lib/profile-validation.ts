import {
  assertNoValidationIssues,
  createValidationCollector,
  isRecord,
  normalizeOptionalString,
  normalizeUrl,
  type ValidationIssue,
} from "@/lib/validation";
import {
  validateUsername,
  type UsernameIssueCode,
} from "@/lib/username-policy";

export const PROFILE_DISPLAY_NAME_MAX_LENGTH = 80;
export const PROFILE_BIO_MAX_LENGTH = 160;
export const PROFILE_WEBSITE_MAX_LENGTH = 2_048;

export type ProfileInput = Readonly<{
  bio?: string | null;
  displayName?: string | null;
  username: string;
  websiteUrl?: string | null;
}>;

export type ValidatedProfileInput = Readonly<{
  bio: string | null;
  displayName: string | null;
  username: string;
  websiteUrl: string | null;
}>;

export type ProfileField = keyof ProfileInput;

export type ProfileIssueCode =
  | UsernameIssueCode
  | "invalid_type"
  | "too_long"
  | "invalid_url";

export type ProfileValidationIssue = ValidationIssue<ProfileField, ProfileIssueCode>;

export type ProfileValidationResult =
  | Readonly<{
      ok: true;
      value: ValidatedProfileInput;
    }>
  | Readonly<{
      issues: readonly ProfileValidationIssue[];
      ok: false;
    }>;

function validateBoundedOptionalString(
  rawValue: unknown,
  field: Exclude<ProfileField, "username">,
  maxLength: number,
  collector: ReturnType<
    typeof createValidationCollector<ProfileField, ProfileIssueCode>
  >,
): string | null {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  if (typeof rawValue !== "string") {
    collector.add(field, "invalid_type", `${field} must be a string.`);
    return null;
  }

  const normalizedValue = normalizeOptionalString(rawValue);

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > maxLength) {
    collector.add(
      field,
      "too_long",
      `${field} must be at most ${maxLength} characters long.`,
    );
  }

  return normalizedValue;
}

export function validateProfileInput(
  value: unknown,
  additionalReservedUsernames?: Iterable<string>,
): ProfileValidationResult {
  const collector = createValidationCollector<ProfileField, ProfileIssueCode>();

  if (!isRecord(value)) {
    collector.add("username", "invalid_type", "Profile input must be an object.");

    return {
      issues: collector.issues(),
      ok: false,
    };
  }

  const usernameResult = validateUsername(
    value.username,
    additionalReservedUsernames,
  );

  if (!usernameResult.ok) {
    for (const issue of usernameResult.issues) {
      collector.add(issue.field, issue.code, issue.message);
    }
  }

  const displayName = validateBoundedOptionalString(
    value.displayName,
    "displayName",
    PROFILE_DISPLAY_NAME_MAX_LENGTH,
    collector,
  );
  const bio = validateBoundedOptionalString(
    value.bio,
    "bio",
    PROFILE_BIO_MAX_LENGTH,
    collector,
  );
  const websiteInput = validateBoundedOptionalString(
    value.websiteUrl,
    "websiteUrl",
    PROFILE_WEBSITE_MAX_LENGTH,
    collector,
  );

  const websiteUrl =
    websiteInput === null ? null : normalizeUrl(websiteInput) ?? null;

  if (websiteInput !== null && websiteUrl === null) {
    collector.add(
      "websiteUrl",
      "invalid_url",
      "Website URL must be a valid HTTP or HTTPS URL.",
    );
  }

  const issues = collector.issues();

  if (issues.length > 0 || !usernameResult.ok) {
    return {
      issues,
      ok: false,
    };
  }

  return {
    ok: true,
    value: {
      bio,
      displayName,
      username: usernameResult.value,
      websiteUrl,
    },
  };
}

export function parseProfileInput(
  value: unknown,
  additionalReservedUsernames?: Iterable<string>,
): ValidatedProfileInput {
  const result = validateProfileInput(value, additionalReservedUsernames);

  if (result.ok) {
    return result.value;
  }

  assertNoValidationIssues(result.issues);
  return {
    bio: null,
    displayName: null,
    username: "",
    websiteUrl: null,
  };
}
