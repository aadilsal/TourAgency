import { ConvexHttpClient } from "convex/browser";

/**
 * Next.js caches server-side fetch() calls (Data Cache), including the POSTs
 * ConvexHttpClient makes — so pages kept serving old query results (a tour's
 * photos, admin edits) even after the data changed. Every server read here
 * must be live, so all Convex calls opt out of that cache.
 */
const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });

export function getConvexServer(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  return new ConvexHttpClient(url, { fetch: noStoreFetch });
}
