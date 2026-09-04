"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import { checkApiAvailability } from "../lib/chrome-ai";
import type { ChatMessage } from "./chat-thread";

type ChromeAiDemoStatus =
  | "unsupported"
  | "unavailable"
  | "checking"
  | "downloading"
  | "ready"
  | "streaming"
  | "done"
  | "error";

type DestroyableSession = {
  destroy(): void;
};

type ChromeAiChatRunContext = {
  signal: AbortSignal;
  monitor: (monitor: EventTarget) => void;
  getSession: () => DestroyableSession | null;
  setSession: (session: DestroyableSession | null) => void;
};

export type ChromeAiStatusCopy = {
  unsupported: string;
  unavailable: string;
  checking: string;
  downloading: (progress: number) => string;
  ready: string;
  streaming: string;
  done: string;
  error: string;
};

type ChatTurnExecute = (
  text: string,
  ctx: ChromeAiChatRunContext,
) => Promise<AsyncIterable<string>>;

type MessageSetter = Dispatch<SetStateAction<ChatMessage[]>>;

const BLOCKED_AVAILABILITY = new Set(["unsupported", "unavailable"]);
const DOWNLOAD_AVAILABILITY = new Set(["downloadable", "downloading"]);
const QUIET_STATUSES = new Set<ChromeAiDemoStatus>(["done", "ready"]);
const WARNING_STATUSES = new Set<ChromeAiDemoStatus>([
  "error",
  "unsupported",
  "unavailable",
]);

function chromeAiStatusMessage(
  status: ChromeAiDemoStatus | null,
  downloadProgress: number,
  copy: ChromeAiStatusCopy,
  error?: string | null,
): string {
  if (error) {
    return error;
  }
  if (!status) {
    return "";
  }
  return status === "downloading"
    ? copy.downloading(downloadProgress)
    : copy[status];
}

function isQuietStatus(status: ChromeAiDemoStatus | null): boolean {
  return status !== null && QUIET_STATUSES.has(status);
}

function isWarningChatStatus(status: ChromeAiDemoStatus | null): boolean {
  return status !== null && WARNING_STATUSES.has(status);
}

function resolveStatusMessage(
  status: ChromeAiDemoStatus | null,
  downloadProgress: number | null,
  copy: ChromeAiStatusCopy,
  error: string | null,
): string {
  if (isQuietStatus(status)) {
    return "";
  }
  return chromeAiStatusMessage(
    status,
    downloadProgress === null ? 0 : downloadProgress,
    copy,
    error,
  );
}

async function beginChromeAiRun(
  apiId: string,
  setStatus: (status: ChromeAiDemoStatus) => void,
): Promise<boolean> {
  const availability = await checkApiAvailability(apiId);

  if (BLOCKED_AVAILABILITY.has(availability)) {
    setStatus(availability as ChromeAiDemoStatus);
    return false;
  }

  if (DOWNLOAD_AVAILABILITY.has(availability)) {
    setStatus("downloading");
  }

  return true;
}

function applyChromeAiRunError(
  err: unknown,
  setStatus: (status: ChromeAiDemoStatus) => void,
  setError: (message: string | null) => void,
): void {
  if (err instanceof DOMException && err.name === "AbortError") {
    return;
  }

  setStatus("error");
  setError(err instanceof Error ? err.message : "Unknown error");
}

function appendUserTurn(setMessages: MessageSetter, text: string): void {
  setMessages((current) => [
    ...current,
    { role: "user", content: text },
    { role: "assistant", content: "" },
  ]);
}

function dropLastTurn(setMessages: MessageSetter): void {
  setMessages((current) => current.slice(0, -2));
}

function writeAssistantSnapshot(
  setMessages: MessageSetter,
  content: string,
): void {
  setMessages((current) => {
    if (current.length === 0) {
      return current;
    }
    const next = current.slice();
    next[next.length - 1] = { role: "assistant", content };
    return next;
  });
}

async function consumeAssistantStream(
  stream: AsyncIterable<string>,
  setMessages: MessageSetter,
): Promise<void> {
  let result = "";
  for await (const chunk of stream) {
    result += chunk;
    writeAssistantSnapshot(setMessages, result);
  }
}

function createChatRunContext(
  signal: AbortSignal,
  sessionRef: MutableRefObject<DestroyableSession | null>,
  setDownloadProgress: (value: number | null) => void,
): ChromeAiChatRunContext {
  return {
    signal,
    monitor(m) {
      m.addEventListener("downloadprogress", (e: Event) => {
        setDownloadProgress(Math.round((e as ProgressEvent).loaded * 100));
      });
    },
    getSession: () => sessionRef.current,
    setSession(session) {
      sessionRef.current = session;
    },
  };
}

async function runChromeAiChatTurn({
  apiId,
  text,
  execute,
  onComplete,
  sessionRef,
  abortRef,
  setStatus,
  setError,
  setDownloadProgress,
  setMessages,
}: {
  apiId: string;
  text: string;
  execute: ChatTurnExecute;
  onComplete?: () => void;
  sessionRef: MutableRefObject<DestroyableSession | null>;
  abortRef: MutableRefObject<AbortController | null>;
  setStatus: (status: ChromeAiDemoStatus) => void;
  setError: (message: string | null) => void;
  setDownloadProgress: (value: number | null) => void;
  setMessages: MessageSetter;
}): Promise<void> {
  appendUserTurn(setMessages, text);

  try {
    const canContinue = await beginChromeAiRun(apiId, setStatus);
    if (!canContinue) {
      dropLastTurn(setMessages);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const stream = await execute(
      text,
      createChatRunContext(controller.signal, sessionRef, setDownloadProgress),
    );

    setStatus("streaming");
    await consumeAssistantStream(stream, setMessages);
    setStatus("done");
    onComplete?.();
  } catch (err) {
    applyChromeAiRunError(err, setStatus, setError);
  }
}

export function useChromeAiChatRun({
  apiId,
  statusCopy,
}: {
  apiId: string;
  statusCopy: ChromeAiStatusCopy;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChromeAiDemoStatus | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const sessionRef = useRef<DestroyableSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  const run = useCallback(
    async (execute: ChatTurnExecute, options?: { onComplete?: () => void }) => {
      const text = input.trim();
      if (!text || isRunning) {
        return;
      }

      setInput("");
      setError(null);
      setDownloadProgress(null);
      setIsRunning(true);
      setStatus("checking");

      try {
        await runChromeAiChatTurn({
          apiId,
          text,
          execute,
          onComplete: options?.onComplete,
          sessionRef,
          abortRef,
          setStatus,
          setError,
          setDownloadProgress,
          setMessages,
        });
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [apiId, input, isRunning],
  );

  const statusMessage = resolveStatusMessage(
    status,
    downloadProgress,
    statusCopy,
    error,
  );
  const isWarningStatus = isWarningChatStatus(status);

  return {
    input,
    setInput,
    messages,
    isRunning,
    handleStop,
    run,
    statusMessage,
    isWarningStatus,
  };
}
