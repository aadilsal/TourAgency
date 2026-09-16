"use client";

import { useEffect, useState } from "react";

const RENEW_INTERVAL_MS = 1000 * 60 * 15;

/**
 * Keeps the admin session alive while the admin panel is open and warns —
 * without unmounting anything — if the session has really ended (logged out in
 * another tab, account demoted). The editor stays on screen with its local
 * draft backup, so the admin can sign in in a new tab and then save.
 */
export function AdminSessionKeeper() {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renew() {
      try {
        const r = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (r.status === 401) {
          setExpired(true);
          return;
        }
        const j = (await r.json()) as { ok?: boolean; role?: string };
        const isAdmin = j.role === undefined || j.role === "admin" || j.role === "super_admin";
        setExpired((was) => {
          const now = !j.ok || !isAdmin;
          // Session came back (signed in again in another tab): refresh tokens everywhere.
          if (was && !now) window.dispatchEvent(new Event("junket-auth-change"));
          return now;
        });
      } catch {
        /* offline — try again later */
      }
    }

    void renew();
    const id = window.setInterval(renew, RENEW_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void renew();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  if (!expired) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[90] border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-md"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong>Your admin session has ended.</strong> Don&apos;t close this page — your
          unsaved work is kept here. Sign in again in a new tab, then come back and save.
        </p>
        <a
          href="/login?next=/admin"
          target="_blank"
          rel="noopener"
          className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
        >
          Sign in in new tab
        </a>
      </div>
    </div>
  );
}
