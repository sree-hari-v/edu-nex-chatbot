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

  const raw = await res.text();

  if (!raw) {
    throw new Error(`Groq returned empty response (${res.status})`);
  }

  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Groq returned invalid JSON (${res.status}): ${raw.slice(0, 200)}`);
  }

  if (!res.ok) {
    const errorMessage = json?.error?.message || json?.error || JSON.stringify(json);
    throw new Error(`Groq error (${res.status}): ${errorMessage}`);
  }

  const text = json?.choices?.[0]?.message?.content || "";
  return text || "No response from Groq.";
}