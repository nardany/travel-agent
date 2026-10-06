"use client"
import { useState } from "react"
interface Message {
  id: string,
  role: "user" | "assistant",
  content: string
}
export default function Home() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Բարև, ես կոգնեմ քեզ պլանավորել քո ճամփորդությունը"
    }
  ])


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() === "") {
      return
    }
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: input
      }
    ])

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id : Date.now().toString(),
          role : "assistant",
          content : "Ուսումնասիրեմ և ասեմ քեզ ․․․"
        }
      ])
    }, 1000);
    setInput("")
  }

  return (
    <div>
      <main className="flex flex-col h-screen max-w-2xl mx-auto p-4">
        <h1 className="text-xl font-bold text-center pb-4 border-b">
          Smart AI Travel Agent
        </h1>
        <div className="flex-1 overflow-y-auto py-4">
          <p className="text-gray-500">հաղորդագրությունները...</p>
          {messages.map((message) => (
            <p key={message.id}>
              {message.content}
            </p>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Ո՞ւր ես ուզում ճանապարհորդել..."
            className="flex-1 border p-2 rounded"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Ուղարկել
          </button>
        </form>
      </main>
    </div>
  );
}
