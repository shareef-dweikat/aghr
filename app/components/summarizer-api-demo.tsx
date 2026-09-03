"use client";

import { useCallback, useState } from "react";

import {
  ChromeAiDemoShell,
  chromeAiStatusMessage,
  useChromeAiRun,
  type ChromeAiStatusCopy,
} from "./chrome-ai-demo-shell";

const DEFAULT_INPUT = `On-device AI is changing how web apps handle language tasks. Instead of sending every prompt to a remote server, browsers can run compact models locally once they have been downloaded.

That shift brings privacy benefits because user text never leaves the device. It also reduces latency for short tasks like summarizing articles, rewriting paragraphs, or detecting language.

There are trade-offs. Models still need enough disk space and hardware, and the first download can take time. Feature availability also depends on the browser and operating system.

For developers, APIs such as Summarizer, Writer, and Prompt make these capabilities accessible through familiar JavaScript patterns: check availability, create a session, then stream results back to the UI.`;

const TYPE_OPTIONS: SummarizerType[] = [
  "key-points",
  "tldr",
  "teaser",
  "headline",
];

const LENGTH_OPTIONS: SummarizerLength[] = ["short", "medium", "long"];

const FORMAT_OPTIONS: SummarizerFormat[] = ["markdown", "plain-text"];

const selectClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

const STATUS_COPY: ChromeAiStatusCopy = {
  unsupported:
    "Summarizer API is not available in this browser. Use Chrome 138+ on desktop.",
  unavailable:
    "Summarizer is unavailable on this device (hardware or OS requirements not met).",
  checking: "Checking model availability…",
  downloading: (progress) => `Downloading model… ${progress}%`,
  ready: "Model ready. Click Summarize to run.",
  streaming: "Generating summary…",
  done: "Done.",
  error: "Something went wrong.",
  idle: "Click Summarize to generate a summary.",
};

export function SummarizerApiDemo() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [type, setType] = useState<SummarizerType>("key-points");
  const [length, setLength] = useState<SummarizerLength>("medium");
  const [format, setFormat] = useState<SummarizerFormat>("markdown");
  const {
    output,
    status,
    downloadProgress,
    error,
    isRunning,
    handleStop,
    run,
  } = useChromeAiRun("summarizer");

  const handleSummarize = useCallback(async () => {
    await run(async ({ signal, monitor, setSession }) => {
      const session = await Summarizer.create({
        type,
        format,
        length,
        expectedInputLanguages: ["en"],
        monitor,
      });
      setSession(session);
      return session.summarizeStreaming(input, { signal });
    });
  }, [format, input, length, run, type]);

  return (
    <ChromeAiDemoShell
      title="Chrome Summarizer API"
      apiSymbol="Summarizer"
      subtitlePrefix="On-device summarization via"
      statusMessage={chromeAiStatusMessage(
        status,
        downloadProgress,
        STATUS_COPY,
        error,
      )}
      isWarningStatus={
        status === "error" ||
        status === "unsupported" ||
        status === "unavailable"
      }
      options={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Type
            </span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as SummarizerType)}
              disabled={isRunning}
              className={selectClassName}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Length
            </span>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as SummarizerLength)}
              disabled={isRunning}
              className={selectClassName}
            >
              {LENGTH_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Format
            </span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as SummarizerFormat)}
              disabled={isRunning}
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
      }
      inputLabel="Text to summarize"
      input={input}
      onInputChange={setInput}
      inputRows={8}
      actionLabel="Summarize"
      onAction={handleSummarize}
      onStop={handleStop}
      isRunning={isRunning}
      canSubmit={Boolean(input.trim())}
      output={output}
      outputLabel="Summary"
    />
  );
}
