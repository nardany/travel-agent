import { streamText, consumeStream, tool, stepCountIs, type ModelMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import {
  getConversation,
  createConversationWithMessage,
  addMessage,
  getMessages,
  updateConversationTitle,
  touchConversation,
  saveToolCalls,
} from "@/db/queries";
import { getSession } from "@/lib/session";
import { generateText } from "@/lib/gemini";
import { SYSTEM_PROMPT, TITLE_PROMPT } from "@/lib/prompts";
import { getWeatherForecast } from "@/lib/weather";

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

  const collectedCalls: { toolName: string; input: unknown; output: unknown; durationMs: number }[] = [];

  const getWeather = tool({
    description: `
  Get the weather forecast for the next 7 days information for cities and locations in Armenia.

  Use this tool whenever weather information is directly requested or when
  weather conditions are relevant to the user's travel plans or activities.

  This includes:
  - When the user asks about current weather, temperature, rain, snow,
    wind, or other weather conditions in an Armenian city.
  - When the user asks whether it is a good time to visit a particular
    place in Armenia.
  - When the user is planning a trip, sightseeing, hiking, camping,
    mountain activities, or other outdoor activities.
  - When weather conditions could affect travel decisions, road trips,
    transportation, or outdoor plans.
  - When the user asks what clothes to wear or what to prepare for
    a trip based on the weather.

  The tool supports locations within Armenia, including Yerevan,
  Gyumri, Vanadzor, Dilijan, Sevan, Tsaghkadzor, Jermuk, Goris,
  and other Armenian cities and towns.

  Always use this tool when reliable, up-to-date weather information
  is needed instead of guessing or relying on general knowledge.
`,
    inputSchema: z.object({
      city: z.string().describe("The name of an Armenian city in English, for example: Dilijan, Gyumri, Jermuk"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("The date of the forecast in YYYY-MM-DD format")
    }),
    execute: async ({ city,date }) => {
      const start = Date.now();
      const result = await getWeatherForecast(city, date);
      collectedCalls.push({
        toolName: "getWeather",
        input: {city, date},
        output: result,
        durationMs: Date.now() - start
      })
      return result;
    },
  });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Yerevan" });

  const stream = streamText({
    model: google("gemini-flash-lite-latest"),
    system: `${SYSTEM_PROMPT}\n\nToday's date is ${today}.`,
    messages: modelMessages,
    abortSignal: req.signal,
    tools: { getWeather },
    stopWhen: stepCountIs(3)
  });

  return stream.toUIMessageStreamResponse({
    messageMetadata: ({ part }) =>
      part.type === "start" ? { conversationId: currentConversationId } : undefined,

    onFinish: async ({ responseMessage }) => {
      const text = responseMessage.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("");

      if (text || collectedCalls.length > 0) {
        const saved = await addMessage(currentConversationId, "assistant", text);
        await saveToolCalls(saved.id,collectedCalls)
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