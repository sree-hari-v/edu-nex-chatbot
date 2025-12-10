"use client";

import { useState } from "react";
import Link from "next/link";
import { adminLogin } from "../../../api/admin_local";

function IconSun(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="4" strokeWidth="2" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconMoon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M20 15.5A8.5 8.5 0 1 1 8.5 4 7 7 0 0 0 20 15.5Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState<boolean>(false);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = !dark;
    root.classList.toggle("dark", next);
    root.style.colorScheme = next ? "dark" : "light";
    setDark(next);
  };

  async function signIn() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await adminLogin(email.trim(), password);
      if (res) {
        window.location.href = "/admin";
      } else {
        setNotice("Invalid email or password.");
      }
    } catch (e: any) {
      setNotice(e.message || "Failed to login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-black dark:text-neutral-50">
      <header className="px-6 md:px-10 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <Link href="/" className="font-semibold">← EduNex</Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {dark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
            <span>{dark ? "Light" : "Dark"} mode</span>
          </button>
          <h1 className="font-bold">Admin Login</h1>
        </div>
      </header>

      <section className="mx-auto max-w-sm px-6 py-10">
        <div className="space-y-4">
          <input
            type="email"
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-neutral-100"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <input
            type="password"
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-neutral-100"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            onClick={signIn}
            disabled={loading}
            className="w-full rounded-md bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          {notice && <div className="text-sm text-red-600 dark:text-red-400">{notice}</div>}
        </div>
        <p className="mt-4 text-xs text-neutral-600 dark:text-neutral-400">
          Login checks the admins_local table (plain email + password).
        </p>
      </section>
    </main>
  );
}