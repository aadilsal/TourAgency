"use client";

import { useEffect, useState } from "react";

/** `undefined` = loading; `null` = not logged in; string = session token for Convex args. */
export function useConvexSessionToken(): string | null | undefined {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onAuthChange = () => setTick((t) => t + 1);
    window.addEventListener("junket-auth-change", onAuthChange);
    return () => window.removeEventListener("junket-auth-change", onAuthChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        const j = (await r.json()) as { token?: string | null };
        if (!cancelled) setToken(j.token ?? null);
      } catch {
        if (!cancelled) setToken(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return token;
}
