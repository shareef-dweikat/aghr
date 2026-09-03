import { PromptApiDemo } from "../../components/prompt-api-demo";

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 py-12 font-sans dark:bg-black">
      <PromptApiDemo conversationId={id} />
    </div>
  );
}
