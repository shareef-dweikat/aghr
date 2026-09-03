import { PromptApiDemo } from "../components/prompt-api-demo";
import { NewChatFab } from "../components/new-chat-fab";
import defaultTranslations from "../translations/default.json";

export default function ChatPage() {
  const { nav } = defaultTranslations;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 py-12 font-sans dark:bg-black">
      <PromptApiDemo />
      <NewChatFab label={nav.new} />
    </div>
  );
}
