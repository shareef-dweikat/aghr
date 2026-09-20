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
const buildEnableGuideCopy = vi.fn();

vi.mock("../lib/chrome-ai", () => ({
  checkApiAvailability: (...args: unknown[]) => checkApiAvailability(...args),
}));

vi.mock("../lib/build-enable-guide-copy", async () => {
  const actual = await vi.importActual<
    typeof import("../lib/build-enable-guide-copy")
  >("../lib/build-enable-guide-copy");
  return {
    ...actual,
    buildEnableGuideCopy: (...args: unknown[]) => buildEnableGuideCopy(...args),
  };
});

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

beforeEach(async () => {
  mockAllStatuses("unsupported");
  const actual = await vi.importActual<
    typeof import("../lib/build-enable-guide-copy")
  >("../lib/build-enable-guide-copy");
  buildEnableGuideCopy.mockImplementation(actual.buildEnableGuideCopy);
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
      name: /Enable Prompt API/i,
    });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("opens a named Writer guide from a blocked card that has no demo link", async () => {
    const user = userEvent.setup();
    render(<HomeApiList />);

    const writerCard = await screen.findByRole("button", {
      name: /^Writer API/,
    });
    await user.click(writerCard);

    expect(
      screen.getByRole("dialog", { name: /Enable Writer API/i }),
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
      screen.getByRole("dialog", { name: /Enable Prompt API/i }),
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
      screen.queryByRole("dialog", { name: /Enable Prompt API/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Prompt checklist, copy controls, and Prompt docs", async () => {
    const user = userEvent.setup();
    render(<HomeApiList />);

    await user.click(
      await screen.findByRole("button", { name: /Prompt API/i }),
    );

    const dialog = screen.getByRole("dialog", { name: /Enable Prompt API/i });
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

    expect(
      within(dialog).queryByRole("link", {
        name: /chrome:\/\/flags\/#prompt-api-for-gemini-nano/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows Summarizer-specific flag and docs", async () => {
    const user = userEvent.setup();
    render(<HomeApiList />);

    await user.click(
      await screen.findByRole("button", { name: /Summarizer API/i }),
    );

    const dialog = screen.getByRole("dialog", {
      name: /Enable Summarizer API/i,
    });
    expect(dialog).toHaveTextContent(
      "chrome://flags/#summarization-api-for-gemini-nano",
    );
    expect(dialog).not.toHaveTextContent(
      "chrome://flags/#prompt-api-for-gemini-nano",
    );
    expect(
      within(dialog).getByRole("link", { name: /Official docs/i }),
    ).toHaveAttribute(
      "href",
      "https://developer.chrome.com/docs/ai/summarizer-api",
    );
  });

  it("shows Writer multi-flag step with plural wording", async () => {
    const user = userEvent.setup();
    render(<HomeApiList />);

    await user.click(
      await screen.findByRole("button", { name: /^Writer API/ }),
    );

    const dialog = screen.getByRole("dialog", { name: /Enable Writer API/i });
    expect(dialog).toHaveTextContent(/Open these flags and set each to Enabled/i);
    expect(dialog).toHaveTextContent(
      "chrome://flags/#prompt-api-for-gemini-nano-multimodal-input",
    );
    expect(dialog).toHaveTextContent(
      "chrome://flags/#writer-api-for-gemini-nano",
    );
    expect(
      within(dialog).getAllByRole("button", { name: /^Copy$/i }),
    ).toHaveLength(4);
  });

  it("shows Translator expert-model guide without optimization-guide step", async () => {
    const user = userEvent.setup();
    render(<HomeApiList />);

    await user.click(
      await screen.findByRole("button", { name: /Translator API/i }),
    );

    const dialog = screen.getByRole("dialog", {
      name: /Enable Translator API/i,
    });
    expect(dialog).toHaveTextContent("chrome://flags/#translation-api");
    expect(dialog).not.toHaveTextContent(
      "chrome://flags/#optimization-guide-on-device-model",
    );
    expect(dialog).not.toHaveTextContent(/~4 GB/i);
    expect(dialog).toHaveTextContent(/expert model/i);
    expect(
      within(dialog).getByRole("link", { name: /Official docs/i }),
    ).toHaveAttribute(
      "href",
      "https://developer.chrome.com/docs/ai/translator-api",
    );
    expect(
      within(dialog).getAllByRole("button", { name: /^Copy$/i }),
    ).toHaveLength(2);
  });

  it("does not open the dialog when enable metadata is missing", async () => {
    buildEnableGuideCopy.mockReturnValue(null);
    const user = userEvent.setup();
    render(<HomeApiList />);

    await user.click(
      await screen.findByRole("button", { name: /Prompt API/i }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
