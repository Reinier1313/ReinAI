"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Trash2, Bot, User, Cpu, Copy, Check } from "lucide-react"
import type { ChatSession, ChatMessage } from "@/app/page" // adjust this path if needed
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { JSX } from "react" // Import JSX to declare HeadingTag

type PromptFormProps = {
  session: ChatSession
  onMessagesUpdate: (messages: ChatMessage[]) => void
}

export default function PromptForm({ session, onMessagesUpdate }: PromptFormProps) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [model, setModel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("reinai-model") || "mistralai/mistral-7b-instruct:free"
    }
    return "mistralai/mistral-7b-instruct:free"
  })

  useEffect(() => {
    localStorage.setItem("reinai-model", model)
  }, [model])

  const messages = session.messages

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Enhanced message formatting function
  const formatMessage = (content: string) => {
    // Split content into paragraphs
    const paragraphs = content.split("\n\n").filter((p) => p.trim())

    return paragraphs.map((paragraph, index) => {
      // Check if it's a code block
      if (paragraph.includes("```")) {
        const codeMatch = paragraph.match(/```(\w+)?\n?([\s\S]*?)```/)
        if (codeMatch) {
          const language = codeMatch[1] || "text"
          const code = codeMatch[2]
          return (
            <div key={index} className="my-3">
              <div className="bg-gray-900 dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-700">
                  <Badge variant="secondary" className="text-xs">
                    {language}
                  </Badge>
                </div>
                <pre className="p-4 text-sm text-green-400 overflow-x-auto">
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          )
        }
      }

      // Check if it's a list
      if (paragraph.includes("•") || paragraph.match(/^\d+\./m)) {
        const items = paragraph.split("\n").filter((item) => item.trim())
        return (
          <div key={index} className="my-2">
            <ul className="space-y-1 ml-4">
              {items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{item.replace(/^[•\d+.]\s*/, "")}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      }

      // Check if it's a heading
      if (paragraph.startsWith("#")) {
        const level = paragraph.match(/^#+/)?.[0].length || 1
        const text = paragraph.replace(/^#+\s*/, "")
        const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements

        return (
          <div key={index}>
            {React.createElement(HeadingTag, { className: "font-bold text-gray-900 dark:text-gray-100 my-3" }, text)}
          </div>
        )
      }

      // Regular paragraph with enhanced formatting
      return (
        <p key={index} className="mb-3 leading-relaxed">
          {paragraph.split("**").map((part, partIndex) =>
            partIndex % 2 === 1 ? (
              <strong key={partIndex} className="font-semibold text-gray-900 dark:text-gray-100">
                {part}
              </strong>
            ) : (
              part
            ),
          )}
        </p>
      )
    })
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

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
            content:
              "I was made by **Reinier Mariscotes**. You can reach him at reinier231@gmail.com.\n\n• Passionate AI Developer\n• Building innovative solutions\n• Front-End Developer\n• SEO Specialist\n• Always learning and improving",
          },
        ])
        return
      }

      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage.content,
          messages: newMessages,
          model,
        }),
      })

      const data: { result?: string; error?: string } = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || "API request failed")
      }

      onMessagesUpdate([...newMessages, { role: "assistant", content: data.result || "Something went wrong." }])
    } catch (err) {
      console.error("Error sending prompt:", err)
      onMessagesUpdate([
        ...newMessages,
        {
          role: "assistant",
          content: `**Error:** ${
            err instanceof Error ? err.message : "Failed to send message."
          }\n\nPlease try again or contact support if the issue persists.`,
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

  const getModelDisplayName = (modelId: string) => {
    if (modelId.includes("mistral")) return "Mistral 7B"
    if (modelId.includes("qwen")) return "Qwen Coder"
    if (modelId.includes("moonshot")) return "Moonshot AI"
    if (modelId.includes("google")) return "Gemini"
    return "Unknown Model"
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 dark:from-gray-900 dark:via-blue-900/10 dark:to-gray-800">
      {/* Enhanced Header */}
      <div className="flex-shrink-0 p-4 border-b bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ReinAI
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Powered by {getModelDisplayName(model)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            disabled={messages.length === 0}
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Clear</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Chat Area - Single Scroll */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto py-4 space-y-6" ref={scrollAreaRef}>
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-16">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Cpu className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome to ReinAI
                </h2>
                <p className="text-sm mb-4">Your intelligent assistant is ready to help</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                  <Badge variant="outline" className="text-xs">
                    Ask questions
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Get explanations
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Write code
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Solve problems
                  </Badge>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}>
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`group relative max-w-[85%] ${msg.role === "user" ? "order-1" : ""}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm shadow-sm transition-all duration-200 ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200 dark:shadow-blue-900/50"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-gray-100 dark:shadow-gray-900/50"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">{formatMessage(msg.content)}</div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
                    )}
                  </div>

                  {msg.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(msg.content, idx)}
                      className="absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6 px-2"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center shadow-md order-2">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">ReinAI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="flex-shrink-0 border-t bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendPrompt()
            }}
            className="flex gap-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
              {/* Enhanced Model Selector */}
              <div className="flex-shrink-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Bot className="w-3 h-3 mr-1" />
                      {getModelDisplayName(model)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3 text-sm">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Select Model
                      </Label>
                      {[
                        { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B", desc: "Fast & efficient" },
                        { id: "qwen/qwen3-coder:free", name: "Qwen Coder", desc: "Code specialist" },
                        { id: "moonshotai/kimi-k2:free", name: "Moonshot AI", desc: "Creative & versatile" },
                        { id: "google/gemma-3-4b-it:free", name: "Gemini", desc: "Google's Choice" },
                      ].map((modelOption) => (
                        <div
                          key={modelOption.id}
                          onClick={() => setModel(modelOption.id)}
                          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="font-medium">{modelOption.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{modelOption.desc}</div>
                          </div>
                          {model === modelOption.id && <Check className="w-4 h-4 text-green-500" />}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Enhanced Input with Send Button */}
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask ReinAI anything..."
                  disabled={loading}
                  className="w-full pr-12 border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full bg-white dark:bg-gray-800 shadow-sm"
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
