import { z } from "zod";
import { getConversation, createConversationWithMessage, addMessage, getMessages, updateConversationTitle, touchConversation } from "@/db/queries";
import { getSession } from "@/lib/session";
import { generateText, type GeminiContent } from "@/lib/gemini";

const ChatRequestSchema = z.object({
  conversationId: z.number().int().positive().optional(),
  message: z.string().trim().min(1).max(10000),
});

const SYSTEM_PROMPT = `You are a friendly local guide from Armenia who knows the country in depth: tourist destinations, routes between regions, hotels, guesthouses and cottages, local food, and practical travel tips.
Help travelers plan trips in Armenia:
- Suggest where to go and what to see, and how to get there (routes, travel time, road conditions).
- Take the season and typical weather into account.
- When recommending accommodation, mention the type (hotel, guesthouse, cottage), the star rating when relevant, and what meals are usually included (for example, breakfast only or full board).

Accuracy:
- Do not invent specific prices, availability, phone numbers, or other exact current details. If you are not sure, say so and suggest how to verify (the official website or calling the place).
- You do not have access to the current weather forecast. Speak about typical weather for the season.

Language:
- Always reply in the same language the user writes in. If the user writes Armenian with Latin letters, reply in Armenian script.

Scope:
- You only help with travel in Armenia. If the user asks about another country, gently explain that you specialize in Armenia, and suggest a similar experience in Armenia when possible.

Style:
- Keep answers short and concrete: give a clear recommendation, not a long list of options.
- When useful, end with one short question about the traveler's dates, budget, or interests.`;
const TITLE_PROMPT = "Create a very short title (maximum 5 words) for a conversation that starts with the user's message. Use the same language as the message. Return only the title, without quotes.";

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

  const contents: GeminiContent[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));


  const [replyResult, titleResult] = await Promise.allSettled([
    generateText(contents, SYSTEM_PROMPT),
    isNewConversation
      ? generateText([{ role: "user", parts: [{ text: message }] }], TITLE_PROMPT)
      : Promise.resolve(null),
  ]);

  if (replyResult.status === "rejected" || replyResult.value === null) {
    return Response.json(
      { error: "The AI service is temporarily unavailable. Please try again later." },
      { status: 502 }
    );
  }
  const replyAiMessage = replyResult.value;

  if (titleResult.status === "fulfilled" && titleResult.value) {
    await updateConversationTitle(currentConversationId, titleResult.value.trim());
  }
  await addMessage(currentConversationId, "assistant", replyAiMessage);
  await touchConversation(currentConversationId);
  return Response.json({ replyAiMessage, conversationId: currentConversationId });
}