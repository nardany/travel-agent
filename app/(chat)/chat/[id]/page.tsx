import { notFound } from "next/navigation";
import Chat from "@/components/Chat";
import { getConversation, getMessages } from "@/db/queries";
import { getSession } from "@/lib/session"
import type { UIMessage } from "ai";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    notFound();
  }
  const { id } = await params;
  const conversationId = Number(id);

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    notFound();
  }

  const conversation = await getConversation(conversationId, session.user.id);
  if (!conversation) {
    notFound();
  }

  const history = await getMessages(conversationId);

  const initialMessages: UIMessage[] = history.map((m) => ({
    id: String(m.id),
    role: m.role as "user" | "assistant",
    parts: [{ type: "text", text: m.content }],
  }));

  return <Chat initialConversationId={conversationId} initialMessages={initialMessages} />;
}