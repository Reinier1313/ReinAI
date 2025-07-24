"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

    const newMessages: Message[] = [...messages, { role: "user", content: input }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      })

      const data: { result?: string } = await res.json()

      setMessages([...newMessages, { role: "assistant", content: data.result ?? "Something went wrong." }])
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Error sending prompt." }])
    } finally {
      setLoading(false)
    }
  }

  const clearMessages = () => {
    setMessages([])
    localStorage.removeItem("reinai-messages")
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-2 sm:p-4 lg:p-6">
      <Card className="w-full max-w-4xl flex flex-col h-[80vh] shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg sm:text-xl text-gray-800 dark:text-gray-200">ReinAI</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-gray-500 hover:text-red-500 transition-colors"
              disabled={messages.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col flex-grow overflow-hidden p-3 sm:p-6">
          <ScrollArea className="flex-grow pr-2 sm:pr-4" ref={scrollAreaRef}>
            <div className="space-y-4 sm:space-y-6">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8 sm:mt-12">
                  <Bot className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg sm:text-xl font-medium mb-2">Welcome to ReinAI</p>
                  <p className="text-sm sm:text-base">Start a conversation by typing a message below.</p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 sm:gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[80%] lg:max-w-[70%] rounded-2xl px-4 py-3 sm:px-5 sm:py-4 ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white ml-auto"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <div className="text-sm sm:text-base whitespace-pre-wrap break-words">{msg.content}</div>
                  </div>

                  {msg.role === "user" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-500 flex items-center justify-center">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 sm:gap-4 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendPrompt()
            }}
            className="flex gap-2 sm:gap-3 mt-4 sm:mt-6 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask ReinAI something..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-blue-500 text-sm sm:text-base"
              disabled={loading}
              autoFocus
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>

    //sample push
  )
}
