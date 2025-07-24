// route.ts
import { NextResponse } from "next/server"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface RequestBody {
  messages: Message[]
}

export async function POST(req: Request) {
  const { messages }: RequestBody = await req.json()
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is missing from server environment." },
      { status: 500 }
    )
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: 400 })
    }

    return NextResponse.json({ result: data.choices[0].message.content })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
