import { AppError } from "@/lib/app-error";

export type ValidationIssue<TField extends string = string, TCode extends string = string> =
  Readonly<{
    code: TCode;
    field: TField;
    message: string;
  }>;

export class ValidationError<
  TField extends string = string,
  TCode extends string = string,
> extends AppError<"VALIDATION_ERROR"> {
  readonly issues: readonly ValidationIssue<TField, TCode>[];

  constructor(issues: readonly ValidationIssue<TField, TCode>[]) {
    super({
      code: "VALIDATION_ERROR",
      details: {
        issueCount: issues.length,
      },
      expose: true,
      message: "One or more validation errors occurred.",
      statusCode: 400,
    });

    this.issues = issues;
  }
}

export function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

export function normalizeUrl(value: string): string | undefined {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

export type ValidationCollector<TField extends string, TCode extends string> = Readonly<{
  add: (field: TField, code: TCode, message: string) => void;
  issues: () => readonly ValidationIssue<TField, TCode>[];
}>;

export function createValidationCollector<
  TField extends string,
  TCode extends string,
>(): ValidationCollector<TField, TCode> {
  const issues: ValidationIssue<TField, TCode>[] = [];

  return {
    add(field, code, message) {
      issues.push({
        code,
        field,
        message,
      });
    },
    issues() {
      return issues;
    },
  };
}

export function assertNoValidationIssues<
  TField extends string,
  TCode extends string,
>(issues: readonly ValidationIssue<TField, TCode>[]): void {
  if (issues.length > 0) {
    throw new ValidationError(issues);
  }
}
