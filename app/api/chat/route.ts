import { fetchJson } from "@/lib/fetchJson";
import { z } from "zod";
import { getConversation, createConversationWithMessage, addMessage, getMessages } from "@/db/queries";

const DEMO_USER_ID = 1;

const ChatRequestSchema = z.object({
  conversationId: z.number().int().positive().optional(),
  message: z.string().trim().min(1).max(10000),
});

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export async function POST(req: Request) {
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not found" }, { status: 500 });
  }

  let currentConversationId: number;

  if (conversationId === undefined) {
    const conversation = await createConversationWithMessage(DEMO_USER_ID, message);
    currentConversationId = conversation.id;
  } else {
    const conversation = await getConversation(conversationId, DEMO_USER_ID);
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }
    await addMessage(conversationId, "user", message);
    currentConversationId = conversationId;
  }

  const history = await getMessages(currentConversationId);

  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const { data, error } = await fetchJson<GeminiResponse>(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            { text: "You are a Smart AI Travel Agent. Always reply in the exact same language the user uses (e.g. Armenian, English, Russian). Keep your responses friendly, concise, and helpful." },
          ],
        },
        contents: contents,
      }),
    }
  );

  if (error || !data) {
    console.error("Gemini Upstream Error:", error);
    return Response.json(
      { error: "The AI service is temporarily unavailable. Please try again later." },
      { status: 502 }
    );
  }

  const replyAiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response was received.";
  console.log("Tokens Usage:", data.usageMetadata);

  await addMessage(currentConversationId, "assistant", replyAiMessage);

  return Response.json({ replyAiMessage, conversationId: currentConversationId });
}