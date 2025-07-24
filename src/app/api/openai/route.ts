import { NextResponse } from "next/server"

interface PromptRequestBody {
  prompt: string
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string
    }
  }[]
  error?: {
    message: string
  }
}

export async function POST(req: Request) {
  let body: PromptRequestBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 })
  }

  const { prompt } = body
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
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data: OpenRouterResponse = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "API error" },
        { status: response.status }
      )
    }

    return NextResponse.json({ result: data.choices[0].message.content })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
