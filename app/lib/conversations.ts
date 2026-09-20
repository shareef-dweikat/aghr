export type ChatApiId = "prompt" | "summarizer";

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Conversation = {
  id: string;
  apiId: ChatApiId;
  title: string;
  updatedAt: number;
  messages: ConversationMessage[];
};

const DB_NAME = "aghr";
const DB_VERSION = 1;
const STORE_NAME = "conversations";
const LEGACY_STORAGE_KEY = "aghr:conversations";

type LegacyConversation = {
  id: string;
  apiId: ChatApiId;
  title: string;
  updatedAt: number;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () =>
      reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function parseLegacyList(raw: string): LegacyConversation[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed as LegacyConversation[];
}

function readLegacyLocalStorage(): LegacyConversation[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return parseLegacyList(raw);
  } catch {
    return [];
  }
}

function conversationTitle(title: string | undefined): string {
  const trimmed = String(title ?? "").trim();
  if (trimmed.length > 0) {
    return trimmed;
  }
  return "New chat";
}

function conversationUpdatedAt(updatedAt: number): number {
  if (updatedAt > 0) {
    return updatedAt;
  }
  return Date.now();
}

function toMigratedConversation(item: LegacyConversation): Conversation | null {
  if (!isChatApiId(item.apiId)) {
    return null;
  }
  if (!item.id) {
    return null;
  }

  return {
    id: item.id,
    apiId: item.apiId,
    title: conversationTitle(item.title),
    updatedAt: conversationUpdatedAt(item.updatedAt),
    messages: [],
  };
}

async function putMissingLegacy(
  store: IDBObjectStore,
  legacy: LegacyConversation[],
  existingIds: Set<string>,
): Promise<void> {
  for (const item of legacy) {
    const next = toMigratedConversation(item);
    if (!next || existingIds.has(next.id)) {
      continue;
    }
    store.put(next);
  }
}

async function migrateFromLocalStorage(db: IDBDatabase): Promise<void> {
  const legacy = readLegacyLocalStorage();
  if (legacy.length === 0) {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return;
  }

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const existing = (await requestToPromise(store.getAll())) as Conversation[];
  await putMissingLegacy(
    store,
    legacy,
    new Set(existing.map((conversation) => conversation.id)),
  );
  await transactionDone(tx);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

let migratePromise: Promise<void> | null = null;

async function ensureMigrated(): Promise<void> {
  if (!migratePromise) {
    migratePromise = (async () => {
      const db = await openDb();
      try {
        await migrateFromLocalStorage(db);
      } finally {
        db.close();
      }
    })().catch((error) => {
      migratePromise = null;
      throw error;
    });
  }
  await migratePromise;
}

async function withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  if (!canUseStorage()) {
    throw new Error("IndexedDB is not available");
  }

  await ensureMigrated();
  const db = await openDb();
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

async function readAllConversations(db: IDBDatabase): Promise<Conversation[]> {
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const records = await requestToPromise(store.getAll());
  await transactionDone(tx);
  return records as Conversation[];
}

export async function listConversations(): Promise<Conversation[]> {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const records = await withDb(readAllConversations);
    return records.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function getConversation(id: string): Promise<Conversation | null> {
  if (!canUseStorage()) {
    return null;
  }

  try {
    return await withDb(async (db) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const record = await requestToPromise(store.get(id));
      await transactionDone(tx);
      return (record as Conversation | undefined) ?? null;
    });
  } catch {
    return null;
  }
}

export async function upsertConversation(input: {
  id: string;
  apiId: ChatApiId;
  title: string;
  messages: ConversationMessage[];
}): Promise<Conversation> {
  const next: Conversation = {
    id: input.id,
    apiId: input.apiId,
    title: input.title.trim() || "New chat",
    updatedAt: Date.now(),
    messages: input.messages,
  };

  if (!canUseStorage()) {
    return next;
  }

  await withDb(async (db) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(next);
    await transactionDone(tx);
  });

  return next;
}

export function isChatApiId(value: string | undefined | null): value is ChatApiId {
  return value === "prompt" || value === "summarizer";
}
