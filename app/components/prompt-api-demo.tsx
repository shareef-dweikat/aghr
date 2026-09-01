"use client";

import { useCallback, useRef, useState } from "react";

type Status =
  | "unsupported"
  | "unavailable"
  | "idle"
  | "checking"
  | "downloading"
  | "ready"
  | "streaming"
  | "done"
  | "error";

const DEFAULT_PROMPT =
  "Write a short, friendly poem about building web apps with on-device AI.";

function statusLabel(status: Status, downloadProgress: number | null): string {
  switch (status) {
    case "unsupported":
      return "Prompt API is not available in this browser. Use Chrome 148+ on desktop and enable the feature flag.";
    case "unavailable":
      return "Gemini Nano is unavailable on this device (hardware or OS requirements not met).";
    case "checking":
      return "Checking model availability…";
    case "downloading":
      return `Downloading model… ${downloadProgress ?? 0}%`;
    case "ready":
      return "Model ready. Click Generate to run a prompt.";
    case "streaming":
      return "Generating response…";
    case "done":
      return "Done.";
    case "error":
      return "Something went wrong.";
    default:
      return "Click Generate to check availability and run the Prompt API.";
  }
}

export function PromptApiDemo() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<LanguageModelSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sessionRef.current?.destroy();
    sessionRef.current = null;
  }, []);

  const handleGenerate = useCallback(async () => {
    cleanup();
    setOutput("");
    setError(null);
    setDownloadProgress(null);

    if (!("LanguageModel" in window)) {
      setStatus("unsupported");
      return;
    }

    setStatus("checking");

    try {
      const availability = await LanguageModel.availability({
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
      });

      if (availability === "unavailable") {
        setStatus("unavailable");
        return;
      }

      if (availability === "downloadable" || availability === "downloading") {
        setStatus("downloading");
      }

      const session = await LanguageModel.create({
        monitor(m) {
          m.addEventListener("downloadprogress", (e: Event) => {
            const progress = (e as ProgressEvent).loaded;
            setDownloadProgress(Math.round(progress * 100));
          });
        },
      });

      sessionRef.current = session;
      setStatus("streaming");

      const controller = new AbortController();
      abortRef.current = controller;

      const stream = session.promptStreaming(prompt, {
        signal: controller.signal,
      });

      let text = "";
      for await (const chunk of stream) {
        text += chunk;
        setOutput(text);
      }

      setStatus("done");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [cleanup, prompt]);

  const handleStop = useCallback(() => {
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  const isRunning = status === "checking" || status === "downloading" || status === "streaming";

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6 px-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Chrome Prompt API
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          On-device Gemini Nano via{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
            LanguageModel
          </code>
        </p>
      </header>

      <p
        className={`rounded-lg border px-4 py-3 text-sm ${
          status === "error" || status === "unsupported" || status === "unavailable"
            ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
            : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
        }`}
        role="status"
      >
        {error ?? statusLabel(status, downloadProgress)}
      </p>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Prompt
        </span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isRunning}
          rows={4}
          className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
        />
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isRunning || !prompt.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isRunning ? "Running…" : "Generate"}
        </button>
        {isRunning && (
          <button
            type="button"
            onClick={handleStop}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Stop
          </button>
        )}
      </div>

      {output && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Response
          </span>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
