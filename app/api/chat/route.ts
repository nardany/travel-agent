

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json()
  } catch (error) {
    return Response.json(
      { error: "Invalid Josn" },
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

  const response = await fetch(
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
  const data = await response.json();

  if (!response.ok) {
    return Response.json(
      { error: data.error?.message || "Gemini API error" },
      { status: response.status }
    );
  }

  const replyAiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response was received."
  console.log("Tokens Usage:", data.usageMetadata);
  return Response.json({ replyAiMessage })
}