export type TourCustomisationMessageInput = {
  tourTitle: string;
  name: string;
  phone: string;
  email?: string;
  preferredStart?: string;
  preferredEnd?: string;
  peopleCount: number;
  notes?: string;
  departureCity?: string;
  adults?: number;
  children?: number;
};

export function buildTourCustomisationWhatsAppMessage(
  input: TourCustomisationMessageInput,
): string {
  const lines = [
    "Hi JunketTours — I'd like to customise this tour:",
    "",
    `Tour: ${input.tourTitle}`,
    `Name: ${input.name}`,
    `Phone: ${input.phone}`,
    `Email: ${input.email?.trim() || "—"}`,
    `Preferred start: ${input.preferredStart?.trim() || "—"}`,
  ];

  if (input.preferredEnd?.trim()) {
    lines.push(`Preferred end: ${input.preferredEnd.trim()}`);
  }

  lines.push(`Travelers: ${input.peopleCount}`);

  if (input.adults != null || input.children != null) {
    lines.push(
      `Adults / children: ${input.adults ?? "—"} / ${input.children ?? "—"}`,
    );
  }

  if (input.departureCity?.trim()) {
    lines.push(`Departure city: ${input.departureCity.trim()}`);
  }

  lines.push(`Notes: ${input.notes?.trim() || "—"}`);

  return lines.join("\n");
}

/**
 * Opens WhatsApp in a new tab without popup blockers.
 * Call synchronously from a user gesture (submit handler) before awaiting the link.
 */
export async function openWhatsAppChat(
  getLink: (message: string) => Promise<string | null>,
  message: string,
): Promise<string | null> {
  const popup = window.open("", "_blank");
  try {
    const url = await getLink(message);
    if (!url) {
      popup?.close();
      return null;
    }
    if (popup) {
      popup.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    return url;
  } catch {
    popup?.close();
    return null;
  }
}
