"use client";

import { useEffect, useState } from "react";

/** `undefined` = loading; `null` = not logged in; string = session token for Convex args. */
type SessionToken = string | null | undefined;

// ── Shared module-level store ────────────────────────────────────────────────
// Every component that needs the session token used to run its own
// `fetch("/api/auth/session")`. On a page with many such components (admin
// panels, booking, planner…) that meant one network round-trip *per component*.
// This store collapses them into a single shared fetch: the first consumer
// triggers it, everyone else reuses the result, and an auth change refreshes it
// once for all subscribers.
let currentToken: SessionToken = undefined;
let hasLoaded = false;
let inflight: Promise<void> | null = null;
const subscribers = new Set<(t: SessionToken) => void>();
let authListenerAttached = false;

function notifyAll() {
  subscribers.forEach((cb) => cb(currentToken));
}

async function runFetch(): Promise<void> {
  try {
    const r = await fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
    });
    const j = (await r.json()) as { token?: string | null };
    currentToken = j.token ?? null;
  } catch {
    currentToken = null;
  } finally {
    hasLoaded = true;
    inflight = null;
    notifyAll();
  }
}

/** Fetch once; reuse the in-flight promise or already-loaded value otherwise. */
function ensureLoaded() {
  if (hasLoaded || inflight) return;
  inflight = runFetch();
}

/** Force a fresh fetch after an auth change (deduped if one is already running). */
function refresh() {
  hasLoaded = false;
  if (inflight) return;
  inflight = runFetch();
}

function ensureAuthListener() {
  if (authListenerAttached || typeof window === "undefined") return;
  authListenerAttached = true;
  window.addEventListener("junket-auth-change", () => refresh());
}

export function useConvexSessionToken(): SessionToken {
  const [token, setToken] = useState<SessionToken>(currentToken);

  useEffect(() => {
    ensureAuthListener();
    subscribers.add(setToken);
    // Sync a value that may have loaded before this component mounted.
    setToken(currentToken);
    ensureLoaded();
    return () => {
      subscribers.delete(setToken);
    };
  }, []);

  return token;
}
