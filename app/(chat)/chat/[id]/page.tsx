import { notFound } from "next/navigation";
import Chat from "@/components/Chat";
import { getConversation, getMessages, getToolCalls } from "@/db/queries";
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
  const calls = await getToolCalls(history.map((m) => m.id));

  const initialMessages: UIMessage[] = history.map((m) => {
    const messageCalls = calls.filter((c) => c.messageId === m.id);
    const toolParts = messageCalls.map((c) => ({
      type: `tool-${c.toolName}`,
      toolCallId: String(c.id),
      state: "output-available",
      input: c.input,
      output: c.output,
    })) as UIMessage["parts"];
    return {
      id: String(m.id),
      role: m.role as "user" | "assistant",
      parts: [...toolParts, { type: "text", text: m.content }],
    };
  });

  return <Chat initialConversationId={conversationId} initialMessages={initialMessages} />;
}