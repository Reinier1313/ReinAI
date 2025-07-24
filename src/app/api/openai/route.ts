import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { prompt } = await req.json()
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
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: 400 })
    }

    return NextResponse.json({ result: data.choices[0].message.content })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
