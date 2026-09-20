"use client";

import { useCallback } from "react";

import {
  useChromeAiChatRun,
  type ChromeAiStatusCopy,
} from "./chrome-ai-demo-shell";
import { ChatComposer, ChatScreen } from "./chat-thread";
import { useChatConversationRoute } from "./use-chat-conversation-route";

const STATUS_COPY: ChromeAiStatusCopy = {
  unsupported:
    "Language Detector API is not available in this browser. Use Chrome 138+ on desktop.",
  unavailable:
    "Language Detector is unavailable on this device (hardware or OS requirements not met).",
  checking: "Checking model availability…",
  downloading: (progress) => `Downloading model… ${progress}%`,
  ready: "Model ready. Enter text to detect its language.",
  streaming: "Detecting…",
  done: "Done.",
  error: "Something went wrong.",
};

const TOP_RESULTS = 5;

async function* singleChunk(text: string): AsyncIterable<string> {
  yield text;
}

function formatDetectionResults(results: LanguageDetectionResult[]): string {
  if (results.length === 0) {
    return "No language detected.";
  }

  return results
    .slice(0, TOP_RESULTS)
    .map((result) => {
      const percent = (result.confidence * 100).toFixed(1);
      return `${result.detectedLanguage} — ${percent}%`;
    })
    .join("\n");
}

export function LanguageDetectorApiDemo({
  conversationId,
}: {
  conversationId: string;
}) {
  const { ensureConversationRoute } = useChatConversationRoute({
    apiId: "language-detector",
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
    apiId: "language-detector",
    conversationId,
    statusCopy: STATUS_COPY,
  });

  const handleDetect = useCallback(() => {
    const title = input.trim();
    void run(
      async (text, ctx) => {
        ctx.getSession()?.destroy();
        ctx.setSession(null);

        const session = await LanguageDetector.create({
          signal: ctx.signal,
          monitor: ctx.monitor,
        });
        ctx.setSession(session);

        const results = await session.detect(text);
        return singleChunk(formatDetectionResults(results));
      },
      {
        onComplete(nextMessages) {
          ensureConversationRoute(title, nextMessages);
        },
      },
    );
  }, [ensureConversationRoute, input, run]);

  return (
    <ChatScreen
      messages={messages}
      emptyLabel="Enter text to detect its language"
      statusMessage={statusMessage}
      isWarningStatus={isWarningStatus}
    >
      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={handleDetect}
        onStop={handleStop}
        isRunning={isRunning}
        canSubmit={Boolean(input.trim())}
        placeholder="Text to detect"
        submitLabel="Detect"
      />
    </ChatScreen>
  );
}
