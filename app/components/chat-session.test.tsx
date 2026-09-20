import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExistingChatSession } from "./chat-session";

const useAuth = vi.fn();
const getConversation = vi.fn();

vi.mock("../lib/auth/auth-context", () => ({
  useAuth: () => useAuth(),
}));

vi.mock("../lib/conversations", () => ({
  getConversation: (...args: unknown[]) => getConversation(...args),
}));

vi.mock("./prompt-api-demo", () => ({
  PromptApiDemo: ({ conversationId }: { conversationId: string }) => (
    <div>prompt:{conversationId}</div>
  ),
}));

vi.mock("./summarizer-api-demo", () => ({
  SummarizerApiDemo: ({ conversationId }: { conversationId: string }) => (
    <div>summarizer:{conversationId}</div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ExistingChatSession", () => {
  it("renders nothing until the conversation resolves", () => {
    useAuth.mockReturnValue({ user: { id: "u1" } });
    getConversation.mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <ExistingChatSession conversationId="c1" apiHint="prompt" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("uses the stored apiId when the conversation exists", async () => {
    useAuth.mockReturnValue({ user: { id: "u1" } });
    getConversation.mockResolvedValue({
      id: "c1",
      userId: "u1",
      apiId: "summarizer",
      title: "Summary",
      updatedAt: 1,
      messages: [],
    });

    render(<ExistingChatSession conversationId="c1" />);

    await waitFor(() => {
      expect(screen.getByText("summarizer:c1")).toBeInTheDocument();
    });
  });

  it("falls back to apiHint when no conversation is stored", async () => {
    useAuth.mockReturnValue({ user: { id: "u1" } });
    getConversation.mockResolvedValue(null);

    render(<ExistingChatSession conversationId="c2" apiHint="prompt" />);

    await waitFor(() => {
      expect(screen.getByText("prompt:c2")).toBeInTheDocument();
    });
  });
});
