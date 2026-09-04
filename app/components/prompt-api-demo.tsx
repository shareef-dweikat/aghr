"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import {
  useChromeAiChatRun,
  type ChromeAiStatusCopy,
} from "./chrome-ai-demo-shell";
import {
  ChatComposer,
  ChatMessageList,
  ChatStatusBanner,
} from "./chat-thread";

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

export function PromptApiDemo({ conversationId }: { conversationId?: string }) {
  const router = useRouter();
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

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
          if (conversationId !== conversationIdRef.current) {
            router.replace(`/chat/${conversationIdRef.current}`);
          }
        },
      },
    );
  }, [conversationId, router, run]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatMessageList
        messages={messages}
        emptyLabel="Send a message to start"
      />

      <div className="flex flex-col gap-2 px-4 pt-2 sm:px-6">
        <ChatStatusBanner
          message={statusMessage}
          isWarning={isWarningStatus}
        />
      </div>

      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={handleSend}
        onStop={handleStop}
        isRunning={isRunning}
        canSubmit={Boolean(input.trim())}
        placeholder="Message"
      />
    </div>
  );
}
