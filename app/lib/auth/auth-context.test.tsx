import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./auth-context";
import type { AuthSession } from "./types";

const getSession = vi.fn();
const signIn = vi.fn();
const signUp = vi.fn();
const signOut = vi.fn();

vi.mock("./mock-auth", () => ({
  getSession: () => getSession(),
  signIn: (input: unknown) => signIn(input),
  signUp: (input: unknown) => signUp(input),
  signOut: () => signOut(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function AuthProbe() {
  const { status, user } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="name">{user?.displayName ?? ""}</span>
    </div>
  );
}

describe("AuthProvider", () => {
  it("hydrates an authenticated session from getSession", async () => {
    const session: AuthSession = {
      token: "mock.1",
      user: { id: "1", email: "a@b.co", displayName: "Ada" },
    };
    getSession.mockResolvedValue(session);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("loading");

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    });
    expect(screen.getByTestId("name")).toHaveTextContent("Ada");
  });

  it("marks the session unauthenticated when getSession returns null", async () => {
    getSession.mockResolvedValue(null);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    });
    expect(screen.getByTestId("name")).toHaveTextContent("");
  });
});
