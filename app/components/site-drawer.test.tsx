import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteDrawer } from "./site-drawer";

const useAuth = vi.fn();
const usePathname = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useRouter: () => ({ replace }),
}));

vi.mock("next/link", () => ({
  default: function MockLink({
    children,
    href,
    ...props
  }: ComponentProps<"a"> & { href: string; children?: ReactNode }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock("../lib/auth/auth-context", () => ({
  useAuth: () => useAuth(),
}));

vi.mock("../lib/conversations", () => ({
  listConversations: vi.fn(async () => []),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SiteDrawer", () => {
  it("hides on auth routes", () => {
    usePathname.mockReturnValue("/login");
    useAuth.mockReturnValue({
      user: { id: "1", email: "a@b.co", displayName: "Ada" },
      signOut: vi.fn(),
    });

    const { container } = render(<SiteDrawer />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the signed-in display name after mount", async () => {
    usePathname.mockReturnValue("/");
    useAuth.mockReturnValue({
      user: { id: "1", email: "a@b.co", displayName: "Ada Lovelace" },
      signOut: vi.fn(),
    });

    render(<SiteDrawer />);

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });
  });
});
