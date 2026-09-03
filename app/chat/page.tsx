import Link from "next/link";
import { PromptApiDemo } from "../components/prompt-api-demo";
import defaultTranslations from "../translations/default.json";

export default function ChatPage() {
  const { nav } = defaultTranslations;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 py-12 font-sans dark:bg-black">
      <PromptApiDemo />
      <Link
        href="/"
        aria-label={nav.new}
        className="fixed top-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        <PlusIcon />
      </Link>
    </div>
  );
}


function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
