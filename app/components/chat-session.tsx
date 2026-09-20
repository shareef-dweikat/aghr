"use client";

import { useEffect, useState } from "react";

import {
  getConversation,
  type ChatApiId,
  type Conversation,
} from "../lib/conversations";
import { PromptApiDemo } from "./prompt-api-demo";
import { SummarizerApiDemo } from "./summarizer-api-demo";

function ChatDemo({
  apiId,
  conversationId,
}: {
  apiId: ChatApiId;
  conversationId: string;
}) {
  if (apiId === "summarizer") {
    return <SummarizerApiDemo conversationId={conversationId} />;
  }

  return <PromptApiDemo conversationId={conversationId} />;
}

function resolveApiId(
  existing: Conversation | null,
  apiHint?: ChatApiId,
): ChatApiId {
  if (existing?.apiId) {
    return existing.apiId;
  }
  if (apiHint) {
    return apiHint;
  }
  return "prompt";
}

export function ExistingChatSession({
  conversationId,
  apiHint,
}: {
  conversationId: string;
  apiHint?: ChatApiId;
}) {
  const [apiId, setApiId] = useState<ChatApiId | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getConversation(conversationId).then((existing) => {
      if (cancelled) {
        return;
      }
      setApiId(resolveApiId(existing, apiHint));
    });

    return () => {
      cancelled = true;
    };
  }, [apiHint, conversationId]);

  if (!apiId) {
    return null;
  }

  return <ChatDemo apiId={apiId} conversationId={conversationId} />;
}
