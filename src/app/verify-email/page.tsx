import { asAppError } from "@/lib/app-error";
import { setCsrfCookie } from "@/lib/csrf";

import {
  Alert,
  BodyText,
  Button,
  Card,
  Heading,
  Input,
  Label,
  PageSection,
} from "@/components/ui/primitives";
import { verifyEmailAction } from "@/features/auth/actions";

type VerifyEmailPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const VERIFY_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  INVALID_VERIFICATION_TOKEN: "Verification token is invalid or expired.",
};

function readVerifyError(errorCode: string | null): string | null {
  if (!errorCode) {
    return null;
  }

  return VERIFY_ERROR_MESSAGES[errorCode] ?? "Unable to verify email.";
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  let csrfTokenValue = "";
  let defaultToken = "";
  let errorMessage: string | null = null;
  let loadErrorCode: string | null = null;

  try {
    const csrfToken = await setCsrfCookie();
    const params = await searchParams;
    const tokenParam = params.token;
    const errorParam = params.error;
    defaultToken = typeof tokenParam === "string" ? tokenParam : "";
    const errorCode = typeof errorParam === "string" ? errorParam : null;
    errorMessage = readVerifyError(errorCode);
    csrfTokenValue = csrfToken.token;
  } catch (error: unknown) {
    const appError = asAppError(error, {
      code: "VERIFY_EMAIL_PAGE_LOAD_FAILED",
      message: "Unable to load verify email page.",
      statusCode: 500,
    });

    console.debug("[page] verify-email render failed", {
      code: appError.code,
      statusCode: appError.statusCode,
    });
    loadErrorCode = appError.code;
  }

  if (loadErrorCode) {
    return (
      <PageSection>
        <Heading>Verify email</Heading>
        <Alert tone="error" role="alert">
          Unable to load email verification right now. ({loadErrorCode})
        </Alert>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Heading>Verify email</Heading>
      <BodyText>Enter your verification token.</BodyText>
      {errorMessage ? (
        <Alert tone="error" role="alert">
          {errorMessage}
        </Alert>
      ) : null}
      <Card>
        <form action={verifyEmailAction} className="flex flex-col gap-4">
          <input type="hidden" name="csrfToken" value={csrfTokenValue} />
          <Label>
            Token
            <Input
              name="token"
              defaultValue={defaultToken}
              required
            />
          </Label>
          <Button type="submit">
            Verify email
          </Button>
        </form>
      </Card>
    </PageSection>
  );
}
