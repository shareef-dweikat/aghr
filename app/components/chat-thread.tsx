"use client";

import {
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const fieldShellClassName =
  "flex min-h-[44px] flex-1 items-end rounded-lg border border-zinc-300 bg-white focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-zinc-500 dark:focus-within:ring-zinc-800";

const textareaInFieldClassName =
  "max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none disabled:opacity-60 dark:text-zinc-100";

const textareaClassName =
  "max-h-40 min-h-[44px] flex-1 resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

const primaryButtonClassName =
  "shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

const secondaryButtonClassName =
  "shrink-0 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

export function ChatMessageList({
  messages,
  emptyLabel,
}: {
  messages: ChatMessage[];
  emptyLabel: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-6 sm:px-6">
      {messages.map((message, index) => {
        const isUser = message.role === "user";

        return (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                isUser
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              {message.content || (isUser ? "" : "…")}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

export function ChatStatusBanner({
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
    <p
      className={`rounded-lg border px-3 py-2 text-sm ${className}`}
      role="status"
    >
      {message}
    </p>
  );
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isRunning,
  canSubmit,
  placeholder,
  submitLabel = "Send",
  accessory,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isRunning: boolean;
  canSubmit: boolean;
  placeholder: string;
  submitLabel?: string;
  accessory?: ReactNode;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isRunning && canSubmit) {
      onSubmit();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isRunning && canSubmit) {
        onSubmit();
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black sm:px-6"
    >
      {accessory ? (
        <div className={fieldShellClassName}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            rows={1}
            placeholder={placeholder}
            aria-label={placeholder}
            className={textareaInFieldClassName}
          />
          <div className="flex shrink-0 items-center self-end pb-1 pr-1">
            {accessory}
          </div>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          rows={1}
          placeholder={placeholder}
          aria-label={placeholder}
          className={textareaClassName}
        />
      )}
      {isRunning ? (
        <button type="button" onClick={onStop} className={secondaryButtonClassName}>
          Stop
        </button>
      ) : (
        <button
          type="submit"
          disabled={!canSubmit}
          className={primaryButtonClassName}
        >
          {submitLabel}
        </button>
      )}
    </form>
  );
}
