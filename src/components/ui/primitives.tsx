import type { ComponentPropsWithoutRef, ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function PageSection({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn("mx-auto flex w-full max-w-md flex-col gap-5 sm:gap-6", className)}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-5",
        className,
      )}
      {...props}
    />
  );
}

export function Heading({
  className,
  ...props
}: ComponentPropsWithoutRef<"h1">) {
  return (
    <h1
      className={cn("text-2xl font-semibold tracking-tight text-balance", className)}
      {...props}
    />
  );
}

export function Subheading({
  className,
  ...props
}: ComponentPropsWithoutRef<"h2">) {
  return <h2 className={cn("text-base font-semibold tracking-tight", className)} {...props} />;
}

export function BodyText({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return <p className={cn("text-sm text-neutral-600 dark:text-neutral-300", className)} {...props} />;
}

export function Label({
  className,
  ...props
}: ComponentPropsWithoutRef<"label">) {
  return <label className={cn("flex flex-col gap-1.5 text-sm font-medium", className)} {...props} />;
}

export function Input({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none ring-0 transition focus-visible:border-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:border-neutral-500 dark:focus-visible:ring-neutral-700",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus-visible:border-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:border-neutral-500 dark:focus-visible:ring-neutral-700",
        className,
      )}
      {...props}
    />
  );
}

type ButtonVariant = "primary" | "secondary" | "danger";

export function Button({
  className,
  variant = "primary",
  ...props
}: ComponentPropsWithoutRef<"button"> & Readonly<{ variant?: ButtonVariant }>) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70",
        variant === "primary" &&
          "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-400 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-neutral-600",
        variant === "secondary" &&
          "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:ring-neutral-700",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-300 dark:bg-red-700 dark:hover:bg-red-600 dark:focus-visible:ring-red-900",
        className,
      )}
      {...props}
    />
  );
}

type AlertTone = "error" | "info" | "success";

export function Alert({
  children,
  className,
  tone = "info",
  ...props
}: ComponentPropsWithoutRef<"p"> &
  Readonly<{ children: ReactNode; tone?: AlertTone }>) {
  return (
    <p
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        tone === "info" &&
          "border-neutral-300 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-100",
        tone === "success" &&
          "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
        tone === "error" &&
          "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
