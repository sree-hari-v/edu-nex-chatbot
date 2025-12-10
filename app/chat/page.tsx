"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { resolveQuery, type Suggestion } from "../../api/chat";
import { getAdminSession } from "../../api/admin_local";
import { canUse, increment, getAllRemaining } from "../../api/usage";
import type { Provider } from "../../api/usage";

type MsgRole = "user" | "assistant";
type Message = {
  id: string;
  role: MsgRole;
  content: string;
  time: number;
  isError?: boolean;
  meta?: { provider?: Provider; usedAI?: boolean };
};

type PendingConfirmation = {
  label: string;
  faqId?: number;
  originalText: string;
};

const STORAGE_KEY = "edunex_chat_history_modern_styled_v1";

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* Icons */
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
function IconSend(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 2l-7 20-4-9-9-4 20-7Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconUser(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="7" r="4" strokeWidth="2" />
      <path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconBot(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="3" y="7" width="18" height="12" rx="3" strokeWidth="2" />
      <path d="M9 7V4h6v3" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="13" r="1" />
      <circle cx="15" cy="13" r="1" />
    </svg>
  );
}
function IconSpark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevronUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M18 15l-6-6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ChatPage() {
  /* Theme */
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  /* Admin session */
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  useEffect(() => {
    const s = getAdminSession();
    setIsAdminLoggedIn(!!s && typeof s.id === "number");
    setCheckedAdmin(true);
  }, []);

  /* Provider & quotas */
  const [provider, setProvider] = useState<Provider>(
    (process.env.NEXT_PUBLIC_AI_PROVIDER as Provider) || "groq"
  );
  const [remaining, setRemaining] = useState(getAllRemaining());
  const refreshRemaining = () => setRemaining(getAllRemaining());

  /* Custom dropdown state */
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  /* Messages & confirmation */
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* History */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* Auto-scroll */
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping, pendingConfirmation]);

  /* Colors */
  const colors = {
    bg: dark ? "bg-neutral-950" : "bg-white",
    text: dark ? "text-neutral-50" : "text-neutral-900",
    subText: dark ? "text-neutral-400" : "text-neutral-600",
    border: dark ? "border-neutral-800" : "border-neutral-200",
    headerBg: dark ? "bg-neutral-950/80" : "bg-white/80",
    assistantBubble: dark ? "bg-neutral-900 text-neutral-100 border border-neutral-800" : "bg-neutral-50 text-neutral-900 border border-neutral-200",
    userBubble: "bg-blue-600 text-white",
    errorBubble: dark ? "bg-red-900/50 text-red-200 border border-red-800" : "bg-red-50 text-red-700 border border-red-200",
    badge: dark ? "bg-neutral-800 text-neutral-300 border border-neutral-700" : "bg-neutral-100 text-neutral-700 border border-neutral-300",
    
    // Bottom bar specific colors
    barBg: dark ? "bg-neutral-900" : "bg-white",
    barBorder: dark ? "border-neutral-800" : "border-neutral-200",
    inputPlaceholder: dark ? "placeholder:text-neutral-500" : "placeholder:text-neutral-400",
    
    // Custom dropdown colors
    dropdownBg: dark ? "bg-neutral-800" : "bg-white",
    dropdownHover: dark ? "hover:bg-neutral-700" : "hover:bg-neutral-100",
    dropdownText: dark ? "text-neutral-200" : "text-neutral-800",
    dropdownBorder: dark ? "border-neutral-700" : "border-neutral-200",
  };

  /* Send */
  async function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, time: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (pendingConfirmation) return;

    if (!canUse(provider)) {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Daily limit reached for ${provider}. Try another provider or come back tomorrow.`,
        time: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      return;
    }

    setIsTyping(true);
    const res = await resolveQuery(text, provider);
    setIsTyping(false);

    if (res.error) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error (${provider}): ${res.error}`,
        time: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      return;
    }

    if (res.suggestions.length > 0) {
      const top = res.suggestions[0];
      const askMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Did you mean: "${top.label}"?`,
        time: Date.now(),
        meta: { usedAI: false },
      };
      setMessages((prev) => [...prev, askMsg]);
      setPendingConfirmation({
        label: top.label,
        faqId: top.faqId,
        originalText: text,
      });
      return;
    }

    if (res.matchedAnswer) {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.matchedAnswer,
        time: Date.now(),
        meta: { usedAI: false },
      };
      setMessages((prev) => [...prev, assistantMsg]);
      return;
    }

    if (res.aiText) {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.aiText,
        time: Date.now(),
        meta: { provider: res.aiProvider, usedAI: true },
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.aiProvider) {
        increment(res.aiProvider);
        refreshRemaining();
      }
      return;
    }

    const fallbackMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "I could not find an answer. Please try rephrasing your question.",
      time: Date.now(),
    };
    setMessages((prev) => [...prev, fallbackMsg]);
  }

  /* Confirmation */
  async function confirmYes() {
    const pending = pendingConfirmation;
    if (!pending) return;

    let finalAnswer = "";
    if (pending.faqId) {
      try {
        const res = await fetch("/api/faq/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: pending.faqId }),
        });
        const json = await res.json();
        finalAnswer = res.ok && json.answer ? json.answer : "Sorry, I couldn't fetch the FAQ answer.";
      } catch {
        finalAnswer = "Sorry, I couldn't fetch the FAQ answer.";
      }
    } else {
      try {
        if (!canUse(provider)) {
          const assistantMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Daily limit reached for ${provider}. Try another provider or come back tomorrow.`,
            time: Date.now(),
            isError: true,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setPendingConfirmation(null);
          return;
        }
        setIsTyping(true);
        const resAI = await resolveQuery(pending.label, provider);
        setIsTyping(false);
        if (resAI.aiText) {
          const assistantMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: resAI.aiText,
            time: Date.now(),
            meta: { provider: resAI.aiProvider, usedAI: true },
          };
          setMessages((prev) => [...prev, assistantMsg]);
          if (resAI.aiProvider) {
            increment(resAI.aiProvider);
            refreshRemaining();
          }
          setPendingConfirmation(null);
          return;
        } else if (resAI.matchedAnswer) {
          finalAnswer = resAI.matchedAnswer;
        } else {
          finalAnswer = "Sorry, I couldn't fetch an answer.";
        }
      } catch {
        finalAnswer = "Sorry, I couldn't fetch an answer.";
      }
    }

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: finalAnswer,
      time: Date.now(),
      meta: { usedAI: false },
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setPendingConfirmation(null);
  }

  async function confirmNo() {
    const pending = pendingConfirmation;
    if (!pending) return;

    try {
      if (!canUse(provider)) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Daily limit reached for ${provider}. Try another provider or come back tomorrow.`,
          time: Date.now(),
          isError: true,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setPendingConfirmation(null);
        return;
      }

      setIsTyping(true);
      const resAI = await resolveQuery(pending.originalText, provider);
      setIsTyping(false);

      if (resAI.aiText) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: resAI.aiText,
          time: Date.now(),
          meta: { provider: resAI.aiProvider, usedAI: true },
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (resAI.aiProvider) {
          increment(resAI.aiProvider);
          refreshRemaining();
        }
      } else if (resAI.matchedAnswer) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: resAI.matchedAnswer,
          time: Date.now(),
          meta: { usedAI: false },
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I could not find an answer. Please try rephrasing your question.",
          time: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (e: any) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error (${provider}): ${e?.message || "Unknown error"}`,
        time: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setPendingConfirmation(null);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    setPendingConfirmation(null);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }

  function handleProviderSelect(p: Provider) {
    setProvider(p);
    setIsDropdownOpen(false);
  }

  const isEmpty = messages.length === 0;

  return (
    <main className={`min-h-screen flex flex-col ${colors.bg} ${colors.text} font-sans`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 border-b ${colors.border} ${colors.headerBg} backdrop-blur-md transition-colors duration-300`}>
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold text-lg tracking-tight hover:opacity-80 transition">EduNex</Link>
          </div>
          <div className="flex items-center gap-2">
            {checkedAdmin && isAdminLoggedIn && (
              <Link
                href="/admin"
                className={`rounded-full border ${colors.border} px-3 py-1.5 text-xs font-medium ${dark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"} transition`}
              >
                Admin
              </Link>
            )}
            <button
              onClick={() => setDark(!dark)}
              className={`rounded-full p-2 ${dark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"} transition`}
              aria-label="Toggle theme"
            >
              {dark ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
            </button>
            <button
              onClick={clearChat}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border ${colors.border} ${dark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"} transition`}
            >
              Clear
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <section className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 pb-4">
          <div ref={listRef} className="min-h-[calc(100vh-160px)] pt-6 pb-4">
            {isEmpty && (
              <div className="flex flex-col items-center justify-center h-[50vh] animate-in fade-in duration-700">
                <div className={`text-5xl md:text-7xl font-bold tracking-tighter opacity-[0.08] select-none ${colors.text}`}>
                  EduNex
                </div>
                <p className={`mt-4 text-sm ${colors.subText} text-center max-w-xs mx-auto`}>
                  Ask about fees, syllabus, or chat with AI.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((m) => (
                <MessageRow key={m.id} msg={m} dark={dark} colors={colors} />
              ))}

              {pendingConfirmation && (
                <div className="w-full flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                  <div className={`max-w-[95%] sm:max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${colors.assistantBubble} border border-neutral-200 dark:border-neutral-800`}>
                    <div className="flex items-start gap-3">
                      <div className={`${colors.subText} mt-1`}>
                        <IconBot className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Did you mean: “{pendingConfirmation.label}”?</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={confirmYes}
                            className="rounded-full bg-blue-600 text-white px-4 py-1.5 text-xs font-medium hover:bg-blue-700 transition shadow-sm"
                          >
                            Yes
                          </button>
                          <button
                            onClick={confirmNo}
                            className={`rounded-full border ${colors.border} px-4 py-1.5 text-xs font-medium ${dark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"} transition`}
                          >
                            No, use AI
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className={`rounded-2xl px-4 py-2 ${dark ? "bg-neutral-900" : "bg-neutral-100"} text-xs text-neutral-500`}>
                    Typing…
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Bottom Input Bar */}
      <div className="sticky bottom-0 z-40 px-4 pb-4 pt-2">
        <div className="mx-auto max-w-3xl">
          <div className={`relative flex items-center gap-2 p-2 rounded-[26px] shadow-lg border ${colors.barBorder} ${colors.barBg} ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:shadow-blue-500/20`}>
            
            {/* Custom Provider Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors ${dark ? "hover:bg-neutral-800 text-neutral-300" : "hover:bg-neutral-100 text-neutral-600"}`}
              >
                <IconSpark className="h-4 w-4 text-blue-500" />
                <span className="capitalize">{provider}</span>
                {isDropdownOpen ? <IconChevronUp className="h-3 w-3 opacity-50" /> : <IconChevronDown className="h-3 w-3 opacity-50" />}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className={`absolute bottom-full mb-2 left-0 min-w-[180px] rounded-xl border ${colors.dropdownBorder} ${colors.dropdownBg} shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100`}>
                  <div className={`px-3 py-2 text-[10px] uppercase font-bold tracking-wider opacity-50 ${colors.dropdownText}`}>Select Model</div>
                  {["gemini", "groq"].map((p) => (
                    <button
                      key={p}
                      onClick={() => handleProviderSelect(p as Provider)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition-colors ${colors.dropdownHover} ${colors.dropdownText}`}
                    >
                      <span className="capitalize font-medium">{p}</span>
                      <span className="text-[10px] opacity-60 font-mono">
                        {mounted ? (remaining as any)[p] : "—"} left
                      </span>
                    </button>
                  ))}
                  <div className={`mt-1 border-t ${colors.border} px-3 py-2 text-[10px] opacity-40 text-center`}>
                    Total daily limit: {mounted ? remaining.total : "—"}
                  </div>
                </div>
              )}
            </div>

            {/* Input Field */}
            <input
              className={`flex-1 bg-transparent outline-none text-sm px-2 py-2 ${colors.text} ${colors.inputPlaceholder}`}
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className={`p-2 rounded-full transition-all duration-200 ${
                input.trim() 
                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105 active:scale-95" 
                  : `bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed`
              }`}
            >
              <IconSend className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-2 text-[10px] text-center opacity-40 select-none">
            AI can make mistakes. Please verify important info.
          </div>
        </div>
      </div>
    </main>
  );
}

function MessageRow({
  msg,
  dark,
  colors,
}: {
  msg: Message;
  dark: boolean;
  colors: {
    assistantBubble: string;
    userBubble: string;
    errorBubble: string;
    badge: string;
    subText: string;
  };
}) {
  const isUser = msg.role === "user";
  const bubbleBase = "max-w-[90%] sm:max-w-[85%] rounded-[20px] px-4 py-3 shadow-sm text-[15px] leading-relaxed";
  const bubble = isUser
    ? `${bubbleBase} ${colors.userBubble} rounded-br-sm`
    : msg.isError
    ? `${bubbleBase} ${colors.errorBubble} rounded-bl-sm`
    : `${bubbleBase} ${colors.assistantBubble} rounded-bl-sm border border-neutral-100 dark:border-neutral-800`;

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {!isUser && (
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${dark ? "bg-neutral-800" : "bg-white"} border ${colors.border} shadow-sm`}>
            <IconBot className="h-5 w-5 text-blue-500" />
          </div>
        )}
        
        <div className={bubble}>
          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          <div className={`mt-1.5 flex items-center gap-2 text-[10px] ${isUser ? "text-blue-100" : "text-neutral-400"}`}>
            <span>{formatTime(msg.time)}</span>
            {!isUser && msg.meta?.usedAI && msg.meta?.provider && (
              <span className={`px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 font-medium uppercase tracking-wider`}>
                {msg.meta.provider}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}