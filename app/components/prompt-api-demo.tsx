"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import {
  ChromeAiDemoShell,
  chromeAiStatusMessage,
  useChromeAiRun,
  type ChromeAiStatusCopy,
} from "./chrome-ai-demo-shell";

const DEFAULT_PROMPT =
  "Write a short, friendly poem about building web apps with on-device AI.";

const STATUS_COPY: ChromeAiStatusCopy = {
  unsupported:
    "Prompt API is not available in this browser. Use Chrome 148+ on desktop and enable the feature flag.",
  unavailable:
    "Gemini Nano is unavailable on this device (hardware or OS requirements not met).",
  checking: "Checking model availability…",
  downloading: (progress) => `Downloading model… ${progress}%`,
  ready: "Model ready. Click Generate to run a prompt.",
  streaming: "Generating response…",
  done: "Done.",
  error: "Something went wrong.",
};

export function PromptApiDemo({ conversationId }: { conversationId?: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const conversationIdRef = useRef(conversationId);
  const {
    output,
    status,
    downloadProgress,
    error,
    isRunning,
    handleStop,
    run,
  } = useChromeAiRun("prompt");

  conversationIdRef.current = conversationId;

  const handleGenerate = useCallback(async () => {
    const ok = await run(async ({ signal, monitor, setSession }) => {
      const session = await LanguageModel.create({ monitor });
      setSession(session);
      return session.promptStreaming(prompt, { signal });
    });

    if (ok && conversationId !== conversationIdRef.current) {
      router.replace(`/chat/${conversationIdRef.current}`);
    }
  }, [conversationId, prompt, router, run]);

  return (
    <ChromeAiDemoShell
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
      inputLabel="Prompt"
      input={prompt}
      onInputChange={setPrompt}
      actionLabel="Generate"
      onAction={handleGenerate}
      onStop={handleStop}
      isRunning={isRunning}
      canSubmit={Boolean(prompt.trim())}
      output={output}
      outputLabel="Response"
    />
  );
}
