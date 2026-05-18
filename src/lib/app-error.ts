export type AppErrorDetailValue = boolean | null | number | string;

export type AppErrorDetails = Readonly<Record<string, AppErrorDetailValue>>;

export type AppErrorInit<TCode extends string> = Readonly<{
  cause?: unknown;
  code: TCode;
  details?: AppErrorDetails;
  expose?: boolean;
  message: string;
  statusCode: number;
}>;

export class AppError<TCode extends string = string> extends Error {
  readonly code: TCode;
  readonly details?: AppErrorDetails;
  readonly expose: boolean;
  override readonly name = "AppError";
  readonly statusCode: number;

  constructor(init: AppErrorInit<TCode>) {
    super(init.message, { cause: init.cause });

    this.code = init.code;
    this.details = init.details;
    this.expose = init.expose ?? init.statusCode < 500;
    this.statusCode = init.statusCode;
  }
}

export function isAppError(value: unknown): value is AppError<string> {
  return value instanceof AppError;
}

export function asAppError(
  error: unknown,
  fallback: AppErrorInit<string>,
): AppError<string> {
  if (isAppError(error)) {
    return error;
  }

  return new AppError({
    ...fallback,
    cause: error,
  });
}
