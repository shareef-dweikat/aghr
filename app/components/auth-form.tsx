"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";

import { AuthError } from "../lib/auth/types";
import { safeNextPath } from "../lib/auth/safe-next-path";
import { LinkButton } from "./link-button";

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
  onSubmit: (formData: FormData) => Promise<void>;
};

export function AuthForm({
  copy,
  footerPrompt,
  footerHref,
  footerLink,
  children,
  onSubmit,
}: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const next = searchParams.get("next");
  const footerHrefWithNext = next
    ? `${footerHref}?next=${encodeURIComponent(next)}`
    : footerHref;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      await onSubmit(formData);
      router.replace(safeNextPath(searchParams.get("next")));
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {copy.title}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.subtitle}</p>
      </header>

      {children}

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {copy.submit}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {footerPrompt}{" "}
        <LinkButton
          href={footerHrefWithNext}
          className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
        >
          {footerLink}
        </LinkButton>
      </p>
    </form>
  );
}
