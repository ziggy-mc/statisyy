import Link from "next/link";

import { BodyText, Card, Heading, Subheading } from "@/components/ui/primitives";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6">
      <Heading>statisy</Heading>
      <BodyText>
        Functional scaffold for a Next.js 16 application using TypeScript, App
        Router, and Tailwind CSS v4.
      </BodyText>
      <Card className="grid gap-2" aria-label="Scaffold status">
        <BodyText className="text-neutral-700 dark:text-neutral-200">
          Status: ready for feature implementation.
        </BodyText>
      </Card>
      <Card className="grid gap-3" aria-label="Authentication routes">
        <Subheading>Authentication</Subheading>
        <ul className="grid gap-2 text-sm">
          <li>
            <Link
              href="/signup"
              className="inline-flex rounded-md border border-neutral-300 bg-white px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              /signup
            </Link>
          </li>
          <li>
            <Link
              href="/login"
              className="inline-flex rounded-md border border-neutral-300 bg-white px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              /login
            </Link>
          </li>
          <li>
            <Link
              href="/verify-email"
              className="inline-flex rounded-md border border-neutral-300 bg-white px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              /verify-email
            </Link>
          </li>
          <li>
            <Link
              href="/account"
              className="inline-flex rounded-md border border-neutral-300 bg-white px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              /account
            </Link>
          </li>
        </ul>
      </Card>
    </section>
  );
}
