import { ExistingChatSession } from "../../components/chat-session";
import { isChatApiId } from "../../lib/conversations";

export default async function ChatConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ api?: string }>;
}) {
  const { id } = await params;
  const { api } = await searchParams;
  const apiHint = isChatApiId(api) ? api : undefined;

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 pt-14 font-sans dark:bg-black">
      <ExistingChatSession conversationId={id} apiHint={apiHint} />
    </div>
  );
}
