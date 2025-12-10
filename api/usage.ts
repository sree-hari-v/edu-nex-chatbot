export type Provider = "gemini" | "groq";

const DAILY_LIMITS: Record<Provider, number> = { gemini: 20, groq: 30 };
const TOTAL_LIMIT = 60;

type Usage = { date: string; counts: Record<Provider, number> };
const STORAGE_KEY = "edunex_usage_v2";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function load(): Usage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = todayKey();
    if (!raw) return { date: today, counts: { gemini: 0, groq: 0 } };
    const parsed = JSON.parse(raw) as Usage;
    if (parsed.date !== today) return { date: today, counts: { gemini: 0, groq: 0 } };
    return parsed;
  } catch {
    return { date: todayKey(), counts: { gemini: 0, groq: 0 } };
  }
}
function save(u: Usage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  } catch {}
}

export function getRemaining(provider: Provider) {
  const u = load();
  const used = u.counts[provider] || 0;
  const perProviderRemain = Math.max(0, DAILY_LIMITS[provider] - used);
  const totalUsed = (u.counts.gemini || 0) + (u.counts.groq || 0);
  const totalRemain = Math.max(0, TOTAL_LIMIT - totalUsed);
  return { perProviderRemain, totalRemain, perProviderLimit: DAILY_LIMITS[provider], totalLimit: TOTAL_LIMIT };
}
export function canUse(provider: Provider) {
  const { perProviderRemain, totalRemain } = getRemaining(provider);
  return perProviderRemain > 0 && totalRemain > 0;
}
export function increment(provider: Provider) {
  const u = load();
  u.counts[provider] = (u.counts[provider] || 0) + 1;
  save(u);
}
export function getAllRemaining() {
  const rGem = getRemaining("gemini");
  const rGroq = getRemaining("groq");
  return {
    gemini: rGem.perProviderRemain,
    groq: rGroq.perProviderRemain,
    total: rGem.totalRemain,
  };
}