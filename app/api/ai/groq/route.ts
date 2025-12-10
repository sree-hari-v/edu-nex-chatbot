import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are EduNex, an assistant chatbot for Nilgiri College of Arts and Science, Thaloor, The Nilgiris, Tamil Nadu (https://nilgiricollege.ac.in/). " +
              "Always answer as if you represent Nilgiri College of Arts and Science located in Thaloor, The Nilgiris district, Tamil Nadu, India. " +
              "DO NOT confuse this with any other Nilgiri College, especially the one in West Bengal. " +
              "Constrain your answers to plausible information about this specific college: courses, departments, fees, " +
              "admissions, campus life, etc. If something is unclear or not known, say you are not sure and " +
              "suggest visiting the official website or contacting the college office.",
          },
          {
            role: "user",
            content:
              "User asked this (assume they are talking about Nilgiri College of Arts and Science in Thaloor, Tamil Nadu):\n\n" +
              prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      const msg = json.error?.message || `Groq error ${res.status}`;
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const text = json.choices?.[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: "Groq: Empty response" }, { status: 500 });
    }

    return NextResponse.json({ text, provider: "groq" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Groq route failed" }, { status: 500 });
  }
}