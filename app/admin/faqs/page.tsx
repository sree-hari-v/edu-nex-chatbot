"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../api/supabase";
import { getAdminSession } from "../../../api/admin_local";

type FaqRow = {
  id: number;
  keyword: string | null;
  keywords: string[] | null;
  answer: string;
};

export default function AdminFaqPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Form state
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [extraKeywords, setExtraKeywords] = useState<string[]>([""]);
  const [defaultQuestion, setDefaultQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = getAdminSession();
    if (!s) {
      router.push("/admin/login");
      return;
    }
    loadFaqs().finally(() => setLoading(false));
  }, [router]);

  async function loadFaqs() {
    const { data, error } = await supabase
      .from("faq_responses")
      .select("id, keyword, keywords, answer")
      .order("id", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setFaqs((data || []) as FaqRow[]);
    }
  }

  function addKeywordField() {
    setExtraKeywords((prev) => [...prev, ""]);
  }

  function updateKeywordField(index: number, value: string) {
    setExtraKeywords((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }

  function removeKeywordField(index: number) {
    setExtraKeywords((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!primaryKeyword.trim()) {
      setError("Please enter at least one main keyword.");
      return;
    }
    if (!answer.trim()) {
      setError("Answer cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      // Build keywords array from non-empty extra keyword fields
      const keywordsArray = extraKeywords
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      // We'll store the "default question" simply by
      // including that phrase as one of the keywords too, so
      // the chat can match it exactly if needed.
      if (defaultQuestion.trim().length > 0) {
        keywordsArray.push(defaultQuestion.trim());
      }

      const { error: insertError } = await supabase.from("faq_responses").insert([
        {
          keyword: primaryKeyword.trim(),
          keywords: keywordsArray.length > 0 ? keywordsArray : null,
          answer: answer.trim(),
        },
      ]);

      if (insertError) {
        setError(insertError.message);
      } else {
        setPrimaryKeyword("");
        setExtraKeywords([""]);
        setDefaultQuestion("");
        setAnswer("");
        await loadFaqs();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faq_responses").delete().eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    }
  }

  if (loading) return null;

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              ← Admin
            </Link>
            <span className="text-sm text-neutral-400">/ FAQs</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold">Manage FAQs</h1>
        </header>

        {/* Add FAQ card */}
        <section className="mb-8">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Add FAQ</h2>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Primary keyword */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Main keyword
                </label>
                <input
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='e.g. "bca-fees" or "admission-bca"'
                  value={primaryKeyword}
                  onChange={(e) => setPrimaryKeyword(e.target.value)}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Internal ID used to group this FAQ (also matched if the user types it exactly).
                </p>
              </div>

              {/* Extra keywords (dynamic fields) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Keywords / phrases
                  </label>
                  <button
                    type="button"
                    onClick={addKeywordField}
                    className="inline-flex items-center rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                  >
                    + Add keyword
                  </button>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  Add phrases the user might type, e.g. <span className="italic">"bca fees"</span>,{" "}
                  <span className="italic">"bca course fee"</span>, <span className="italic">"tuition"</span>.
                </p>

                <div className="space-y-2">
                  {extraKeywords.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Keyword ${idx + 1}`}
                        value={val}
                        onChange={(e) => updateKeywordField(idx, e.target.value)}
                      />
                      {extraKeywords.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeKeywordField(idx)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Default "Do you mean" question */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Default question to ask user
                </label>
                <input
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='e.g. Do you mean "BCA course fees" at Nilgiri College?'
                  value={defaultQuestion}
                  onChange={(e) => setDefaultQuestion(e.target.value)}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Optional. This is what the bot can use in a “Did you mean…?” prompt for this FAQ.
                </p>
              </div>

              {/* Answer */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Answer
                </label>
                <textarea
                  className="w-full min-h-[120px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Final answer shown to the user when this FAQ is matched."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Create FAQ"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* List all FAQs */}
        <section>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">All FAQs</h2>
            {faqs.length === 0 && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No FAQs yet.</p>
            )}
            <div className="space-y-3">
              {faqs.map((f) => (
                <div
                  key={f.id}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                >
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">
                      #{f.id} • <span className="text-blue-600 dark:text-blue-400">{f.keyword || "(no keyword)"}</span>
                    </div>
                    {f.keywords && f.keywords.length > 0 && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Keywords: {f.keywords.join(", ")}
                      </div>
                    )}
                    <div className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                      {f.answer}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="self-end text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}