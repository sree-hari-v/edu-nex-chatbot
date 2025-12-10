const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY as string;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

export async function groqReply(prompt: string): Promise<string> {
  if (!GROQ_KEY) throw new Error("Missing NEXT_PUBLIC_GROQ_API_KEY");
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${err}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content || "";
  return text || "No response from Groq.";
}