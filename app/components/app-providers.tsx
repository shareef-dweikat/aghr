"use client";

import { Suspense, type ReactNode } from "react";

import { AuthProvider } from "../lib/auth/auth-context";
import { RequireAuth } from "../lib/auth/require-auth";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {/* Fallback must match the loading tree so useSearchParams suspense
          does not SSR an empty shell and hydrate a full page. */}
      <Suspense fallback={children}>
        <RequireAuth>{children}</RequireAuth>
      </Suspense>
    </AuthProvider>
  );
}
