import Link from "next/link";

import { setCsrfCookie } from "@/lib/csrf";

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
  const csrfToken = await setCsrfCookie();
  const params = await searchParams;
  const rawError = params.error;
  const errorCode = typeof rawError === "string" ? rawError : null;
  const errorMessage = readErrorMessage(errorCode);

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Sign up</h1>
      <p className="text-sm">Create an account.</p>
      {errorMessage ? (
        <p className="border border-red-500 p-2 text-sm" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <form action={signupAction} className="flex flex-col gap-3 border p-4">
        <input type="hidden" name="csrfToken" value={csrfToken.token} />
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input name="username" required className="border px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required className="border px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="border px-2 py-1"
          />
        </label>
        <button type="submit" className="border px-3 py-2 text-sm">
          Create account
        </button>
      </form>
      <p className="text-sm">
        Already have an account? <Link href="/login" className="underline">Log in</Link>
      </p>
    </section>
  );
}
