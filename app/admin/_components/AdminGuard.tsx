"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminSession } from "../../../api/admin_local";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const session = getAdminSession();
    setAllowed(!!session);
  }, []);

  if (allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-600 dark:text-neutral-300">
        Checking admin access…
      </div>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-white dark:bg-neutral-950 text-black dark:text-neutral-50">
        <header className="px-6 md:px-10 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <Link href="/" className="font-semibold">← EduNex</Link>
          <h1 className="font-bold">Admin</h1>
        </header>
        <section className="mx-auto max-w-lg px-6 py-10">
          <div className="rounded-md border border-neutral-300 dark:border-neutral-700 p-6">
            <p className="text-neutral-700 dark:text-neutral-300">
              You are not authorized. Please <Link href="/admin/login" className="underline">login</Link>.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}