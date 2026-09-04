export type ChatApiId = "prompt" | "summarizer";

export type Conversation = {
  id: string;
  apiId: ChatApiId;
  title: string;
  updatedAt: number;
};

const STORAGE_KEY = "aghr:conversations";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function readAll(): Conversation[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(conversations: Conversation[]): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function listConversations(): Conversation[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): Conversation | null {
  return readAll().find((conversation) => conversation.id === id) ?? null;
}

export function upsertConversation(input: {
  id: string;
  apiId: ChatApiId;
  title: string;
}): Conversation {
  const conversations = readAll();
  const existingIndex = conversations.findIndex(
    (conversation) => conversation.id === input.id,
  );
  const next: Conversation = {
    id: input.id,
    apiId: input.apiId,
    title: input.title.trim() || "New chat",
    updatedAt: Date.now(),
  };

  if (existingIndex === -1) {
    conversations.unshift(next);
  } else {
    conversations[existingIndex] = {
      ...conversations[existingIndex],
      ...next,
    };
  }

  writeAll(conversations);
  return next;
}

export function isChatApiId(value: string | undefined | null): value is ChatApiId {
  return value === "prompt" || value === "summarizer";
}
