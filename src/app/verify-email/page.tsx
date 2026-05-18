import { setCsrfCookie } from "@/lib/csrf";

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
  const csrfToken = await setCsrfCookie();
  const params = await searchParams;
  const tokenParam = params.token;
  const errorParam = params.error;
  const defaultToken = typeof tokenParam === "string" ? tokenParam : "";
  const errorCode = typeof errorParam === "string" ? errorParam : null;
  const errorMessage = readVerifyError(errorCode);

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Verify email</h1>
      <p className="text-sm">Enter your verification token.</p>
      {errorMessage ? (
        <p className="border border-red-500 p-2 text-sm" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <form action={verifyEmailAction} className="flex flex-col gap-3 border p-4">
        <input type="hidden" name="csrfToken" value={csrfToken.token} />
        <label className="flex flex-col gap-1 text-sm">
          Token
          <input
            name="token"
            defaultValue={defaultToken}
            required
            className="border px-2 py-1"
          />
        </label>
        <button type="submit" className="border px-3 py-2 text-sm">
          Verify email
        </button>
      </form>
    </section>
  );
}
