"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";

export type EnableGuideStep = {
  text: string;
  url?: string;
};

export type EnableGuideCopy = {
  title: string;
  close: string;
  intro: string;
  steps: EnableGuideStep[];
  downloadNote: string;
  copy: string;
  copied: string;
  docsLink: string;
  docsHref: string;
};

type EnableChromeAiModalProps = {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  copy: EnableGuideCopy;
};

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through — URL remains visible for manual copy.
  }
  return false;
}

function CopyableUrl({
  url,
  copyLabel,
  copiedLabel,
}: {
  url: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <code className="break-all rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
        {url}
      </code>
      <button
        type="button"
        className="rounded border border-zinc-300 px-2 py-0.5 text-xs text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        onClick={() => {
          void copyText(url).then((ok) => {
            if (ok) {
              setCopied(true);
            }
          });
        }}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

export function EnableChromeAiModal({
  open,
  onClose,
  returnFocusRef,
  copy,
}: EnableChromeAiModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        returnFocusRef.current?.focus();
      }
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[min(90vh,40rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {copy.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-zinc-300 px-2.5 py-1 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {copy.close}
          </button>
        </div>

        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          {copy.intro}
        </p>

        <ol className="mb-4 list-decimal space-y-3 pl-5 text-sm text-zinc-800 dark:text-zinc-200">
          {copy.steps.map((step) => (
            <li key={`${step.text}-${step.url ?? ""}`}>
              <span>{step.text}</span>
              {step.url ? (
                <CopyableUrl
                  url={step.url}
                  copyLabel={copy.copy}
                  copiedLabel={copy.copied}
                />
              ) : null}
            </li>
          ))}
        </ol>

        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          {copy.downloadNote}
        </p>

        <a
          href={copy.docsHref}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
        >
          {copy.docsLink}
        </a>
      </div>
    </div>
  );
}
