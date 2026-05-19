import { AppError } from "@/lib/app-error";

export async function parseJsonBodyOrEmpty(request: Request): Promise<unknown> {
  const bodyText = await request.text();

  if (bodyText.trim().length === 0) {
    return {};
  }

  try {
    return JSON.parse(bodyText) as unknown;
  } catch (error: unknown) {
    throw new AppError({
      cause: error,
      code: "INVALID_JSON_BODY",
      message: "Request body must be valid JSON.",
      statusCode: 400,
    });
  }
}
