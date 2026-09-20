import type { AuthSession, AuthUser, StoredUser } from "./types";

const USERS_KEY = "aghr:auth:users";
const TOKEN_KEY = "aghr:auth:token";
const SESSION_USER_KEY = "aghr:auth:session-user";

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseLocalStorage()) {
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredUsers(): StoredUser[] {
  const users = readJson<StoredUser[]>(USERS_KEY);
  if (!Array.isArray(users)) {
    return [];
  }
  return users;
}

export function setStoredUsers(users: StoredUser[]): void {
  writeJson(USERS_KEY, users);
}

export function getToken(): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return null;
  }
  return token;
}

function setToken(token: string): void {
  if (!canUseLocalStorage()) {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken(): void {
  if (!canUseLocalStorage()) {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
}

export function getSessionUser(): AuthUser | null {
  return readJson<AuthUser>(SESSION_USER_KEY);
}

function setSessionUser(user: AuthUser): void {
  writeJson(SESSION_USER_KEY, user);
}

function clearSessionUser(): void {
  if (!canUseLocalStorage()) {
    return;
  }
  localStorage.removeItem(SESSION_USER_KEY);
}

export function clearSession(): void {
  clearToken();
  clearSessionUser();
}

export function writeSession(session: AuthSession): void {
  setToken(session.token);
  setSessionUser(session.user);
}
