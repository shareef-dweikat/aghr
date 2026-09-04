"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { checkApiAvailability } from "../lib/chrome-ai";
import {
  chromeAiStatusMessage,
  type ChromeAiStatusCopy,
} from "./chrome-ai-demo-shell";
import {
  ChatComposer,
  ChatMessageList,
  ChatStatusBanner,
  type ChatMessage,
} from "./chat-thread";

type ChromeAiDemoStatus =
  | "unsupported"
  | "unavailable"
  | "checking"
  | "downloading"
  | "ready"
  | "streaming"
  | "done"
  | "error";

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

const BLOCKED_AVAILABILITY = new Set(["unsupported", "unavailable"]);
const DOWNLOAD_AVAILABILITY = new Set(["downloadable", "downloading"]);

export function PromptApiDemo({ conversationId }: { conversationId?: string }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChromeAiDemoStatus | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const conversationIdRef = useRef(conversationId);
  const sessionRef = useRef<LanguageModelSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  conversationIdRef.current = conversationId;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, []);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
  }, []);

  const handleSend = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isRunning) {
      return;
    }

    setInput("");
    setError(null);
    setDownloadProgress(null);
    setIsRunning(true);
    setStatus("checking");

    setMessages((current) => [
      ...current,
      { role: "user", content: prompt },
      { role: "assistant", content: "" },
    ]);

    try {
      const availability = await checkApiAvailability("prompt");

      if (BLOCKED_AVAILABILITY.has(availability)) {
        setStatus(availability as ChromeAiDemoStatus);
        setMessages((current) => current.slice(0, -2));
        return;
      }

      if (DOWNLOAD_AVAILABILITY.has(availability)) {
        setStatus("downloading");
      }

      const controller = new AbortController();
      abortRef.current = controller;

      let session = sessionRef.current;
      if (!session) {
        session = await LanguageModel.create({
          signal: controller.signal,
          monitor(m) {
            m.addEventListener("downloadprogress", (e: Event) => {
              const progress = (e as ProgressEvent).loaded;
              setDownloadProgress(Math.round(progress * 100));
            });
          },
        });
        sessionRef.current = session;
      }

      setStatus("streaming");

      const stream = session.promptStreaming(prompt, {
        signal: controller.signal,
      });

      let text = "";
      for await (const chunk of stream) {
        text += chunk;
        const snapshot = text;
        setMessages((current) => {
          if (current.length === 0) {
            return current;
          }
          const next = current.slice();
          next[next.length - 1] = { role: "assistant", content: snapshot };
          return next;
        });
      }

      setStatus("done");

      if (conversationId !== conversationIdRef.current) {
        router.replace(`/chat/${conversationIdRef.current}`);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [conversationId, input, isRunning, router]);

  const rawStatusMessage = chromeAiStatusMessage(
    status,
    downloadProgress,
    STATUS_COPY,
    error,
  );
  const statusMessage =
    status === "done" || status === "ready" ? "" : rawStatusMessage;
  const isWarningStatus =
    status === "error" ||
    status === "unsupported" ||
    status === "unavailable";

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
