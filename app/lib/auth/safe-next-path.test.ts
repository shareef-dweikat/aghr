import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("defaults missing values to home", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });

  it("rejects non-relative and protocol-relative paths", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("chat")).toBe("/");
  });

  it("rejects auth destinations", () => {
    expect(safeNextPath("/login")).toBe("/");
    expect(safeNextPath("/signup")).toBe("/");
    expect(safeNextPath("/login?next=%2Fchat")).toBe("/");
    expect(safeNextPath("/signup?plan=pro")).toBe("/");
  });

  it("allows safe in-app paths", () => {
    expect(safeNextPath("/")).toBe("/");
    expect(safeNextPath("/chat")).toBe("/chat");
    expect(safeNextPath("/chat/abc?tab=1")).toBe("/chat/abc?tab=1");
  });
});
