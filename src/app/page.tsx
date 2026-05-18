import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">statisy</h1>
      <p className="text-sm">
        Functional scaffold for a Next.js 16 application using TypeScript, App
        Router, and Tailwind CSS v4.
      </p>
      <section className="grid gap-2 border p-4" aria-label="Scaffold status">
        <p className="text-sm">Status: ready for feature implementation.</p>
      </section>
      <section className="grid gap-2 border p-4" aria-label="Authentication routes">
        <p className="text-sm font-medium">Authentication</p>
        <ul className="grid gap-1 text-sm">
          <li>
            <Link href="/signup" className="underline">
              /signup
            </Link>
          </li>
          <li>
            <Link href="/login" className="underline">
              /login
            </Link>
          </li>
          <li>
            <Link href="/verify-email" className="underline">
              /verify-email
            </Link>
          </li>
          <li>
            <Link href="/account" className="underline">
              /account
            </Link>
          </li>
        </ul>
      </section>
    </section>
  );
}
