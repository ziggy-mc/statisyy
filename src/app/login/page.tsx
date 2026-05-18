import Link from "next/link";

import { setCsrfCookie } from "@/lib/csrf";

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
  const csrfToken = await setCsrfCookie();
  const params = await searchParams;
  const rawError = params.error;
  const loggedOut = params.logged_out === "1";
  const errorCode = typeof rawError === "string" ? rawError : null;
  const errorMessage = readLoginError(errorCode);

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Log in</h1>
      <p className="text-sm">Access your account.</p>
      {loggedOut ? (
        <p className="border p-2 text-sm" role="status">
          You have been logged out.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="border border-red-500 p-2 text-sm" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <form action={loginAction} className="flex flex-col gap-3 border p-4">
        <input type="hidden" name="csrfToken" value={csrfToken.token} />
        <label className="flex flex-col gap-1 text-sm">
          Username or email
          <input
            name="usernameOrEmail"
            required
            autoComplete="username"
            className="border px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="border px-2 py-1"
          />
        </label>
        <button type="submit" className="border px-3 py-2 text-sm">
          Log in
        </button>
      </form>
      <p className="text-sm">
        Need an account? <Link href="/signup" className="underline">Sign up</Link>
      </p>
    </section>
  );
}
