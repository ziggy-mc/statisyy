export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">statisy</h1>
      <p className="text-sm">
        Functional scaffold for a Next.js 16 application using TypeScript, App
        Router, and Tailwind CSS v4.
      </p>
      <section className="grid gap-2 border p-4" aria-label="Scaffold status">
        <p className="text-sm">Status: ready for feature implementation.</p>
      </section>
    </main>
  );
}
