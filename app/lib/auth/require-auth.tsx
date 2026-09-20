"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./auth-context";
import { safeNextPath } from "./safe-next-path";

const AUTH_PATHS = new Set(["/login", "/signup"]);

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthPath = AUTH_PATHS.has(pathname);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!user && !isAuthPath) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return;
    }

    if (user && isAuthPath) {
      router.replace(safeNextPath(searchParams.get("next")));
    }
  }, [isAuthPath, pathname, router, searchParams, status, user]);

  // Render children while loading so SSR HTML matches the client's first paint.
  // Redirects in the effect above handle navigation once the session is known.
  if (status === "loading") {
    return children;
  }

  if (!user && !isAuthPath) {
    return null;
  }

  if (user && isAuthPath) {
    return null;
  }

  return children;
}
