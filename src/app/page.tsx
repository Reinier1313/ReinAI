"use client"

import { useEffect, useState } from "react"
import PromptForm from "@/components/PromptForm"
import Sidebar from "@/components/Sidebar"
import { v4 as uuid } from "uuid"

// Message and Session Types
export type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export type ChatSession = {
  id: string
  name: string
  messages: ChatMessage[]
  createdAt: number
}

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentId, setCurrentId] = useState<string>("")

  // Load saved sessions
  useEffect(() => {
    const stored = localStorage.getItem("reinai-sessions")
    const parsed: ChatSession[] = stored ? JSON.parse(stored) : []

    if (parsed.length > 0) {
      setSessions(parsed)
      setCurrentId(parsed[0].id)
    } else {
      const newSession = createNewSession(parsed)
      setSessions([newSession])
      setCurrentId(newSession.id)
    }
  }, [])

  // Save sessions on change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("reinai-sessions", JSON.stringify(sessions))
    }
  }, [sessions])

  const createNewSession = (existing: ChatSession[] = sessions): ChatSession => {
    const newSession: ChatSession = {
      id: uuid(),
      name: `Chat ${existing.length + 1}`,
      messages: [],
      createdAt: Date.now(),
    }
    return newSession
  }

  const handleNewSession = () => {
    const newSession = createNewSession()
    setSessions((prev) => [newSession, ...prev])
    setCurrentId(newSession.id)
  }

  const updateMessages = (id: string, messages: ChatMessage[]) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === id ? { ...session, messages } : session
      )
    )
  }

  const currentSession = sessions.find((s) => s.id === currentId)

  return (
    <main className="min-h-screen flex">
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onSelect={setCurrentId}
        onNew={handleNewSession}
      />

      <div className="flex-1 px-4 py-8">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-center text-gray-900 dark:text-gray-100">
            🧠 ReinAI
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6">
            Your intelligent AI assistant
          </p>

          {currentSession && (
            <PromptForm
              session={currentSession}
              onMessagesUpdate={(msgs: ChatMessage[]) =>
                updateMessages(currentSession.id, msgs)
              }
            />
          )}
        </div>

        <footer className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Created by{" "}
          <a
            href="https://my-personal-portfolio-eight-rho.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Reinier Mariscotes
          </a>
        </footer>
      </div>
    </main>
  )
}
