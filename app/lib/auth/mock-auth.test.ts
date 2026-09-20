import { afterEach, describe, expect, it } from "vitest";

import { getSession, signIn, signOut, signUp } from "./mock-auth";
import { AuthError } from "./types";

afterEach(() => {
  localStorage.clear();
});

describe("signUp", () => {
  it("creates a session for a new user", async () => {
    const session = await signUp({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "secret",
    });

    expect(session.user).toMatchObject({
      email: "ada@example.com",
      displayName: "Ada Lovelace",
    });
    expect(session.token).toMatch(/^mock\./);
    await expect(getSession()).resolves.toEqual(session);
  });

  it("rejects missing fields", async () => {
    await expect(
      signUp({ name: " ", email: "ada@example.com", password: "secret" }),
    ).rejects.toMatchObject({ code: "missing_fields" } satisfies Partial<AuthError>);
  });

  it("rejects duplicate emails", async () => {
    await signUp({
      name: "Ada",
      email: "ada@example.com",
      password: "secret",
    });

    await expect(
      signUp({
        name: "Other",
        email: "ADA@example.com",
        password: "other",
      }),
    ).rejects.toMatchObject({ code: "duplicate_email" } satisfies Partial<AuthError>);
  });
});

describe("signIn and signOut", () => {
  it("signs in an existing user and clears the session on sign out", async () => {
    await signUp({
      name: "Ada",
      email: "ada@example.com",
      password: "secret",
    });
    await signOut();

    const session = await signIn({
      email: "ada@example.com",
      password: "secret",
    });
    expect(session.user.displayName).toBe("Ada");

    await signOut();
    await expect(getSession()).resolves.toBeNull();
  });

  it("rejects invalid credentials", async () => {
    await expect(
      signIn({ email: "missing@example.com", password: "nope" }),
    ).rejects.toMatchObject({
      code: "invalid_credentials",
    } satisfies Partial<AuthError>);
  });
});
