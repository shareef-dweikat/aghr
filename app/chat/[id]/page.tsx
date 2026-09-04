import { PromptApiDemo } from "../../components/prompt-api-demo";

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 pt-14 font-sans dark:bg-black">
      <PromptApiDemo conversationId={id} />
    </div>
  );
}
