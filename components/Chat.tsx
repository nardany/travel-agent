"use client"
import { useState } from "react"
import { useRouter } from "next/navigation";
import styles from "@/app/page.module.css"

export interface Message {
  id: string,
  role: "user" | "assistant",
  content: string,
  isError?: boolean;
}


interface ChatProps {
  initialConversationId: number | null;
  initialMessages: Message[];
}

export default function Chat({ initialConversationId, initialMessages }: ChatProps) {
  const router = useRouter();
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.length > 0
      ? initialMessages :
      [{
        id: "1",
        role: "assistant",
        content: "Բարև, ես կոգնեմ քեզ պլանավորել քո ճամփորդությունը"
      }
      ])
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(initialConversationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() === "") {
      return
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          message: userMessage.content
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "The request failed.");
      }

      setConversationId(data.conversationId);
      if (conversationId === null) {
        router.replace(`/chat/${data.conversationId}`);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.replyAiMessage
        }
      ])

    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error ${error.message}`,
          isError: true,
        }
      ])
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <main className="flex flex-col h-screen max-w-2xl mx-auto p-4">
        <h1 className="text-xl font-bold text-center pb-4 border-b">
          Smart AI Travel Agent
        </h1>
        <div className="flex-1 overflow-y-auto py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={message.role === "user" ? styles.rowUser : styles.rowAssistant}
            >
              <div
                className={`${styles.bubble} ${message.role === "user" ? styles.bubbleUser : styles.bubbleAssistant
                  }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Որտե՞ղ ես ուզում ճանապարհորդել ..."
            className="flex-1 border p-2 rounded"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer  disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
            ՈՒղարկել
          </button>
        </form>
      </main>
    </div>
  );
}
