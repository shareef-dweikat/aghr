import {
  cleanup,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeApiList } from "./home-api-list";
import type { ChromeAiAvailabilityStatus } from "../lib/chrome-ai";

const checkApiAvailability = vi.fn();

vi.mock("../lib/chrome-ai", () => ({
  checkApiAvailability: (...args: unknown[]) => checkApiAvailability(...args),
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

function mockAllStatuses(status: ChromeAiAvailabilityStatus) {
  checkApiAvailability.mockImplementation(async () => status);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mockAllStatuses("unsupported");
});

describe("HomeApiList", () => {
  it("opens the enablement dialog from a blocked Prompt card without navigating", async () => {
    const user = userEvent.setup();
    render(<HomeApiList />);

    const promptCard = await screen.findByRole("button", {
      name: /Prompt API/i,
    });
    expect(promptCard).toHaveAttribute("aria-haspopup", "dialog");
    expect(
      screen.queryByRole("link", { name: /Prompt API/i }),
    ).not.toBeInTheDocument();
    expect(promptCard).toHaveTextContent(/How to enable/i);

    await user.click(promptCard);

    const dialog = screen.getByRole("dialog", {
      name: /Enable Chrome built-in AI/i,
    });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("opens the same dialog from a blocked card that has no demo link", async () => {
    const user = userEvent.setup();
    render(<HomeApiList />);

    const writerCard = await screen.findByRole("button", {
      name: /^Writer API/,
    });
    await user.click(writerCard);

    expect(
      screen.getByRole("dialog", { name: /Enable Chrome built-in AI/i }),
    ).toBeInTheDocument();
  });

  it("treats unavailable the same as unsupported for opening the guide", async () => {
    mockAllStatuses("unavailable");
    const user = userEvent.setup();
    render(<HomeApiList />);

    const promptCard = await screen.findByRole("button", {
      name: /Prompt API/i,
    });
    expect(promptCard).toHaveTextContent(/Not available · How to enable/i);

    await user.click(promptCard);

    expect(
      screen.getByRole("dialog", { name: /Enable Chrome built-in AI/i }),
    ).toBeInTheDocument();
  });

  it("dismisses via close, Escape, and scrim, restoring focus to the card", async () => {
    const user = userEvent.setup();
    render(<HomeApiList />);

    const promptCard = await screen.findByRole("button", {
      name: /Prompt API/i,
    });
    await user.click(promptCard);

    const dialog = screen.getByRole("dialog");
    const closeButton = within(dialog).getByRole("button", { name: /^Close$/i });
    expect(closeButton).toHaveFocus();

    await user.click(closeButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(promptCard).toHaveFocus();

    await user.click(promptCard);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(promptCard).toHaveFocus();

    await user.click(promptCard);
    const scrim = document.querySelector('[aria-hidden="true"]');
    expect(scrim).toBeTruthy();
    await user.click(scrim!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(promptCard).toHaveFocus();
  });

  it("keeps available Prompt cards as links to the demo", async () => {
    mockAllStatuses("available");
    render(<HomeApiList />);

    const promptLink = await screen.findByRole("link", {
      name: /Prompt API/i,
    });
    expect(promptLink).toHaveAttribute("href", "/chat");
    expect(
      screen.queryByRole("button", { name: /Prompt API/i }),
    ).not.toBeInTheDocument();
    expect(promptLink).not.toHaveTextContent(/How to enable/i);
  });

  it("does not turn checking cards into enablement actions", async () => {
    checkApiAvailability.mockImplementation(
      () => new Promise(() => undefined),
    );
    render(<HomeApiList />);

    expect(screen.getAllByText("Checking…").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /Prompt API/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /Enable Chrome built-in AI/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the shared checklist, copy controls, and official docs link", async () => {
    const user = userEvent.setup();
    render(<HomeApiList />);

    await user.click(
      await screen.findByRole("button", { name: /Prompt API/i }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/Chrome 148\+/i);
    expect(dialog).toHaveTextContent(
      "chrome://flags/#prompt-api-for-gemini-nano",
    );
    expect(dialog).toHaveTextContent(
      "chrome://flags/#optimization-guide-on-device-model",
    );
    expect(dialog).toHaveTextContent("chrome://on-device-internals");
    expect(dialog).toHaveTextContent(/~4 GB/i);
    expect(dialog).toHaveTextContent(/Enabled BypassPerfRequirement/i);

    const docsLink = within(dialog).getByRole("link", {
      name: /Official docs/i,
    });
    expect(docsLink).toHaveAttribute(
      "href",
      "https://developer.chrome.com/docs/ai/prompt-api",
    );

    expect(
      within(dialog).getAllByRole("button", { name: /^Copy$/i }),
    ).toHaveLength(3);

    // chrome:// must not be linked for navigation
    expect(
      within(dialog).queryByRole("link", {
        name: /chrome:\/\/flags\/#prompt-api-for-gemini-nano/i,
      }),
    ).not.toBeInTheDocument();
  });
});
