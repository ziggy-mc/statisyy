import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromCookies } from "@/lib/auth";
import { setCsrfCookie } from "@/lib/csrf";

import { logoutAction } from "@/features/auth/actions";
import { getAccountUser } from "@/features/auth/service";

type AccountPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  const [csrfToken, user, params] = await Promise.all([
    setCsrfCookie(),
    getAccountUser(session.userId),
    searchParams,
  ]);

  const verifiedNotice = params.verified === "1";

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Account</h1>
      {verifiedNotice ? (
        <p className="border p-2 text-sm" role="status">
          Email verified.
        </p>
      ) : null}
      <dl className="grid gap-2 border p-4 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="font-medium">Username</dt>
          <dd>{user.username}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="font-medium">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="font-medium">Email status</dt>
          <dd>{user.emailVerifiedAt ? "Verified" : "Not verified"}</dd>
        </div>
      </dl>
      {!user.emailVerifiedAt ? (
        <p className="text-sm">
          Your email is not verified. Use the verification token sent at signup on the{" "}
          <Link className="underline" href="/verify-email">
            verify email
          </Link>{" "}
          page.
        </p>
      ) : null}
      <form action={logoutAction} className="border p-4">
        <input type="hidden" name="csrfToken" value={csrfToken.token} />
        <button type="submit" className="border px-3 py-2 text-sm">
          Log out
        </button>
      </form>
    </section>
  );
}
