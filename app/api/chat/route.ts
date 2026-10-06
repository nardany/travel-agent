import { fetchJson } from "@/lib/fetchJson"

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json()
  } catch (error) {
    return Response.json(
      { error: "Invalid JSON" },
      { status: 400 }
    )
  }
  const { messages } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages must be a non-empty array" },
      { status: 400 }
    )
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Api key not fount" },
      { status: 500 }
    )
  }

  const contents = messages.map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const { data, error } = await fetchJson<any>(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            { text: "You are a Smart AI Travel Agent. Always reply in the exact same language the user uses (e.g. Armenian, English, Russian). Keep your responses friendly, concise, and helpful." }
          ],
        },
        contents: contents
      })
    }
  );
  if (error || !data) {
    console.error("Gemini Upstream Error:", error);
    return Response.json(
      { error: "The AI ​​service is temporarily unavailable. Please try again later." },
      { status: 502 }
    );
  }


  const replyAiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response was received."
  console.log("Tokens Usage:", data.usageMetadata);
  return Response.json({ replyAiMessage })
}