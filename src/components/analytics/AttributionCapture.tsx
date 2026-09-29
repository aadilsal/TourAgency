"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/** Remembers UTM / ad-click parameters for this browser session (see lib/attribution). */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
