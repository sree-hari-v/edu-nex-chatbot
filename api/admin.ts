import { supabase } from "./supabase";

// Get current auth user
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

// Check if current user is admin (exists in admins table)
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("Admin check error:", error);
    return false;
  }
  return !!data?.user_id;
}

// Get a user id by email from Supabase Auth admin list (client cannot list users).
// For security, ask admin to input the user's auth user_id directly OR let the user sign in once and you capture their id.
// As a simpler client-side approach, we'll take a user_id input instead of email.
export async function addAdminByUserId(userId: string, role: string = "admin") {
  const { error } = await supabase.from("admins").insert({ user_id: userId, role });
  if (error) throw error;
}

export async function listAdmins() {
  const { data, error } = await supabase.from("admins").select("user_id, role, created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function removeAdmin(userId: string) {
  const { error } = await supabase.from("admins").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function listFaqs() {
  const { data, error } = await supabase
    .from("faq_responses")
    .select("id, keyword, answer, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertFaq(id: number | null, keyword: string, answer: string) {
  if (id) {
    const { error } = await supabase.from("faq_responses").update({ keyword, answer }).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("faq_responses").insert({ keyword, answer });
    if (error) throw error;
  }
}

export async function deleteFaq(id: number) {
  const { error } = await supabase.from("faq_responses").delete().eq("id", id);
  if (error) throw error;
}