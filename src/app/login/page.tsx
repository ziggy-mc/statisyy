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
import { loginAction } from "@/features/auth/actions";

type LoginPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const LOGIN_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  INVALID_CREDENTIALS: "Username/email or password is incorrect.",
  VALIDATION_ERROR: "Please provide both fields.",
};

function readLoginError(errorCode: string | null): string | null {
  if (!errorCode) {
    return null;
  }

  return LOGIN_ERROR_MESSAGES[errorCode] ?? "Login failed. Please try again.";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  try {
    const csrfToken = await setCsrfCookie();
    const params = await searchParams;
    const rawError = params.error;
    const loggedOut = params.logged_out === "1";
    const errorCode = typeof rawError === "string" ? rawError : null;
    const errorMessage = readLoginError(errorCode);

    return (
      <PageSection>
        <Heading>Log in</Heading>
        <BodyText>Access your account.</BodyText>
        {loggedOut ? (
          <Alert tone="success" role="status">
            You have been logged out.
          </Alert>
        ) : null}
        {errorMessage ? (
          <Alert tone="error" role="alert">
            {errorMessage}
          </Alert>
        ) : null}
        <Card>
          <form action={loginAction} className="flex flex-col gap-4">
            <input type="hidden" name="csrfToken" value={csrfToken.token} />
            <Label>
              Username or email
              <Input
                name="usernameOrEmail"
                required
                autoComplete="username"
              />
            </Label>
            <Label>
              Password
              <Input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </Label>
            <Button type="submit">
              Log in
            </Button>
          </form>
        </Card>
        <BodyText>
          Need an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
          >
            Sign up
          </Link>
        </BodyText>
      </PageSection>
    );
  } catch (error: unknown) {
    const appError = asAppError(error, {
      code: "LOGIN_PAGE_LOAD_FAILED",
      message: "Unable to load login page.",
      statusCode: 500,
    });

    console.debug("[page] login render failed", {
      code: appError.code,
      statusCode: appError.statusCode,
    });

    return (
      <PageSection>
        <Heading>Log in</Heading>
        <Alert tone="error" role="alert">
          Unable to load login right now. ({appError.code})
        </Alert>
      </PageSection>
    );
  }
}
