"use client";

import { useCallback } from "react";
import { useConvex } from "convex/react";
import { api } from "@convex/_generated/api";
import { openWhatsAppChat } from "@/lib/tourCustomisationWhatsApp";

export function useOpenTourCustomisationWhatsApp() {
  const convex = useConvex();

  return useCallback(
    async (message: string) =>
      openWhatsAppChat(
        (presetMessage) =>
          convex.query(api.whatsapp.getWhatsAppClickLink, { presetMessage }),
        message,
      ),
    [convex],
  );
}
