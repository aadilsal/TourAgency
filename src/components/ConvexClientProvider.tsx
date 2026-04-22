"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo } from "react";

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    // During build-time prerender (and misconfigured envs), the URL may be missing.
    // We still provide a client so Convex hooks have context and prerender doesn't crash.
    // If the app is actually used without a real URL, requests will fail loudly.
    return new ConvexReactClient(url ?? "http://127.0.0.1:0");
  }, []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
