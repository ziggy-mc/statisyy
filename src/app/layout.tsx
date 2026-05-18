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
    <html lang="en" className="h-full bg-neutral-100 text-neutral-900 antialiased">
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-neutral-300 bg-neutral-100">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <Link href="/" className="text-base font-semibold">
                statisy
              </Link>
              <p className="text-sm text-neutral-700">Scaffold</p>
            </div>
          </header>
          <main
            id="main-content"
            className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8"
          >
            {children}
          </main>
          <footer className="border-t border-neutral-300 bg-neutral-100">
            <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
              <p className="text-xs text-neutral-600">Temporary application shell</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
