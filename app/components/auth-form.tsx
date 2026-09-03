"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, FormEvent, ReactNode } from "react";

const fieldClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

type AuthFieldProps = ComponentProps<"input"> & {
  label: string;
};

export function AuthField({ label, ...props }: AuthFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <input {...props} className={fieldClassName} />
    </label>
  );
}

type AuthFormCopy = {
  title: string;
  subtitle: string;
  submit: string;
};

type AuthFormProps = {
  copy: AuthFormCopy;
  footerPrompt: string;
  footerHref: string;
  footerLink: string;
  children: ReactNode;
};

export function AuthForm({
  copy,
  footerPrompt,
  footerHref,
  footerLink,
  children,
}: AuthFormProps) {
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/");
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-5">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {copy.title}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.subtitle}</p>
      </header>

      {children}

      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {copy.submit}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {footerPrompt}{" "}
        <Link
          href={footerHref}
          className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
        >
          {footerLink}
        </Link>
      </p>
    </form>
  );
}
