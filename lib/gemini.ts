import { fetchJson } from "./fetchJson";

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

export interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function generateText(
  contents: GeminiContent[],
  systemPrompt: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const { data, error } = await fetchJson<GeminiResponse>(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt}] },
        contents: contents,
      }),
    }
  );

  if (error || !data) {
    console.error("Gemini Upstream Error:", error);
    return null
  }

  console.log("Tokens Usage:", data.usageMetadata);
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}