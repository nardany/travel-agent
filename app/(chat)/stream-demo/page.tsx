"use client";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export default function StreamDemo() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/stream-demo" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <main className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold text-center pb-4 border-b">Streaming demo</h1>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "self-end bg-blue-600 text-white px-3 py-2 rounded-lg max-w-[80%]"
                : "self-start bg-gray-700 text-white px-3 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap"
            }
          >
            {message.parts.map((part, i) =>
              part.type === "text" ? <span key={i}>{part.text}</span> : null
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        {error && <p className="text-red-500 text-sm">Սխալ. փորձեք կրկին</p>}
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Հարցրու Հայաստանի մասին..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={status === "submitted" || status === "streaming" }
        >
          Ուղարկել
        </button>
      </form>

      <p className="text-sm text-gray-400 pt-2">Status: {status}</p>
    </main>
  );
}