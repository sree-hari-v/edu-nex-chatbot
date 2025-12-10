import { supabase } from "./supabase";
import { aiReply } from "./ai";
import type { Provider } from "./ai";

export type FaqRow = { id: number; keyword: string | null; keywords: string[] | null; answer: string; updated_at?: string };
export type Suggestion = { label: string; faqId: number };

function norm(s: string) {
  return s.toLowerCase().trim();
}

export async function resolveQuery(
  userText: string,
  provider: Provider
): Promise<{
  suggestions: Suggestion[];
  matchedAnswer?: string;
  aiText?: string;
  aiProvider?: Provider;
  error?: string;
}> {
  const q = norm(userText);

  try {
    const { data: faqs, error } = await supabase
      .from("faq_responses")
      .select("id, keyword, keywords, answer, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = (faqs || []) as FaqRow[];
    const suggestions: Suggestion[] = [];
    let directMatchAnswer: string | undefined;

    for (const row of rows) {
      const k = row.keyword ? norm(row.keyword) : "";
      if (k && q.includes(k)) {
        suggestions.push({ label: row.keyword!, faqId: row.id });
        if (q === k) directMatchAnswer = row.answer;
      }
      if (row.keywords && row.keywords.length > 0) {
        for (const phrase of row.keywords) {
          const p = norm(phrase);
          if (!p) continue;
          if (q.includes(p)) {
            suggestions.push({ label: phrase, faqId: row.id });
            if (q === p) directMatchAnswer = row.answer;
          }
        }
      }
    }

    if (directMatchAnswer) {
      return { suggestions, matchedAnswer: directMatchAnswer };
    }

    if (suggestions.length > 0) {
      return { suggestions };
    }

    const depts = ["bca", "bcom", "bba", "bsc", "ba", "mca", "msc"];
    const baseKeys = ["fees", "syllabus", "admission", "curriculum"];
    const userDept = depts.find((d) => q.includes(d));
    const userBase = baseKeys.find((b) => q.includes(b));
    if (userDept && userBase) {
      const key = `${userBase}-${userDept}`;
      const { data: composite } = await supabase
        .from("faq_responses")
        .select("answer")
        .eq("keyword", key)
        .limit(1)
        .maybeSingle();
      if (composite?.answer) {
        return { suggestions: [], matchedAnswer: composite.answer };
      }
    }

    const aiResult = await aiReply(userText, provider);
    return { suggestions: [], aiText: aiResult.text, aiProvider: provider };
  } catch (e: any) {
    return { suggestions: [], error: e.message || "Unknown error" };
  }
}