"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  useChromeAiChatRun,
  type ChromeAiStatusCopy,
} from "./chrome-ai-demo-shell";
import { ChatComposer, ChatScreen } from "./chat-thread";
import { useChatConversationRoute } from "./use-chat-conversation-route";

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
] as const;

type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["code"];

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

const STATUS_COPY: ChromeAiStatusCopy = {
  unsupported:
    "Translator API is not available in this browser. Use Chrome 138+ on desktop.",
  unavailable:
    "Translator is unavailable for this language pair on this device.",
  checking: "Checking model availability…",
  downloading: (progress) => `Downloading language pack… ${progress}%`,
  ready: "Model ready. Enter text to translate.",
  streaming: "Translating…",
  done: "Done.",
  error: "Something went wrong.",
};

function TranslatorSettingsMenu({
  sourceLanguage,
  targetLanguage,
  disabled,
  onSourceChange,
  onTargetChange,
}: {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  disabled: boolean;
  onSourceChange: (value: LanguageCode) => void;
  onTargetChange: (value: LanguageCode) => void;
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
        aria-label="Translator settings"
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
          aria-label="Translator settings"
          className="absolute right-0 bottom-full z-20 mb-2 w-56 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
        >
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                From
              </span>
              <select
                value={sourceLanguage}
                onChange={(e) =>
                  onSourceChange(e.target.value as LanguageCode)
                }
                className={selectClassName}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                To
              </span>
              <select
                value={targetLanguage}
                onChange={(e) =>
                  onTargetChange(e.target.value as LanguageCode)
                }
                className={selectClassName}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
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

export function TranslatorApiDemo({
  conversationId,
}: {
  conversationId: string;
}) {
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("en");
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("es");
  const { ensureConversationRoute } = useChatConversationRoute({
    apiId: "translator",
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
    apiId: "translator",
    conversationId,
    statusCopy: STATUS_COPY,
  });

  const handleTranslate = useCallback(() => {
    const title = input.trim();
    void run(
      async (text, ctx) => {
        ctx.getSession()?.destroy();
        ctx.setSession(null);

        const session = await Translator.create({
          sourceLanguage,
          targetLanguage,
          signal: ctx.signal,
          monitor: ctx.monitor,
        });
        ctx.setSession(session);

        return session.translateStreaming(text, {
          signal: ctx.signal,
        });
      },
      {
        onComplete(nextMessages) {
          ensureConversationRoute(title, nextMessages);
        },
      },
    );
  }, [
    ensureConversationRoute,
    input,
    run,
    sourceLanguage,
    targetLanguage,
  ]);

  return (
    <ChatScreen
      messages={messages}
      emptyLabel="Enter text to translate"
      statusMessage={statusMessage}
      isWarningStatus={isWarningStatus}
    >
      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={handleTranslate}
        onStop={handleStop}
        isRunning={isRunning}
        canSubmit={Boolean(input.trim()) && sourceLanguage !== targetLanguage}
        placeholder="Text to translate"
        submitLabel="Translate"
        accessory={
          <TranslatorSettingsMenu
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            disabled={isRunning}
            onSourceChange={setSourceLanguage}
            onTargetChange={setTargetLanguage}
          />
        }
      />
    </ChatScreen>
  );
}
