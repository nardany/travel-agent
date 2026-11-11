import { streamText, consumeStream, type ModelMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import {
  getConversation,
  createConversationWithMessage,
  addMessage,
  getMessages,
  updateConversationTitle,
  touchConversation,
} from "@/db/queries";
import { getSession } from "@/lib/session";
import { generateText } from "@/lib/gemini";
import { SYSTEM_PROMPT, TITLE_PROMPT } from "@/lib/prompts";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const ChatRequestSchema = z.object({
  conversationId: z.number().int().positive().optional(),
  message: z.string().trim().min(1).max(10000),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = ChatRequestSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { conversationId, message } = result.data;
  const isNewConversation = conversationId === undefined;

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
  const modelMessages: ModelMessage[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const titlePromise = (
    isNewConversation
      ? generateText([{ role: "user", parts: [{ text: message }] }], TITLE_PROMPT)
      : Promise.resolve(null)
  ).catch(() => null);

  const stream = streamText({
    model: google("gemini-flash-lite-latest"),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    abortSignal: req.signal,
  });

  return stream.toUIMessageStreamResponse({
    messageMetadata: ({ part }) =>
      part.type === "start" ? { conversationId: currentConversationId } : undefined,

    onFinish: async ({ responseMessage }) => {
      const text = responseMessage.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("");

      if (text) {
        await addMessage(currentConversationId, "assistant", text);
      }
      await touchConversation(currentConversationId);

      const title = await titlePromise;
      if (title) {
        await updateConversationTitle(currentConversationId, title.trim());
      }
    },

    consumeSseStream: consumeStream,
  });
}