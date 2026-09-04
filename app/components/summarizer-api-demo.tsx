"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { checkApiAvailability } from "../lib/chrome-ai";
import {
  chromeAiStatusMessage,
  type ChromeAiStatusCopy,
} from "./chrome-ai-demo-shell";
import {
  ChatComposer,
  ChatMessageList,
  ChatStatusBanner,
  type ChatMessage,
} from "./chat-thread";

type ChromeAiDemoStatus =
  | "unsupported"
  | "unavailable"
  | "checking"
  | "downloading"
  | "ready"
  | "streaming"
  | "done"
  | "error";

const TYPE_OPTIONS: SummarizerType[] = [
  "key-points",
  "tldr",
  "teaser",
  "headline",
];

const LENGTH_OPTIONS: SummarizerLength[] = ["short", "medium", "long"];

const FORMAT_OPTIONS: SummarizerFormat[] = ["markdown", "plain-text"];

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

const STATUS_COPY: ChromeAiStatusCopy = {
  unsupported:
    "Summarizer API is not available in this browser. Use Chrome 138+ on desktop.",
  unavailable:
    "Summarizer is unavailable on this device (hardware or OS requirements not met).",
  checking: "Checking model availability…",
  downloading: (progress) => `Downloading model… ${progress}%`,
  ready: "Model ready. Paste text to summarize.",
  streaming: "Generating summary…",
  done: "Done.",
  error: "Something went wrong.",
};

const BLOCKED_AVAILABILITY = new Set(["unsupported", "unavailable"]);
const DOWNLOAD_AVAILABILITY = new Set(["downloadable", "downloading"]);

function SummarizerSettingsMenu({
  type,
  length,
  format,
  disabled,
  onTypeChange,
  onLengthChange,
  onFormatChange,
}: {
  type: SummarizerType;
  length: SummarizerLength;
  format: SummarizerFormat;
  disabled: boolean;
  onTypeChange: (value: SummarizerType) => void;
  onLengthChange: (value: SummarizerLength) => void;
  onFormatChange: (value: SummarizerFormat) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Summarizer settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 ${
          open ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" : ""
        }`}
      >
        <span className="-mt-1 text-lg leading-none tracking-widest" aria-hidden="true">
          ···
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Summarizer settings"
          className="absolute right-0 bottom-full z-20 mb-2 w-56 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
        >
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Type
              </span>
              <select
                value={type}
                onChange={(e) => onTypeChange(e.target.value as SummarizerType)}
                className={selectClassName}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Length
              </span>
              <select
                value={length}
                onChange={(e) =>
                  onLengthChange(e.target.value as SummarizerLength)
                }
                className={selectClassName}
              >
                {LENGTH_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Format
              </span>
              <select
                value={format}
                onChange={(e) =>
                  onFormatChange(e.target.value as SummarizerFormat)
                }
                className={selectClassName}
              >
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SummarizerApiDemo() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [type, setType] = useState<SummarizerType>("key-points");
  const [length, setLength] = useState<SummarizerLength>("medium");
  const [format, setFormat] = useState<SummarizerFormat>("markdown");
  const [status, setStatus] = useState<ChromeAiDemoStatus | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const sessionRef = useRef<SummarizerSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, []);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
  }, []);

  const handleSummarize = useCallback(async () => {
    const text = input.trim();
    if (!text || isRunning) {
      return;
    }

    setInput("");
    setError(null);
    setDownloadProgress(null);
    setIsRunning(true);
    setStatus("checking");

    setMessages((current) => [
      ...current,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);

    try {
      const availability = await checkApiAvailability("summarizer");

      if (BLOCKED_AVAILABILITY.has(availability)) {
        setStatus(availability as ChromeAiDemoStatus);
        setMessages((current) => current.slice(0, -2));
        return;
      }

      if (DOWNLOAD_AVAILABILITY.has(availability)) {
        setStatus("downloading");
      }

      const controller = new AbortController();
      abortRef.current = controller;

      sessionRef.current?.destroy();
      sessionRef.current = null;

      const session = await Summarizer.create({
        type,
        format,
        length,
        expectedInputLanguages: ["en"],
        signal: controller.signal,
        monitor(m) {
          m.addEventListener("downloadprogress", (e: Event) => {
            const progress = (e as ProgressEvent).loaded;
            setDownloadProgress(Math.round(progress * 100));
          });
        },
      });
      sessionRef.current = session;

      setStatus("streaming");

      const stream = session.summarizeStreaming(text, {
        signal: controller.signal,
      });

      let summary = "";
      for await (const chunk of stream) {
        summary += chunk;
        const snapshot = summary;
        setMessages((current) => {
          if (current.length === 0) {
            return current;
          }
          const next = current.slice();
          next[next.length - 1] = { role: "assistant", content: snapshot };
          return next;
        });
      }

      setStatus("done");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [format, input, isRunning, length, type]);

  const rawStatusMessage = chromeAiStatusMessage(
    status,
    downloadProgress,
    STATUS_COPY,
    error,
  );
  const statusMessage =
    status === "done" || status === "ready" ? "" : rawStatusMessage;
  const isWarningStatus =
    status === "error" ||
    status === "unsupported" ||
    status === "unavailable";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatMessageList
        messages={messages}
        emptyLabel="Paste text to summarize"
      />

      <div className="px-4 pt-2 sm:px-6">
        <ChatStatusBanner
          message={statusMessage}
          isWarning={isWarningStatus}
        />
      </div>

      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={handleSummarize}
        onStop={handleStop}
        isRunning={isRunning}
        canSubmit={Boolean(input.trim())}
        placeholder="Text to summarize"
        submitLabel="Summarize"
        accessory={
          <SummarizerSettingsMenu
            type={type}
            length={length}
            format={format}
            disabled={isRunning}
            onTypeChange={setType}
            onLengthChange={setLength}
            onFormatChange={setFormat}
          />
        }
      />
    </div>
  );
}
