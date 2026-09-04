import { redirect } from "next/navigation";

import { isChatApiId } from "../lib/conversations";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ api?: string }>;
}) {
  const { api } = await searchParams;
  const apiId = isChatApiId(api) ? api : "prompt";
  const id = crypto.randomUUID();

  redirect(`/chat/${id}?api=${apiId}`);
}
