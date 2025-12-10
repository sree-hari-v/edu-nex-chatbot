export type Provider = "gemini" | "groq";

function wrapForNilgiri(prompt:  string): string {
  return (
    "The user is asking about Nilgiri College of Arts and Science, Thaloor, The Nilgiris, Tamil Nadu, India. " +
    "Please answer accordingly.\n\n" +
    prompt
  );
}

export async function aiReply(
  prompt: string,
  provider: Provider
): Promise<{ text:  string; provider: Provider }> {
  const endpoint = provider === "gemini" ?  "/api/ai/gemini" : "/api/ai/groq";

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type":  "application/json" },
      body:  JSON.stringify({ prompt: wrapForNilgiri(prompt) }),
    });
  } catch (fetchError: any) {
    throw new Error(`Failed to connect to ${provider}: ${fetchError?.message || "Network error"}`);
  }

  // Read response as text first to avoid JSON parse crashes
  const raw = await res. text();

  if (!raw) {
    throw new Error(`${provider} returned empty response (${res. status})`);
  }

  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`${provider} returned invalid JSON (${res.status}): ${raw.slice(0, 200)}`);
  }

  if (!res.ok || json.error) {
    throw new Error(json.error || `${provider} API error (${res. status})`);
  }

  if (!json.text) {
    throw new Error(`${provider} returned empty response`);
  }

  return { text: json.text as string, provider };
}
