"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import styles from "@/app/page.module.css"
import ReactMarkdown from "react-markdown";

interface ChatProps {
  initialConversationId: number | null;
  initialMessages: UIMessage[];
}

export default function Chat({ initialConversationId, initialMessages }: ChatProps) {
  const router = useRouter();
  const [input, setInput] = useState("")
  const conversationIdRef = useRef<number | null>(initialConversationId);

  const { messages, sendMessage, status, stop, error } = useChat({
    messages: initialMessages,

    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages }) => {
        const last = messages[messages.length - 1];
        const text = last.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("");
        return {
          body: {
            conversationId: conversationIdRef.current ?? undefined,
            message: text,
          },
        };
      },
    }),

    onFinish: ({ message }) => {
      const id = (message.metadata as { conversationId?: number } | undefined)?.conversationId;
      if (id && conversationIdRef.current === null) {
        conversationIdRef.current = id;
        router.replace(`/chat/${id}`);
        router.refresh();
      }
    },
  });


  const isBusy = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div>
      <main className="flex flex-col h-screen max-w-2xl mx-auto p-4">
        <h1 className="text-xl font-bold text-center pb-4 border-b">
          Smart AI Travel Agent
        </h1>
        <div className="flex-1 overflow-y-auto py-4">
          {messages.length === 0 && (
            <div className={styles.rowAssistant}>
              <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
                Բարև, ես կօգնեմ քեզ պլանավորել քո ճամփորդությունը Հայաստանում
              </div>
            </div>
          )}

          {messages.map((message) => {
            const text = message.parts
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("");
            const isThinking = message.role === "assistant" && text === "";

            return (
              <div
                key={message.id}
                className={message.role === "user" ? styles.rowUser : styles.rowAssistant}
              >
                <div
                  className={`${styles.bubble} ${message.role === "user" ? styles.bubbleUser : styles.bubbleAssistant
                    } whitespace-pre-wrap`}
                >
                  {isThinking ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <ReactMarkdown>{text}</ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="text-red-500 text-sm pb-2">Սխալ. փորձեք կրկին</p>}

        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Որտե՞ղ ես ուզում ճանապարհորդել ..."
            className="flex-1 border p-2 rounded"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {isBusy ? (
            <button type="button" onClick={() => stop()} className="bg-gray-600 text-white px-4 py-2 rounded">
              Stop
            </button>
          ) : (
            <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={input.trim() === ""}>
              Ուղարկել
            </button>
          )}
        </form>
      </main>
    </div>
  );
}
