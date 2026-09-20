"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  useChromeAiChatRun,
  type ChromeAiStatusCopy,
} from "./chrome-ai-demo-shell";
import { ChatComposer, ChatScreen } from "./chat-thread";
import { useChatConversationRoute } from "./use-chat-conversation-route";

const TONE_OPTIONS: RewriterTone[] = ["as-is", "more-formal", "more-casual"];

const LENGTH_OPTIONS: RewriterLength[] = ["as-is", "shorter", "longer"];

const FORMAT_OPTIONS: RewriterFormat[] = ["as-is", "markdown", "plain-text"];

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

const STATUS_COPY: ChromeAiStatusCopy = {
  unsupported:
    "Rewriter API is not available in this browser. Use Chrome with the Rewriter flag enabled.",
  unavailable:
    "Rewriter is unavailable on this device (hardware or OS requirements not met).",
  checking: "Checking model availability…",
  downloading: (progress) => `Downloading model… ${progress}%`,
  ready: "Model ready. Paste text to rewrite.",
  streaming: "Rewriting…",
  done: "Done.",
  error: "Something went wrong.",
};

function RewriterSettingsMenu({
  tone,
  length,
  format,
  disabled,
  onToneChange,
  onLengthChange,
  onFormatChange,
}: {
  tone: RewriterTone;
  length: RewriterLength;
  format: RewriterFormat;
  disabled: boolean;
  onToneChange: (value: RewriterTone) => void;
  onLengthChange: (value: RewriterLength) => void;
  onFormatChange: (value: RewriterFormat) => void;
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
        aria-label="Rewriter settings"
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
          aria-label="Rewriter settings"
          className="absolute right-0 bottom-full z-20 mb-2 w-56 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
        >
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Tone
              </span>
              <select
                value={tone}
                onChange={(e) => onToneChange(e.target.value as RewriterTone)}
                className={selectClassName}
              >
                {TONE_OPTIONS.map((option) => (
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
                  onLengthChange(e.target.value as RewriterLength)
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
                  onFormatChange(e.target.value as RewriterFormat)
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

export function RewriterApiDemo({
  conversationId,
}: {
  conversationId: string;
}) {
  const [tone, setTone] = useState<RewriterTone>("as-is");
  const [length, setLength] = useState<RewriterLength>("as-is");
  const [format, setFormat] = useState<RewriterFormat>("as-is");
  const { ensureConversationRoute } = useChatConversationRoute({
    apiId: "rewriter",
    conversationId,
  });

  const {
    input,
    setInput,
    messages,
    isRunning,
    handleStop,
    run,
    statusMessage,
    isWarningStatus,
  } = useChromeAiChatRun({
    apiId: "rewriter",
    conversationId,
    statusCopy: STATUS_COPY,
  });

  const handleRewrite = useCallback(() => {
    const title = input.trim();
    void run(
      async (text, ctx) => {
        ctx.getSession()?.destroy();
        ctx.setSession(null);

        const session = await Rewriter.create({
          tone,
          format,
          length,
          expectedInputLanguages: ["en"],
          signal: ctx.signal,
          monitor: ctx.monitor,
        });
        ctx.setSession(session);

        return session.rewriteStreaming(text, {
          signal: ctx.signal,
        });
      },
      {
        onComplete(nextMessages) {
          ensureConversationRoute(title, nextMessages);
        },
      },
    );
  }, [ensureConversationRoute, format, input, length, run, tone]);

  return (
    <ChatScreen
      messages={messages}
      emptyLabel="Paste text to rewrite"
      statusMessage={statusMessage}
      isWarningStatus={isWarningStatus}
    >
      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={handleRewrite}
        onStop={handleStop}
        isRunning={isRunning}
        canSubmit={Boolean(input.trim())}
        placeholder="Text to rewrite"
        submitLabel="Rewrite"
        accessory={
          <RewriterSettingsMenu
            tone={tone}
            length={length}
            format={format}
            disabled={isRunning}
            onToneChange={setTone}
            onLengthChange={setLength}
            onFormatChange={setFormat}
          />
        }
      />
    </ChatScreen>
  );
}
