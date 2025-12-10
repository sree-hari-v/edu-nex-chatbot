import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: json?.error?.message || `Gemini error ${res.status}` }, { status: res.status });
    }

    const candidate = json.candidates?.[0];
    if (!candidate) return NextResponse.json({ error: "Gemini: No candidates returned" }, { status: 500 });
    if (candidate.finishReason === "SAFETY") return NextResponse.json({ error: "Gemini: Blocked by safety filter" }, { status: 400 });

    const text = candidate.content?.parts?.[0]?.text;
    if (!text) return NextResponse.json({ error: "Gemini: Empty response" }, { status: 500 });

    return NextResponse.json({ text, provider: "gemini" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gemini route failed" }, { status: 500 });
  }
}