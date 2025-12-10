"use client";

import Link from "next/link";
import AdminGuard from "../_components/AdminGuard";
import { supabase } from "../../../api/supabase";
import { useEffect, useState } from "react";

type AdminRow = { id: number; email: string; password: string; role: string; created_at: string };

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setNotice(null);
    try {
      const { data, error } = await supabase
        .from("admins_local")
        .select("id, email, password, role, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAdmins(data || []);
    } catch (e: any) {
      setNotice(e.message || "Error loading admins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addAdmin() {
    if (!email.trim() || !password.trim()) {
      setNotice("Email and password are required.");
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      const { error } = await supabase
        .from("admins_local")
        .insert({ email: email.trim(), password: password.trim(), role });
      if (error) throw error;
      setEmail("");
      setPassword("");
      await load();
    } catch (e: any) {
      setNotice(e.message || "Error adding admin");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    setLoading(true);
    setNotice(null);
    try {
      const { error } = await supabase.from("admins_local").delete().eq("id", id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setNotice(e.message || "Error removing admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white dark:bg-neutral-950 text-black dark:text-neutral-50">
        <header className="px-6 md:px-10 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <Link href="/admin" className="font-semibold">← Admin</Link>
          <h1 className="font-bold">Admins</h1>
        </header>

        <section className="mx-auto max-w-4xl px-6 py-8">
          <div className="rounded-md border border-neutral-300 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold mb-3">Add Admin</h2>
            <div className="space-y-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-neutral-100 dark:bg-neutral-900"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-neutral-100 dark:bg-neutral-900"
              />
              <div className="flex items-center gap-2">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-neutral-100 dark:bg-neutral-900"
                >
                  <option value="admin">admin</option>
                </select>
                <button onClick={addAdmin} disabled={loading} className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700">
                  {loading ? "Saving…" : "Add"}
                </button>
              </div>
              {notice && <div className="text-sm text-red-600 dark:text-red-400">{notice}</div>}
            </div>
          </div>

          <div className="mt-6 rounded-md border border-neutral-300 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold mb-3">Existing Admins</h2>
            {loading ? (
              <div>Loading…</div>
            ) : admins.length === 0 ? (
              <div className="text-sm text-neutral-700 dark:text-neutral-300">No admins yet.</div>
            ) : (
              <ul className="space-y-3">
                {admins.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2">
                    <div>
                      <div className="font-semibold">{a.email}</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">Role: {a.role} · Added: {new Date(a.created_at).toLocaleString()}</div>
                    </div>
                    <button onClick={() => remove(a.id)} className="rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </AdminGuard>
  );
}