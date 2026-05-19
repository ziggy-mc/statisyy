import { asAppError } from "@/lib/app-error";
import Link from "next/link";

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
import { signupAction } from "@/features/auth/actions";

type SignupPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const SIGNUP_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  EMAIL_ALREADY_EXISTS: "That email is already in use.",
  USERNAME_ALREADY_EXISTS: "That username is already in use.",
  VALIDATION_ERROR: "Please correct the form values.",
};

function readErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) {
    return null;
  }

  return SIGNUP_ERROR_MESSAGES[errorCode] ?? "Signup failed. Please try again.";
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  let csrfTokenValue = "";
  let errorMessage: string | null = null;
  let loadErrorCode: string | null = null;

  try {
    const csrfToken = await setCsrfCookie();
    const params = await searchParams;
    const rawError = params.error;
    const errorCode = typeof rawError === "string" ? rawError : null;
    errorMessage = readErrorMessage(errorCode);
    csrfTokenValue = csrfToken.token;
  } catch (error: unknown) {
    const appError = asAppError(error, {
      code: "SIGNUP_PAGE_LOAD_FAILED",
      message: "Unable to load signup page.",
      statusCode: 500,
    });

    console.debug("[page] signup render failed", {
      code: appError.code,
      statusCode: appError.statusCode,
    });
    loadErrorCode = appError.code;
  }

  if (loadErrorCode) {
    return (
      <PageSection>
        <Heading>Sign up</Heading>
        <Alert tone="error" role="alert">
          Unable to load signup right now. ({loadErrorCode})
        </Alert>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Heading>Sign up</Heading>
      <BodyText>Create an account.</BodyText>
      {errorMessage ? (
        <Alert tone="error" role="alert">
          {errorMessage}
        </Alert>
      ) : null}
      <Card>
        <form action={signupAction} className="flex flex-col gap-4">
          <input type="hidden" name="csrfToken" value={csrfTokenValue} />
          <Label>
            Username
            <Input name="username" required />
          </Label>
          <Label>
            Email
            <Input name="email" type="email" required />
          </Label>
          <Label>
            Password
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </Label>
          <Button type="submit">
            Create account
          </Button>
        </form>
      </Card>
      <BodyText>
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
        >
          Log in
        </Link>
      </BodyText>
    </PageSection>
  );
}
