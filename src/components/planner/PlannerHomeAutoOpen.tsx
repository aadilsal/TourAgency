"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { usePlannerWidget } from "./PlannerWidgetContext";

const STORAGE_KEY = "junket-planner-home-opened-once";

/** Opens the trip assistant once per browser tab when the user first lands on the homepage. */
export function PlannerHomeAutoOpen() {
  const pathname = usePathname();
  const { open } = usePlannerWidget();
  const done = useRef(false);

  useEffect(() => {
    if (pathname !== "/") return;
    if (done.current) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        done.current = true;
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode — still open once this session */
    }
    done.current = true;
    open();
  }, [pathname, open]);

  return null;
}
