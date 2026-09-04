"use client";

import { useEffect, useState } from "react";

import {
  getConversation,
  type ChatApiId,
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

export function ExistingChatSession({
  conversationId,
  apiHint,
}: {
  conversationId: string;
  apiHint?: ChatApiId;
}) {
  const [apiId, setApiId] = useState<ChatApiId | null>(null);

  useEffect(() => {
    const existing = getConversation(conversationId);
    setApiId(existing?.apiId ?? apiHint ?? "prompt");
  }, [apiHint, conversationId]);

  if (!apiId) {
    return null;
  }

  return <ChatDemo apiId={apiId} conversationId={conversationId} />;
}
