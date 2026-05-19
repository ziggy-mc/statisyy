import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "statisy",
  description: "Functional scaffold for statisy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
      <body className="min-h-full">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-neutral-300 focus:bg-white focus:px-3 focus:py-2 dark:focus:border-neutral-700 dark:focus:bg-neutral-900"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-neutral-200/80 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/85">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" aria-label="Return to homepage" className="text-base font-semibold tracking-tight">
                statisy
              </Link>
              <nav
                aria-label="Primary"
                className="flex flex-wrap items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
              >
                <Link href="/signup" className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                  Sign up
                </Link>
                <Link href="/login" className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                  Log in
                </Link>
                <Link href="/account" className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                  Account
                </Link>
                <Link href="/verify-email" className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                  Verify email
                </Link>
                <Link href="/logout" className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                  Log out
                </Link>
              </nav>
            </div>
          </header>
          <main
            id="main-content"
            className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
          >
            {children}
          </main>
          <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Temporary application shell</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
