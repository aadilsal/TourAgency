import { cache } from "react";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";

const DEFAULT_WA_DIGITS = "923209973486";

function fallbackWhatsAppUrl(presetMessage?: string): string {
  const text = encodeURIComponent(
    presetMessage ?? "Hi JunketTours — I have a question about a tour.",
  );
  return `https://wa.me/${DEFAULT_WA_DIGITS}?text=${text}`;
}

export const getWhatsAppClickUrl = cache(async function getWhatsAppClickUrl(
  presetMessage?: string,
): Promise<string | null> {
  try {
    const client = getConvexServer();
    const url = await client.query(api.whatsapp.getWhatsAppClickLink, {
      presetMessage,
    });
    return url ?? fallbackWhatsAppUrl(presetMessage);
  } catch {
    return fallbackWhatsAppUrl(presetMessage);
  }
});
