"use client"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Plus, Menu } from "lucide-react"
import { useEffect, useState } from "react"
import { ChatSession } from "@/app/api/openai/chat"

export default function Sidebar({
  sessions,
  currentId,
  onSelect,
  onNew,
}: {
  sessions: ChatSession[]
  currentId: string
  onSelect: (id: string) => void
  onNew: () => void
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-4">
        <SheetHeader>
          <SheetTitle className="text-xl">Chats</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 mt-4">
          <Button onClick={onNew} className="w-full justify-start" variant="secondary">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>

          {sessions.map((s) => (
            <Button
              key={s.id}
              variant={s.id === currentId ? "default" : "ghost"}
              onClick={() => onSelect(s.id)}
              className="w-full justify-start text-left"
            >
              {s.name}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
