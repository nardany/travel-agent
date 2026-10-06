

export async function POST(req: Request) {
  const { messages } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Api key not fount" },
      { status: 500 }
    )
  }
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            { text: "You are a Smart AI Travel Agent. Always reply in the exact same language the user uses (e.g. Armenian, English, Russian). Keep your responses friendly, concise, and helpful." }
          ],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: lastUserMessage }]
          }
        ]
      })
    }
  );
  const data = await response.json();
  const replyAiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response was received."
  console.log("Gemini Response:", JSON.stringify(data, null, 2));

  return Response.json({replyAiMessage})
}