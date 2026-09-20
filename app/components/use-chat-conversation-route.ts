"use client";

import { useCallback } from "react";

import { useAuth } from "../lib/auth/auth-context";
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
  const { user } = useAuth();
  const userId = user?.id;

  const ensureConversationRoute = useCallback(
    (title: string, messages: ConversationMessage[]) => {
      if (!userId) {
        return;
      }

      void upsertConversation({
        id: conversationId,
        userId,
        apiId,
        title,
        messages,
      });

      if (window.location.search) {
        window.history.replaceState(null, "", `/chat/${conversationId}`);
      }
    },
    [apiId, conversationId, userId],
  );

  return { ensureConversationRoute };
}
