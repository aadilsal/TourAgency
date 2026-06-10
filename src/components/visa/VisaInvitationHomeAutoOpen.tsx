"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  useVisaInvitation,
  VISA_MODAL_DISMISSED_KEY,
  VISA_SUBMITTED_KEY,
} from "@/components/visa/VisaInvitationContext";

const AUTO_OPEN_DELAY_MS = 1500;

/** Opens the visa invitation modal once per browser on first homepage visit. */
export function VisaInvitationHomeAutoOpen() {
  const pathname = usePathname();
  const { open, openModal } = useVisaInvitation();
  const scheduled = useRef(false);

  useEffect(() => {
    if (pathname !== "/") return;
    if (open || scheduled.current) return;

    try {
      if (
        localStorage.getItem(VISA_MODAL_DISMISSED_KEY) === "1" ||
        localStorage.getItem(VISA_SUBMITTED_KEY) === "1"
      ) {
        return;
      }
    } catch {
      /* private mode */
    }

    scheduled.current = true;
    const timer = window.setTimeout(() => {
      openModal();
    }, AUTO_OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, open, openModal]);

  return null;
}
