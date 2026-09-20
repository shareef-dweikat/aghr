import {
  clearSession,
  getSessionUser,
  getStoredUsers,
  getToken,
  setStoredUsers,
  writeSession,
} from "./storage";
import { AuthError, type AuthSession, type AuthUser } from "./types";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function createToken(userId: string): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `mock.${userId}.${suffix}`;
}

function toAuthUser(user: {
  id: string;
  email: string;
  displayName: string;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}

/**
 * Mock stand-in for a future GCP token validity check.
 * Always returns true when a non-empty token is present.
 */
async function validateToken(token: string): Promise<boolean> {
  return token.trim().length > 0;
}

export async function getSession(): Promise<AuthSession | null> {
  const token = getToken();
  if (!token) {
    return null;
  }

  const isValid = await validateToken(token);
  if (!isValid) {
    clearSession();
    return null;
  }

  const user = getSessionUser();
  if (!user) {
    clearSession();
    return null;
  }

  return { token, user };
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  const displayName = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!displayName || !email || !password) {
    throw new AuthError("All fields are required.", "missing_fields");
  }

  const users = getStoredUsers();
  if (users.some((user) => user.email === email)) {
    throw new AuthError(
      "An account with this email already exists.",
      "duplicate_email",
    );
  }

  const stored = {
    id: createId(),
    email,
    displayName,
    password,
  };
  setStoredUsers([...users, stored]);

  const session: AuthSession = {
    token: createToken(stored.id),
    user: toAuthUser(stored),
  };
  writeSession(session);
  return session;
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!email || !password) {
    throw new AuthError("Email and password are required.", "missing_fields");
  }

  const user = getStoredUsers().find(
    (candidate) => candidate.email === email && candidate.password === password,
  );
  if (!user) {
    throw new AuthError("Invalid email or password.", "invalid_credentials");
  }

  const session: AuthSession = {
    token: createToken(user.id),
    user: toAuthUser(user),
  };
  writeSession(session);
  return session;
}

export async function signOut(): Promise<void> {
  clearSession();
}
