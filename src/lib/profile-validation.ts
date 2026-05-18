import {
  createValidationCollector,
  isRecord,
  normalizeUrl,
  ValidationError,
  type ValidationIssue,
} from "@/lib/validation";
import { sanitizeOptionalPlainText } from "@/lib/sanitization";
import {
  validateUsername,
  type UsernameIssueCode,
} from "@/lib/username-policy";

export const PROFILE_DISPLAY_NAME_MAX_LENGTH = 80;
export const PROFILE_BIO_MAX_LENGTH = 160;
export const PROFILE_WEBSITE_MAX_LENGTH = 2_048;
export const PROFILE_AVATAR_URL_MAX_LENGTH = 2_048;

const ALLOWED_AVATAR_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

export type ProfileInput = Readonly<{
  avatarUrl?: string | null;
  bio?: string | null;
  displayName?: string | null;
  username: string;
  websiteUrl?: string | null;
}>;

export type ValidatedProfileInput = Readonly<{
  avatarUrl: string | null;
  bio: string | null;
  displayName: string | null;
  username: string;
  websiteUrl: string | null;
}>;

export type ProfileField = keyof ProfileInput;

export type ProfileIssueCode =
  | UsernameIssueCode
  | "invalid_avatar_url"
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

const PROFILE_FIELD_LABELS: Readonly<Record<ProfileField, string>> = {
  avatarUrl: "Avatar URL",
  bio: "Bio",
  displayName: "Display name",
  username: "Username",
  websiteUrl: "Website URL",
};

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
    collector.add(
      field,
      "invalid_type",
      `${PROFILE_FIELD_LABELS[field]} must be a string.`,
    );
    return null;
  }

  const normalizedValue = sanitizeOptionalPlainText(rawValue);

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > maxLength) {
    collector.add(
      field,
      "too_long",
      `${PROFILE_FIELD_LABELS[field]} must be at most ${maxLength} characters long.`,
    );
  }

  return normalizedValue;
}

function hasAllowedAvatarExtension(pathname: string): boolean {
  if (!pathname) {
    return true;
  }

  const normalizedPathname = pathname.toLowerCase();
  const extensionStart = normalizedPathname.lastIndexOf(".");

  if (extensionStart < 0) {
    return true;
  }

  const extension = normalizedPathname.slice(extensionStart);

  return ALLOWED_AVATAR_EXTENSIONS.has(extension);
}

function validateAvatarUrl(
  avatarInput: string | null,
  collector: ReturnType<
    typeof createValidationCollector<ProfileField, ProfileIssueCode>
  >,
): string | null {
  if (avatarInput === null) {
    return null;
  }

  const normalizedAvatarUrl = normalizeUrl(avatarInput);

  if (normalizedAvatarUrl === undefined) {
    collector.add(
      "avatarUrl",
      "invalid_avatar_url",
      "Avatar URL must be a valid HTTP or HTTPS URL.",
    );
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedAvatarUrl);

    if (!hasAllowedAvatarExtension(parsedUrl.pathname)) {
      collector.add(
        "avatarUrl",
        "invalid_avatar_url",
        "Avatar URL must end with a supported image extension.",
      );
      return null;
    }
  } catch {
    collector.add(
      "avatarUrl",
      "invalid_avatar_url",
      "Avatar URL must be a valid HTTP or HTTPS URL.",
    );
    return null;
  }

  return normalizedAvatarUrl;
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
  const avatarInput = validateBoundedOptionalString(
    value.avatarUrl,
    "avatarUrl",
    PROFILE_AVATAR_URL_MAX_LENGTH,
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

  const avatarUrl = validateAvatarUrl(avatarInput, collector);

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
      avatarUrl,
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

  if (!result.ok) {
    throw new ValidationError(result.issues);
  }

  return result.value;
}
