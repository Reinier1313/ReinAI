"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Trash2, Bot, User, Cpu } from "lucide-react"
import { ChatSession, ChatMessage } from "@/app/page" // adjust this path if needed

type PromptFormProps = {
  session: ChatSession
  onMessagesUpdate: (messages: ChatMessage[]) => void
}

export default function PromptForm({ session, onMessagesUpdate }: PromptFormProps) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const messages = session.messages

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [messages])

  const sendPrompt = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = { role: "user", content: input.trim() }
    const newMessages: ChatMessage[] = [...messages, userMessage]
    onMessagesUpdate(newMessages)
    setInput("")
    setLoading(true)

    try {
      const lower = input.toLowerCase()
      if (lower.includes("who made you") || lower.includes("who created you") || lower.includes("reinier")) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        onMessagesUpdate([
          ...newMessages,
          {
            role: "assistant",
            content: "I was made by Reinier Mariscotes. You can reach him at reinier231@gmail.com.",
          },
        ])
        return
      }

      const res = await fetch("/api/openai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: userMessage.content,
    messages: newMessages, // include full context
  }),
})

      const data: { result?: string; error?: string } = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || "API request failed")
      }

      onMessagesUpdate([
        ...newMessages,
        { role: "assistant", content: data.result || "Something went wrong." },
      ])
    } catch (err) {
      console.error("Error sending prompt:", err)
      onMessagesUpdate([
        ...newMessages,
        {
          role: "assistant",
          content: `Error: ${
            err instanceof Error ? err.message : "Failed to send message."
          }`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearMessages = () => {
    onMessagesUpdate([])
    localStorage.removeItem("reinai-messages")
  }

  return (
    <div className="flex flex-col min-h-[85vh] sm:min-h-[90vh] max-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">ReinAI</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Ask me anything</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            disabled={messages.length === 0}
            className="text-gray-500 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Clear</span>
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto px-3 sm:px-4">
          <ScrollArea className="h-full py-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                  <Cpu className="h-10 w-10 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Welcome to ReinAI</p>
                  <p className="text-sm">Start a conversation by typing below.</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1 animate-pulse">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendPrompt()
            }}
            className="flex gap-2"
          >
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask ReinAI something..."
                disabled={loading}
                className="w-full pr-10 border-gray-300 dark:border-gray-600 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-full"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
