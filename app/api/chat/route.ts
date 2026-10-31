import { z } from "zod";
import { getConversation, createConversationWithMessage, addMessage, getMessages } from "@/db/queries";
import { getSession } from "@/lib/session";
import { generateText, type GeminiContent } from "@/lib/gemini";

const ChatRequestSchema = z.object({
  conversationId: z.number().int().positive().optional(),
  message: z.string().trim().min(1).max(10000),
});

const SYSTEM_PROMPT = "You are a Smart AI Travel Agent. Always reply in the exact same language the user uses (e.g. Armenian, English, Russian). Keep your responses friendly, concise, and helpful.";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = ChatRequestSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { conversationId, message } = result.data;

  let currentConversationId: number;

  if (conversationId === undefined) {
    const conversation = await createConversationWithMessage(userId, message);
    currentConversationId = conversation.id;
  } else {
    const conversation = await getConversation(conversationId, userId);
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }
    await addMessage(conversationId, "user", message);
    currentConversationId = conversationId;
  }

  const history = await getMessages(currentConversationId);

  const contents : GeminiContent[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const replyAiMessage = await generateText(contents, SYSTEM_PROMPT);

  if (replyAiMessage === null) {
    return Response.json(
      { error: "The AI service is temporarily unavailable. Please try again later." },
      { status: 502 }
    );
  }

  await addMessage(currentConversationId, "assistant", replyAiMessage);

  return Response.json({ replyAiMessage, conversationId: currentConversationId });
}