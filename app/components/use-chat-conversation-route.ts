"use client";

import { useCallback, useRef } from "react";

import {
  upsertConversation,
  type ChatApiId,
  type ConversationMessage,
} from "../lib/conversations";

export function useChatConversationRoute({
  apiId,
  conversationId,
}: {
  apiId: ChatApiId;
  conversationId: string;
}) {
  const idRef = useRef(conversationId);
  idRef.current = conversationId;

  const ensureConversationRoute = useCallback(
    (title: string, messages: ConversationMessage[]) => {
      void upsertConversation({
        id: idRef.current,
        apiId,
        title,
        messages,
      });

      if (window.location.search) {
        window.history.replaceState(null, "", `/chat/${idRef.current}`);
      }
    },
    [apiId],
  );

  return { ensureConversationRoute };
}
