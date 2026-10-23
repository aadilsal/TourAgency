import { ConvexHttpClient } from "convex/browser";

/**
 * Next.js caches server-side fetch() calls (Data Cache), including the POSTs
 * ConvexHttpClient makes. Unbounded, that served stale data forever; uncached,
 * every page view hit Convex and burned through plan limits. Middle ground:
 * public query reads are shared for REVALIDATE_SECONDS, so admin edits show
 * within a minute. Mutations/actions are never cached.
 */
const REVALIDATE_SECONDS = 60;

const cachedQueryFetch: typeof fetch = (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  return url.endsWith("/api/query")
    ? fetch(input, { ...init, next: { revalidate: REVALIDATE_SECONDS } })
    : fetch(input, { ...init, cache: "no-store" });
};

const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });

/** `live: true` for per-user reads that must never be stale (session checks). */
export function getConvexServer({ live = false }: { live?: boolean } = {}): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  return new ConvexHttpClient(url, { fetch: live ? noStoreFetch : cachedQueryFetch });
}
