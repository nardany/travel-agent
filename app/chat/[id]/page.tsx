import { notFound } from "next/navigation";
import Chat from "@/components/Chat";
import { getConversation, getMessages } from "@/db/queries";
import { DEMO_USER_ID } from "@/lib/constants";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversationId = Number(id);

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    notFound();
  }

  const conversation = await getConversation(conversationId, DEMO_USER_ID);
  if (!conversation) {
    notFound();
  }

  const history = await getMessages(conversationId);

  const initialMessages = history.map((m) => ({
    id: String(m.id),
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return <Chat initialConversationId={conversationId} initialMessages={initialMessages} />;
}