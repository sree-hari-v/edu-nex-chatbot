import { NextResponse } from "next/server";

// List available models for your API key (useful for debugging).
export async function GET() {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // Try v1 first; if your key only exposes v1beta, switch below.
    const urlV1 = "https://generativelanguage.googleapis.com/v1/models";
    const resV1 = await fetch(urlV1, {
      headers: { "x-goog-api-key": key },
    });

    if (resV1.ok) {
      const json = await resV1.json();
      return NextResponse.json({ apiVersionTried: "v1", models: json?.models || [] });
    }

    const urlV1beta = "https://generativelanguage.googleapis.com/v1beta/models";
    const resV1beta = await fetch(urlV1beta, {
      headers: { "x-goog-api-key": key },
    });

    const jsonBeta = await resV1beta.json();
    if (!resV1beta.ok) {
      return NextResponse.json(
        { error: jsonBeta?.error?.message || "Failed to list models", raw: jsonBeta },
        { status: resV1beta.status }
      );
    }

    return NextResponse.json({ apiVersionTried: "v1beta", models: jsonBeta?.models || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "ListModels route failed" }, { status: 500 });
  }
}