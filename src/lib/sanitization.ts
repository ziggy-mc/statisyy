const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/g;
const UNSAFE_MARKUP_CHARACTER_PATTERN = /[<>]/g;

export function sanitizePlainText(value: string): string {
  return value
    .replace(CONTROL_CHARACTER_PATTERN, "")
    .replace(UNSAFE_MARKUP_CHARACTER_PATTERN, "")
    .trim();
}

export function sanitizeOptionalPlainText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const sanitizedValue = sanitizePlainText(value);

  return sanitizedValue.length > 0 ? sanitizedValue : undefined;
}
