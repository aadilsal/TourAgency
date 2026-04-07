"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "junket_planner_guest_session_v1";

/** Stable anonymous id for Convex planner session persistence (per browser). */
export function usePlannerGuestSessionId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    try {
      let v = localStorage.getItem(STORAGE_KEY);
      if (!v) {
        v = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, v);
      }
      setId(v);
    } catch {
      setId(null);
    }
  }, []);

  return id;
}
