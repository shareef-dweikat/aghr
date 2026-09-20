"use client";

import { useEffect, useState } from "react";

import { useAuth } from "../lib/auth/auth-context";
import {
  getConversation,
  type ChatApiId,
  type Conversation,
} from "../lib/conversations";
import { PromptApiDemo } from "./prompt-api-demo";
import { SummarizerApiDemo } from "./summarizer-api-demo";
import { WriterApiDemo } from "./writer-api-demo";

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

  if (apiId === "writer") {
    return <WriterApiDemo conversationId={conversationId} />;
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
  const { user } = useAuth();
  const userId = user?.id;
  const [resolved, setResolved] = useState<{
    userId: string;
    apiId: ChatApiId;
  } | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    void getConversation(userId, conversationId).then((existing) => {
      if (cancelled) {
        return;
      }
      setResolved({
        userId,
        apiId: resolveApiId(existing, apiHint),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [apiHint, conversationId, userId]);

  const apiId =
    resolved && resolved.userId === userId ? resolved.apiId : null;

  if (!apiId) {
    return null;
  }

  return <ChatDemo apiId={apiId} conversationId={conversationId} />;
}
