import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RequireAuth } from "./require-auth";

const replace = vi.fn();
const useAuth = vi.fn();
const usePathname = vi.fn();
const useSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => usePathname(),
  useSearchParams: () => useSearchParams(),
}));

vi.mock("./auth-context", () => ({
  useAuth: () => useAuth(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  useSearchParams.mockReturnValue(new URLSearchParams());
});

function renderGate(children: ReactNode = <p>Protected</p>) {
  return render(<RequireAuth>{children}</RequireAuth>);
}

describe("RequireAuth", () => {
  it("renders children while auth is loading", () => {
    useAuth.mockReturnValue({ user: null, status: "loading" });
    usePathname.mockReturnValue("/chat");

    renderGate();

    expect(screen.getByText("Protected")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects anonymous users away from protected routes", async () => {
    useAuth.mockReturnValue({ user: null, status: "unauthenticated" });
    usePathname.mockReturnValue("/chat");

    renderGate();

    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login?next=%2Fchat");
    });
  });

  it("redirects signed-in users away from auth routes using a safe next path", async () => {
    useAuth.mockReturnValue({
      user: { id: "1", email: "a@b.co", displayName: "Ada" },
      status: "authenticated",
    });
    usePathname.mockReturnValue("/login");
    useSearchParams.mockReturnValue(new URLSearchParams("next=/chat"));

    renderGate(<p>Login</p>);

    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/chat");
    });
  });

  it("renders protected children for authenticated users", () => {
    useAuth.mockReturnValue({
      user: { id: "1", email: "a@b.co", displayName: "Ada" },
      status: "authenticated",
    });
    usePathname.mockReturnValue("/chat");

    renderGate();

    expect(screen.getByText("Protected")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
