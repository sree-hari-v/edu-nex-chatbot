"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// --- Icons (Same as before) ---
function IconMessageSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M7 8h10M7 12h6" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 15a4 4 0 0 1-4 4H8l-4 3V5a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v10Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M5 12h14" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
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

export default function LandingPage() {
  const [dark, setDark] = useState(false);

  // Force cleanup on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light"; // Force browser to render standard scrollbars etc
    }
  }, []);

  const toggleTheme = () => {
    setDark((prev) => !prev);
  };

  // --- MANUAL COLOR LOGIC (Bypasses automatic dark mode detection) ---
  const colors = {
    bg: dark ? "bg-neutral-950" : "bg-white",
    textMain: dark ? "text-white" : "text-black",
    textMuted: dark ? "text-neutral-300" : "text-neutral-700",
    textSub: dark ? "text-neutral-400" : "text-neutral-600",
    border: dark ? "border-neutral-800" : "border-neutral-200",
    cardBg: dark ? "bg-neutral-900" : "bg-neutral-100",
    iconColor: dark ? "text-blue-400" : "text-blue-600",
    btnHover: dark ? "hover:bg-neutral-800" : "hover:bg-neutral-100",
  };

  return (
    <main className={`min-h-screen flex flex-col ${colors.bg}`}>
      
      {/* Top Nav */}
      <header className={`flex items-center justify-between px-6 md:px-10 py-4 border-b ${colors.border}`}>
        <div className="flex items-center gap-2">
          <IconMessageSquare className={`h-6 w-6 ${colors.iconColor}`} />
          <span className={`font-bold text-lg ${colors.textMain}`}>EduNex</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`inline-flex items-center gap-2 rounded-md border ${colors.border} px-3 py-1.5 text-sm transition ${colors.btnHover} ${colors.textMain}`}
          >
            {dark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
            <span>{dark ? "Light" : "Dark"} mode</span>
          </button>
          
          {/* Admin Link */}
          <Link
            href="/admin/login"
            className={`rounded-md border ${colors.border} px-3 py-1.5 text-sm transition ${colors.btnHover} ${colors.textMain}`}
          >
            Admin
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 md:px-10 flex-1">
        <div className="mx-auto max-w-6xl py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          
          {/* Left Text */}
          <div>
            <h1 className={`text-4xl md:text-6xl font-extrabold tracking-tight ${colors.textMain}`}>
              Your College AI Assistant
            </h1>
            <p className={`mt-4 text-lg md:text-xl ${colors.textMuted}`}>
              Ask about fees, syllabus, admissions, and more. Privacy-first chat—your history stays
              in your browser session and is deleted when you close the tab.
            </p>
            
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-5 py-3 text-sm md:text-base font-medium hover:bg-blue-700 transition"
              >
                Start Chatting
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://nextjs.org/"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-md border ${colors.border} px-5 py-3 text-sm md:text-base transition ${colors.btnHover} ${colors.textMain}`}
              >
                Built with Next.js
              </a>
            </div>
            
            <div className={`mt-6 text-sm ${colors.textSub}`}>
              Nilgiri College of Arts and Science · Powered by Groq, DeepSeek, and Gemini
            </div>
          </div>

          {/* Right Card */}
          <div className={`rounded-2xl border ${colors.border} ${colors.cardBg} p-6 shadow-sm`}>
            <h2 className={`text-lg font-semibold mb-2 ${colors.textMain}`}>
              What is EduNex?
            </h2>
            <p className={colors.textMuted}>
              EduNex is a student-first AI assistant for Nilgiri College. It helps you quickly find
              answers about courses, fees, syllabus, admissions, and campus information. Designed
              for speed and privacy, your chat history stays only in your browser session and is
              wiped as soon as you close the tab. Admins can securely manage college data and test
              AI responses via a private dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`px-6 md:px-10 py-10 border-t ${colors.border} text-sm`}>
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className={colors.textSub}>
            © {new Date().getFullYear()} EduNex · Sreehari V.
          </div>
          <div className={`flex items-center gap-4 ${colors.textSub}`}>
            <Link href="/chat" className="hover:underline hover:text-blue-500">
              Chat
            </Link>
            <Link href="/admin/login" className="hover:underline hover:text-blue-500">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}