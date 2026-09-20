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
    "Prompt API is not available in this browser. Use Chrome 148+ on desktop and enable the feature flag.",
  unavailable:
    "Gemini Nano is unavailable on this device (hardware or OS requirements not met).",
  checking: "Checking model availability…",
  downloading: (progress) => `Downloading model… ${progress}%`,
  ready: "Model ready. Send a message to chat.",
  streaming: "Generating response…",
  done: "Done.",
  error: "Something went wrong.",
};

export function PromptApiDemo({ conversationId }: { conversationId: string }) {
  const { ensureConversationRoute } = useChatConversationRoute({
    apiId: "prompt",
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
  } = useChromeAiChatRun({ apiId: "prompt", statusCopy: STATUS_COPY });

  const handleSend = useCallback(() => {
    const title = input.trim();
    void run(
      async (prompt, ctx) => {
        let session = ctx.getSession() as LanguageModelSession | null;
        if (!session) {
          session = await LanguageModel.create({
            signal: ctx.signal,
            monitor: ctx.monitor,
          });
          ctx.setSession(session);
        }

        return session.promptStreaming(prompt, {
          signal: ctx.signal,
        });
      },
      {
        onComplete() {
          ensureConversationRoute(title);
        },
      },
    );
  }, [ensureConversationRoute, input, run]);

  return (
    <ChatScreen
      messages={messages}
      emptyLabel="Send a message to start"
      statusMessage={statusMessage}
      isWarningStatus={isWarningStatus}
    >
      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={handleSend}
        onStop={handleStop}
        isRunning={isRunning}
        canSubmit={Boolean(input.trim())}
        placeholder="Message"
      />
    </ChatScreen>
  );
}
