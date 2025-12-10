import { NextResponse } from "next/server";
import { supabase } from "../../../../api/supabase";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    const { data, error } = await supabase
      .from("faq_responses")
      .select("answer")
      .eq("id", id)
      .limit(1)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ answer: data?.answer || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "FAQ fetch error" }, { status: 500 });
  }
}