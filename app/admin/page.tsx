"use client";

import Link from "next/link";
import AdminGuard from "./_components/AdminGuard";
import { clearAdminSession } from "../../api/admin_local";
import { useEffect, useState } from "react";
import { supabase } from "../../api/supabase";

type AdminRow = { id: number; email: string; role: string; created_at: string };
type FaqRow = { id: number; keyword: string; updated_at: string };

/* Use correct SVG prop typing everywhere so TypeScript/Vercel are happy */
function IconChat(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M7 8h10M7 12h6" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-4 3V5a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v10Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconBook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" strokeWidth="2" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconArrow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M5 12h14" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M12 5l7 7-7 7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconSun(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="4" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconMoon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="M20 15.5A8.5 8.5 0 1 1 8.5 4 7 7 0 0 0 20 15.5Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminHome() {
  const [dark, setDark] = useState(false);

  // Keep theme behaviour the same, but guard for server-side rendering
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    setDark(root.classList.contains("dark"));

    const obs = new MutationObserver(() => {
      setDark(root.classList.contains("dark"));
    });

    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const toggleTheme = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const next = !dark;
    root.classList.toggle("dark", next);
    root.style.colorScheme = next ? "dark" : "light";
    setDark(next);
  };

  function signOut() {
    clearAdminSession();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }

  const [stats, setStats] = useState<{ admins: number; faqs: number }>({ admins: 0, faqs: 0 });
  const [recentAdmins, setRecentAdmins] = useState<AdminRow[]>([]);
  const [recentFaqs, setRecentFaqs] = useState<FaqRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: admins, error: adminsError } = await supabase
          .from("admins_local")
          .select("id, email, role, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        const { data: faqs, error: faqsError } = await supabase
          .from("faq_responses")
          .select("id, keyword, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5);

        if (adminsError || faqsError) {
          throw new Error(adminsError?.message || faqsError?.message);
        }

        setRecentAdmins(admins || []);
        setRecentFaqs(faqs || []);
        setStats({
          admins: admins ? admins.length : 0,
          faqs: faqs ? faqs.length : 0,
        });
      } catch (e: any) {
        setNotice(e?.message || "Failed to load dashboard data.");
      }
    }
    load();
  }, []);

  const colors = {
    bg: dark ? "bg-neutral-950" : "bg-white",
    text: dark ? "text-neutral-50" : "text-black",
    subText: dark ? "text-neutral-400" : "text-neutral-600",
    border: dark ? "border-neutral-800" : "border-neutral-200",
    cardBg: dark ? "bg-neutral-900" : "bg-neutral-50",
  };

  return (
    <AdminGuard>
      <main className={`min-h-screen ${colors.bg} ${colors.text}`}>
        {/* Top bar with theme toggle */}
        <header
          className={`px-6 md:px-10 py-4 border-b ${colors.border} flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            <IconChat className={`h-6 w-6 ${dark ? "text-blue-400" : "text-blue-600"}`} />
            <span className="font-semibold">EduNex Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-md border ${colors.border} px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition`}
              aria-label="Toggle theme"
            >
              {dark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
              <span>{dark ? "Light" : "Dark"} mode</span>
            </button>
            <Link
              href="/chat"
              className={`rounded-md border ${colors.border} px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800`}
            >
              Open Chat
            </Link>
            <button
              onClick={signOut}
              className="rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="px-6 md:px-10 py-8">
          <div className="mx-auto max-w-6xl">
            <div className={`rounded-2xl ${colors.cardBg} border ${colors.border} p-6 md:p-8`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Welcome back, Admin
                  </h1>
                  <p className={`mt-2 ${colors.subText}`}>
                    Manage FAQs and administrators. All data lives in Supabase tables.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/admin/faqs"
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
                  >
                    <IconBook className="h-4 w-4" />
                    Manage FAQs
                  </Link>
                  <Link
                    href="/admin/admins"
                    className="inline-flex items-center gap-2 rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <IconUsers className="h-4 w-4" />
                    Manage Admins
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="px-6 md:px-10">
          <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`rounded-xl ${colors.cardBg} border ${colors.border} p-5`}>
              <div className="text-sm uppercase tracking-wide">Admins</div>
              <div className="mt-2 text-3xl font-bold">{stats.admins}</div>
              <p className={`mt-1 text-sm ${colors.subText}`}>Recently added admins</p>
            </div>
            <div className={`rounded-xl ${colors.cardBg} border ${colors.border} p-5`}>
              <div className="text-sm uppercase tracking-wide">FAQs</div>
              <div className="mt-2 text-3xl font-bold">{stats.faqs}</div>
              <p className={`mt-1 text-sm ${colors.subText}`}>Latest edited responses</p>
            </div>
            <div className={`rounded-xl ${colors.cardBg} border ${colors.border} p-5`}>
              <div className="text-sm uppercase tracking-wide">Quick Actions</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700"
                >
                  <IconChat className="h-4 w-4" />
                  Chat
                </Link>
                <Link
                  href="/admin/faqs"
                  className="inline-flex items-center gap-2 rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <IconBook className="h-4 w-4" />
                  FAQs
                </Link>
                <Link
                  href="/admin/admins"
                  className="inline-flex items-center gap-2 rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <IconUsers className="h-4 w-4" />
                  Admins
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Recent lists */}
        <section className="px-6 md:px-10 py-8">
          <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`rounded-xl ${colors.cardBg} border ${colors.border} p-5`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Admins</h2>
                <Link
                  href="/admin/admins"
                  className="inline-flex items-center gap-1 text-sm hover:underline"
                >
                  View all <IconArrow className="h-4 w-4" />
                </Link>
              </div>
              <ul className="mt-3 space-y-2">
                {recentAdmins.length === 0 ? (
                  <li className={colors.subText}>No admins yet.</li>
                ) : (
                  recentAdmins.map((a) => (
                    <li
                      key={a.id}
                      className={`rounded-md border ${colors.border} px-3 py-2 flex items-center justify-between`}
                    >
                      <div>
                        <div className="font-medium">{a.email}</div>
                        <div className={`text-xs ${colors.subText}`}>
                          Role: {a.role} · {new Date(a.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Link href="/admin/admins" className="text-sm hover:underline">
                        Manage
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className={`rounded-xl ${colors.cardBg} border ${colors.border} p-5`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent FAQs</h2>
                <Link
                  href="/admin/faqs"
                  className="inline-flex items-center gap-1 text-sm hover:underline"
                >
                  View all <IconArrow className="h-4 w-4" />
                </Link>
              </div>
              <ul className="mt-3 space-y-2">
                {recentFaqs.length === 0 ? (
                  <li className={colors.subText}>No FAQs yet.</li>
                ) : (
                  recentFaqs.map((f) => (
                    <li
                      key={f.id}
                      className={`rounded-md border ${colors.border} px-3 py-2 flex items-center justify-between`}
                    >
                      <div>
                        <div className="font-medium">{f.keyword}</div>
                        <div className={`text-xs ${colors.subText}`}>
                          Updated: {new Date(f.updated_at).toLocaleString()}
                        </div>
                      </div>
                      <Link href="/admin/faqs" className="text-sm hover:underline">
                        Edit
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {notice && (
            <div className={`mx-auto max-w-6xl mt-6 text-sm ${colors.subText}`}>{notice}</div>
          )}
        </section>

        {/* Footer */}
        <footer
          className={`px-6 md:px-10 py-8 border-t ${colors.border} ${colors.subText} text-sm`}
        >
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <div>© {new Date().getFullYear()} EduNex · Admin Panel</div>
            <div className="flex items-center gap-4">
              <Link href="/chat" className="hover:underline">
                Chat
              </Link>
              <Link href="/admin/faqs" className="hover:underline">
                FAQs
              </Link>
              <Link href="/admin/admins" className="hover:underline">
                Admins
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </AdminGuard>
  );
}