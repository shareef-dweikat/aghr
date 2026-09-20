export function safeNextPath(next: string | null | undefined): string {
  if (!next) {
    return "/";
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  if (next === "/login" || next === "/signup" || next.startsWith("/login?") || next.startsWith("/signup?")) {
    return "/";
  }

  return next;
}
