"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getSession, signIn, signOut, signUp } from "./mock-auth";
import type { AuthStatus, AuthUser } from "./types";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  signIn: typeof signIn;
  signUp: typeof signUp;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    void getSession().then((session) => {
      if (cancelled) {
        return;
      }
      setUser(session?.user ?? null);
      setStatus(session ? "authenticated" : "unauthenticated");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignIn(
    input: Parameters<typeof signIn>[0],
  ): Promise<Awaited<ReturnType<typeof signIn>>> {
    const session = await signIn(input);
    setUser(session.user);
    setStatus("authenticated");
    return session;
  }

  async function handleSignUp(
    input: Parameters<typeof signUp>[0],
  ): Promise<Awaited<ReturnType<typeof signUp>>> {
    const session = await signUp(input);
    setUser(session.user);
    setStatus("authenticated");
    return session;
  }

  async function handleSignOut(): Promise<void> {
    await signOut();
    setUser(null);
    setStatus("unauthenticated");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
