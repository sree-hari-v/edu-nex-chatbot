import { NextResponse } from "next/server";

/**
 * Dynamic Gemini route:
 * - Lists available models for your project at runtime (v1 then v1beta).
 * - Selects the first model that supports "generateContent".
 * - Sends your prompt using the selected model.
 * - Reads responses as text first to avoid JSON parse crashes.
 * - Returns clear JSON errors when models/endpoints aren’t available.
 */

type ListedModel = {
  name: string; // e.g. "models/gemini-1.5-flash-8b"
  supportedGenerationMethods?: string[]; // e.g. ["generateContent", "countTokens"]
};

async function listModels(apiKey: string, version: "v1" | "v1beta"): Promise<{ models: ListedModel[]; error?: string }> {
  try {
    const url = `https://generativelanguage.googleapis.com/${version}/models`;
    const res = await fetch(url + `?key=${encodeURIComponent(apiKey)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const raw = await res.text();
    if (!raw) return { models: [], error: `ListModels empty response (${res.status}) for ${version}` };

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return { models: [], error: `ListModels invalid JSON (${res.status}) for ${version}: ${raw.slice(0, 120)}` };
    }

    if (!res.ok) {
      const msg = data?.error?.message || JSON.stringify(data);
      return { models: [], error: `ListModels API error (${res.status}) for ${version}: ${msg}` };
    }

    const models: ListedModel[] = Array.isArray(data.models) ? data.models : [];
    return { models };
  } catch (e: any) {
    return { models: [], error: `ListModels fetch failed for ${version}: ${e?.message || e}` };
  }
}

function pickGenerateContentModel(models: ListedModel[]) {
  // Prefer flash variants, then pro, then anything that supports generateContent
  const supportsGenerate = (m: ListedModel) =>
    Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent");

  const byPriority = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("flash")) return 1;
    if (n.includes("pro")) return 2;
    return 3;
  };

  const filtered = models.filter(supportsGenerate).sort((a, b) => byPriority(a.name) - byPriority(b.name));
  return filtered[0] || null;
}

export async function POST(req: Request) {
  try {
    // Parse request safely
    let prompt: string | undefined;
    try {
      const body = await req.json();
      prompt = body?.prompt;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }

    // Build combined user prompt (no system_instruction to avoid version field issues)
    const instruction =
      "You are EduNex, an assistant chatbot for Nilgiri College of Arts and Science, Thaloor, The Nilgiris, Tamil Nadu (https://nilgiricollege.ac.in/). " +
      "Always answer as if you represent Nilgiri College of Arts and Science located in Thaloor, The Nilgiris district, Tamil Nadu, India. " +
      "DO NOT confuse this with any other Nilgiri College, especially the one in West Bengal. " +
      "Focus your answers on this specific college's courses, departments, fees, admissions, campus life, etc. " +
      "If you are not sure about exact facts like current fees or dates, say that clearly and " +
      "suggest visiting the official website or contacting the college.";
    const combinedPrompt = `${instruction}\n\nUser question:\n${prompt}`;

    // 1) Try v1 ListModels
    const v1List = await listModels(apiKey, "v1");
    // 2) Fall back to v1beta ListModels if v1 has no usable models
    const v1betaList = (!v1List.models.length ? await listModels(apiKey, "v1beta") : { models: [], error: undefined });

    const chosenV1 = pickGenerateContentModel(v1List.models);
    const chosenV1beta = !chosenV1 ? pickGenerateContentModel(v1betaList.models) : null;

    if (!chosenV1 && !chosenV1beta) {
      const reasons = [
        v1List.error ? `v1: ${v1List.error}` : "",
        v1betaList.error ? `v1beta: ${v1betaList.error}` : "",
        `v1 models (${v1List.models.length}): ${v1List.models.map(m => m.name).join(", ") || "none"}`,
        `v1beta models (${v1betaList.models.length}): ${v1betaList.models.map(m => m.name).join(", ") || "none"}`,
      ]
        .filter(Boolean)
        .join(" | ");

      return NextResponse.json(
        {
          error:
            "No Gemini models supporting generateContent were found for your project in v1 or v1beta. " +
            "Ensure the API key is from a Google Cloud project with Generative Language API enabled and model access. " +
            "Details: " +
            reasons,
        },
        { status: 502 }
      );
    }

    const selected = chosenV1 ? { version: "v1", name: chosenV1.name } : { version: "v1beta", name: chosenV1beta!.name };

    // Endpoint requires bare model name (e.g. "gemini-1.5-pro"), the ListModels returns "models/<model>"
    const bareModel = selected.name.startsWith("models/") ? selected.name.replace(/^models\//, "") : selected.name;
    const url = `https://generativelanguage.googleapis.com/${selected.version}/models/${bareModel}:generateContent`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: combinedPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();

    if (!raw) {
      return NextResponse.json(
        { error: `Gemini ${selected.version}/${bareModel} returned empty response (${res.status})` },
        { status: res.status || 502 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: `Gemini ${selected.version}/${bareModel} returned invalid JSON (${res.status}): ${raw.slice(0, 200)}` },
        { status: res.status || 502 }
      );
    }

    if (!res.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        (typeof data === "string" ? data : JSON.stringify(data));
      return NextResponse.json(
        { error: `Gemini API Error (${selected.version}/${bareModel} - ${res.status}): ${msg}` },
        { status: res.status }
      );
    }

    const candidate = data?.candidates?.[0];
    const answer =
      candidate?.content?.parts
        ?.map((p: any) => (typeof p?.text === "string" ? p.text : ""))
        .filter(Boolean)
        .join("\n") || "";

    if (!answer) {
      return NextResponse.json(
        { error: `Gemini ${selected.version}/${bareModel} response had no content` },
        { status: 500 }
      );
    }

    return NextResponse.json({ text: answer, provider: "gemini", model: bareModel, version: selected.version });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Gemini route failed" },
      { status: 500 }
    );
  }
}