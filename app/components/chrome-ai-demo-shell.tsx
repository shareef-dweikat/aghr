"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { checkApiAvailability } from "../lib/chrome-ai";

type ChromeAiDemoStatus =
  | "unsupported"
  | "unavailable"
  | "checking"
  | "downloading"
  | "ready"
  | "streaming"
  | "done"
  | "error";

type DestroyableSession = {
  destroy(): void;
};

type ChromeAiRunContext = {
  signal: AbortSignal;
  monitor: (monitor: EventTarget) => void;
  setSession: (session: DestroyableSession) => void;
};

export type ChromeAiStatusCopy = {
  unsupported: string;
  unavailable: string;
  checking: string;
  downloading: (progress: number) => string;
  ready: string;
  streaming: string;
  done: string;
  error: string;
};

const textareaClassName =
  "resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

const primaryButtonClassName =
  "rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

const secondaryButtonClassName =
  "rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

export function chromeAiStatusMessage(
  status: ChromeAiDemoStatus | null,
  downloadProgress: number | null,
  copy: ChromeAiStatusCopy,
  error?: string | null,
): string {
  if (error) {
    return error;
  }
  if (!status) {
    return "";
  }
  if (status === "downloading") {
    return copy.downloading(downloadProgress ?? 0);
  }
  return copy[status];
}

const BLOCKED_AVAILABILITY = new Set(["unsupported", "unavailable"]);
const DOWNLOAD_AVAILABILITY = new Set(["downloadable", "downloading"]);

async function beginChromeAiRun(
  apiId: string,
  setStatus: (status: ChromeAiDemoStatus) => void,
): Promise<boolean> {
  const availability = await checkApiAvailability(apiId);

  if (BLOCKED_AVAILABILITY.has(availability)) {
    setStatus(availability as ChromeAiDemoStatus);
    return false;
  }

  if (DOWNLOAD_AVAILABILITY.has(availability)) {
    setStatus("downloading");
  }

  return true;
}

function applyChromeAiRunError(
  err: unknown,
  setStatus: (status: ChromeAiDemoStatus) => void,
  setError: (message: string | null) => void,
): void {
  if (err instanceof DOMException && err.name === "AbortError") {
    return;
  }

  setStatus("error");
  setError(err instanceof Error ? err.message : "Unknown error");
}

export function useChromeAiRun(apiId: string) {
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<ChromeAiDemoStatus | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const sessionRef = useRef<DestroyableSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sessionRef.current?.destroy();
    sessionRef.current = null;
  }, []);

  const handleStop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const run = useCallback(
    async (
      execute: (ctx: ChromeAiRunContext) => Promise<AsyncIterable<string>>,
    ): Promise<boolean> => {
      cleanup();
      setOutput("");
      setError(null);
      setDownloadProgress(null);
      setIsRunning(true);
      setStatus("checking");

      try {
        const canContinue = await beginChromeAiRun(apiId, setStatus);
        if (!canContinue) {
          return false;
        }

        const controller = new AbortController();
        abortRef.current = controller;

        const stream = await execute({
          signal: controller.signal,
          monitor(m) {
            m.addEventListener("downloadprogress", (e: Event) => {
              const progress = (e as ProgressEvent).loaded;
              setDownloadProgress(Math.round(progress * 100));
            });
          },
          setSession(session) {
            sessionRef.current = session;
          },
        });

        setStatus("streaming");

        let text = "";
        for await (const chunk of stream) {
          text += chunk;
          setOutput(text);
        }

        setStatus("done");
        return true;
      } catch (err) {
        applyChromeAiRunError(err, setStatus, setError);
        return false;
      } finally {
        setIsRunning(false);
      }
    },
    [apiId, cleanup],
  );

  return {
    output,
    status,
    downloadProgress,
    error,
    isRunning,
    handleStop,
    run,
  };
}

function DemoStatusBanner({
  message,
  isWarning,
}: {
  message: string;
  isWarning: boolean;
}) {
  if (!message) {
    return null;
  }

  const className = isWarning
    ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
    : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400";

  return (
    <p className={`rounded-lg border px-4 py-3 text-sm ${className}`} role="status">
      {message}
    </p>
  );
}

function DemoActions({
  actionLabel,
  onAction,
  onStop,
  isRunning,
  canSubmit,
}: {
  actionLabel: string;
  onAction: () => void;
  onStop: () => void;
  isRunning: boolean;
  canSubmit: boolean;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onAction}
        disabled={isRunning || !canSubmit}
        className={primaryButtonClassName}
      >
        {isRunning ? "Running…" : actionLabel}
      </button>
      {isRunning ? (
        <button
          type="button"
          onClick={onStop}
          className={secondaryButtonClassName}
        >
          Stop
        </button>
      ) : null}
    </div>
  );
}

function DemoOutput({ label, output }: { label: string; output: string }) {
  if (!output) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        {output}
      </pre>
    </div>
  );
}

export function ChromeAiDemoShell({
  statusMessage,
  isWarningStatus,
  options,
  inputLabel,
  input,
  onInputChange,
  inputRows = 4,
  actionLabel,
  onAction,
  onStop,
  isRunning,
  canSubmit,
  output,
  outputLabel,
}: {
  statusMessage: string;
  isWarningStatus: boolean;
  options?: ReactNode;
  inputLabel: string;
  input: string;
  onInputChange: (value: string) => void;
  inputRows?: number;
  actionLabel: string;
  onAction: () => void;
  onStop: () => void;
  isRunning: boolean;
  canSubmit: boolean;
  output: string;
  outputLabel: string;
}) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6 px-6">
      <DemoStatusBanner message={statusMessage} isWarning={isWarningStatus} />
      {options}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {inputLabel}
        </span>
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={isRunning}
          rows={inputRows}
          className={textareaClassName}
        />
      </label>

      <DemoActions
        actionLabel={actionLabel}
        onAction={onAction}
        onStop={onStop}
        isRunning={isRunning}
        canSubmit={canSubmit}
      />
      <DemoOutput label={outputLabel} output={output} />
    </div>
  );
}
