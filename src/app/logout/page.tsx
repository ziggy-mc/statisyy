import { setCsrfCookie } from "@/lib/csrf";

import { logoutAction } from "@/features/auth/actions";

export default async function LogoutPage() {
  const csrfToken = await setCsrfCookie();

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Log out</h1>
      <form action={logoutAction} className="flex flex-col gap-3 border p-4">
        <input type="hidden" name="csrfToken" value={csrfToken.token} />
        <button type="submit" className="border px-3 py-2 text-sm">
          Confirm logout
        </button>
      </form>
    </section>
  );
}
