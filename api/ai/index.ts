export type Provider = "gemini" | "groq";

// Simple helper to bias generic questions toward Nilgiri College context
function wrapForNilgiri(prompt: string): string {
  const trimmed = prompt.trim().toLowerCase();

  // If user already mentions nilgiri, don't touch it
  if (trimmed.includes("nilgiri college of arts and science thaloor the nilgiris")) return prompt;

  // Light heuristic: if talking about fees, syllabus, admission, etc., add context
  const focusWords = ["fee", "fees", "syllabus", "admission", "course", "bca", "bcom", "bba", "msc", "mca"];
  const mentionsFocus = focusWords.some((w) => trimmed.includes(w));

  if (mentionsFocus) {
    return `Regarding Nilgiri College of arts and science thaloor the nilgiris, ${prompt}`;
  }

  // Generic fallback
  return `At Nilgiri College, ${prompt}`;
}

export async function aiReply(
  prompt: string,
  provider: Provider
): Promise<{ text: string; provider: Provider }> {
  const endpoint = provider === "gemini" ? "/api/ai/gemini" : "/api/ai/groq";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: wrapForNilgiri(prompt) }),
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error || `${provider} API error (${res.status})`);
  }

  if (!json.text) {
    throw new Error(`${provider} returned empty response`);
  }

  return { text: json.text as string, provider };
}