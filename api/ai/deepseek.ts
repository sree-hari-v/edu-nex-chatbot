const DEEPSEEK_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY as string;
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

export async function deepseekReply(prompt: string): Promise<string> {
  if (!DEEPSEEK_KEY) throw new Error("Missing NEXT_PUBLIC_DEEPSEEK_API_KEY");
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek error: ${err}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content || "";
  return text || "No response from DeepSeek.";
}