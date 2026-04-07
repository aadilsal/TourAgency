"use client";

import { usePlannerGuestSessionId } from "@/hooks/usePlannerGuestSessionId";
import { PlannerChatWidget } from "./PlannerChatWidget";

export function PlannerChatWidgetRoot() {
  const guestId = usePlannerGuestSessionId();
  if (!guestId) return null;
  return <PlannerChatWidget guestSessionId={guestId} />;
}
