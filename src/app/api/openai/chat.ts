// types/chat.ts
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
