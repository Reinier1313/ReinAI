"use client"

import { useEffect, useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Trash2, Bot, User, Sparkles } from "lucide-react"
import type { ChatMessage, ChatSession } from "@/app/page"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github.css"

type PromptFormProps = {
  session: ChatSession
  onMessagesUpdate: (messages: ChatMessage[]) => void
}

export default function PromptForm({ session, onMessagesUpdate }: PromptFormProps) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [session.messages])

  const sendPrompt = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMessage: ChatMessage = { role: "user", content: trimmed }
    const updatedMessages = [...session.messages, userMessage]
    setInput("")
    setLoading(true)
    onMessagesUpdate(updatedMessages)

    try {
      const lower = trimmed.toLowerCase()
      if (lower.includes("who made you") || lower.includes("who created you") || lower.includes("who built you")) {
        await new Promise((res) => setTimeout(res, 500))
        const botReply: ChatMessage = {
          role: "assistant",
          content:
            "I was made by **Reinier Mariscotes**. You can contact him at [reinier231@gmail.com](mailto:reinier231@gmail.com).",
        }
        onMessagesUpdate([...updatedMessages, botReply])
        return
      }

      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, messages: updatedMessages }),
      })

      const data = await res.json()
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.result ?? "Something went wrong.",
      }

      onMessagesUpdate([...updatedMessages, assistantMessage])
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "⚠️ Failed to get a response. Please try again later.",
      }
      onMessagesUpdate([...updatedMessages, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    onMessagesUpdate([])
  }

  return (
    <div className="flex flex-col h-[80vh] bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="relative p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10" />
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-800 dark:text-white">ReinAI</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI Assistant</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 rounded-xl"
            disabled={session.messages.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Clear Chat</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-6">
          {session.messages.length === 0 && (
            <div className="text-center mt-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Welcome to ReinAI</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Start a conversation and experience intelligent AI assistance. Ask me anything!
              </p>
            </div>
          )}

          {session.messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex gap-4 max-w-4xl">
                {msg.role === "assistant" && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mt-1 shadow-lg flex-shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}

                <div
                  className={`prose prose-sm sm:prose-base max-w-none px-5 py-4 rounded-2xl whitespace-pre-wrap shadow-sm transition-all duration-200 hover:shadow-md ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-slate-800 to-slate-700 text-white dark:from-slate-700 dark:to-slate-600 ml-12"
                      : "bg-white/80 text-slate-800 dark:bg-slate-800/80 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm"
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                       code: ({ inline, className, children, ...props }: any) => {
                        if (inline) {
                          return (
                            <code
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        }
                        return (
                          <code
                            className={`${className} block p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700`}
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      },
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {msg.role === "user" && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center mt-1 shadow-lg flex-shrink-0">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Bot className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-sm font-medium">ReinAI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendPrompt()
        }}
        className="p-6 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md"
      >
        <div className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask ReinAI something amazing..."
              className="pr-12 h-12 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:shadow-md transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              disabled={loading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                ⏎
              </kbd>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            size="lg"
            className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}
