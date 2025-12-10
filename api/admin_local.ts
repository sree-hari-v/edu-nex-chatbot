import { supabase } from "./supabase";

export type AdminSession = { id: number; email: string; role: string; created_at: string };
const SESSION_KEY = "edunex_admin_session_v1";

export async function adminLogin(email: string, password: string): Promise<AdminSession | null> {
  const { data, error } = await supabase
    .from("admins_local")
    .select("id, email, role, created_at")
    .eq("email", email)
    .eq("password", password)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message || "Login query failed");
  if (data) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    return data as AdminSession;
  }
  return null;
}
export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw || raw === "{}" || raw === "null" || raw.trim() === "") return null;
    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    if (typeof parsed.id === "number" && typeof parsed.email === "string" && typeof parsed.role === "string") return parsed as AdminSession;
    return null;
  } catch {
    return null;
  }
}
export function clearAdminSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}