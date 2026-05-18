import { NextResponse } from "next/server";

import { asAppError } from "@/lib/app-error";
import { ValidationError } from "@/lib/validation";

type ApiError = Readonly<{
  code: string;
  message: string;
}>;

type ApiErrorFallback = Readonly<{
  code: string;
  message: string;
}>;

export function profileErrorResponse(
  error: unknown,
  fallback: ApiErrorFallback,
): NextResponse<{ error: ApiError }> {
  if (error instanceof ValidationError) {
    const firstIssue = error.issues[0];

    return NextResponse.json(
      {
        error: {
          code: firstIssue?.code ?? "VALIDATION_ERROR",
          message: firstIssue?.message ?? "Request validation failed.",
        },
      },
      {
        status: 400,
      },
    );
  }

  const appError = asAppError(error, {
    code: fallback.code,
    message: fallback.message,
    statusCode: 500,
  });

  return NextResponse.json(
    {
      error: {
        code: appError.code,
        message: appError.expose ? appError.message : fallback.message,
      },
    },
    {
      status: appError.statusCode,
    },
  );
}
