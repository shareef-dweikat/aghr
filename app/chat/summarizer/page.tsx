import { NewChatFab } from "../../components/new-chat-fab";
import { SummarizerApiDemo } from "../../components/summarizer-api-demo";
import defaultTranslations from "../../translations/default.json";

export default function SummarizerChatPage() {
  const { nav } = defaultTranslations;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 py-12 font-sans dark:bg-black">
      <SummarizerApiDemo />
      <NewChatFab label={nav.new} />
    </div>
  );
}
