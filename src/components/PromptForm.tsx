"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Trash2, Bot, User } from "lucide-react"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function ReinAI() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load chat history from localStorage on mount
    const saved = localStorage.getItem("reinai-messages")
    if (saved) setMessages(JSON.parse(saved))
  }, [])

  useEffect(() => {
    // Save messages to localStorage when updated
    localStorage.setItem("reinai-messages", JSON.stringify(messages))
  }, [messages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const sendPrompt = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {

       // Check for specific "Who made you?" question
      const lowerCaseMessage = userMessage.toLowerCase()
      if (
        lowerCaseMessage.includes("who made you") ||
        lowerCaseMessage.includes("who created you") ||
        lowerCaseMessage.includes("who built you") ||
        lowerCaseMessage.includes("who developed you")
      ) {
        // Add a small delay to simulate thinking
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "I was made by Reinier Mariscotes if you want to know more about him please do contact im at reinier231@gmail.com",
          },
        ])
        setLoading(false)
        return
      }

      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          messages: newMessages, // Send both for compatibility
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data: { result?: string; error?: string } = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.result ?? "Something went wrong.",
        },
      ])
    } catch (err) {
      console.error("Error sending prompt:", err)
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Failed to send message. Please try again."}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearMessages = () => {
    setMessages([])
    localStorage.removeItem("reinai-messages")
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">ReinAI</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Ask me anything</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="text-gray-500 hover:text-red-500 transition-colors"
            disabled={messages.length === 0}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Clear</span>
          </Button>
        </div>
      </div>

      {/* Chat Messages - Scrollable middle section */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto px-3 sm:px-4">
          <ScrollArea className="h-full py-4" ref={scrollAreaRef}>
            <div className="space-y-3 sm:space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8 sm:py-12">
                  <Bot className="h-10 w-10 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-base sm:text-xl font-medium mb-2">Welcome to ReinAI</p>
                  <p className="text-sm sm:text-base px-4">Start a conversation by typing a message below.</p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] sm:max-w-[75%] lg:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <div className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-500 flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 sm:gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Input Form - Fixed at bottom */}
      <div className="flex-shrink-0 border-t bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendPrompt()
            }}
            className="flex gap-2 sm:gap-3"
          >
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask ReinAI something..."
                className="w-full pr-12 sm:pr-14 border-gray-200 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 text-sm sm:text-base rounded-full"
                disabled={loading}
                autoFocus
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 p-0"
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
