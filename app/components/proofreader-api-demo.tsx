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
    "Proofreader API is not available in this browser. Use Chrome with the Proofreader flag enabled.",
  unavailable:
    "Proofreader is unavailable on this device (hardware or OS requirements not met).",
  checking: "Checking model availability…",
  downloading: (progress) => `Downloading model… ${progress}%`,
  ready: "Model ready. Enter text to proofread.",
  streaming: "Proofreading…",
  done: "Done.",
  error: "Something went wrong.",
};

async function* singleChunk(text: string): AsyncIterable<string> {
  yield text;
}

function formatProofreadResult(result: ProofreadResult): string {
  const correctionCount = result.corrections.length;
  if (correctionCount === 0) {
    return result.correctedInput;
  }

  return `${result.correctedInput}\n\n(${correctionCount} correction${
    correctionCount === 1 ? "" : "s"
  })`;
}

export function ProofreaderApiDemo({
  conversationId,
}: {
  conversationId: string;
}) {
  const { ensureConversationRoute } = useChatConversationRoute({
    apiId: "proofreader",
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
    apiId: "proofreader",
    conversationId,
    statusCopy: STATUS_COPY,
  });

  const handleProofread = useCallback(() => {
    const title = input.trim();
    void run(
      async (text, ctx) => {
        ctx.getSession()?.destroy();
        ctx.setSession(null);

        const session = await Proofreader.create({
          expectedInputLanguages: ["en"],
          signal: ctx.signal,
          monitor: ctx.monitor,
        });
        ctx.setSession(session);

        const result = await session.proofread(text, {
          signal: ctx.signal,
        });
        return singleChunk(formatProofreadResult(result));
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
      emptyLabel="Enter text to proofread"
      statusMessage={statusMessage}
      isWarningStatus={isWarningStatus}
    >
      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={handleProofread}
        onStop={handleStop}
        isRunning={isRunning}
        canSubmit={Boolean(input.trim())}
        placeholder="Text to proofread"
        submitLabel="Proofread"
      />
    </ChatScreen>
  );
}
