/**
 * Single source of truth for JunketTours' public business details.
 *
 * Used by structured data (JSON-LD), the 404 page, legal pages and the web
 * manifest. Admin-editable values in Convex site settings (office address,
 * WhatsApp number, licence numbers) still take precedence in the UI where they
 * exist — these are the verified defaults from the client's own brochure.
 */
export const BUSINESS = {
  name: "JunketTours",
  legalName: "JunketTours",
  tagline: "Heritage & culture tours across Pakistan",
  description:
    "Licensed Pakistan tour operator based in Lahore. Private and small-group heritage, culture and northern-valley tours with English-speaking guides, visa invitation support and transparent USD pricing for travellers worldwide.",
  websiteDisplay: "www.junkettours.co",
  email: "info@junkettours.co",
  /** E.164 — use for tel: links and schema.org telephone. */
  phoneE164: "+923209973486",
  phoneDisplay: "+92 320 9973486",
  whatsappNumber: "923209973486",
  whatsappUrl: "https://wa.me/923209973486",
  address: {
    streetAddress:
      "156, M Block, Main Blvd, near Khokhar Chowk, Phase 2 Johar Town",
    addressLocality: "Lahore",
    addressRegion: "Punjab",
    postalCode: "54000",
    addressCountry: "PK",
    countryName: "Pakistan",
  },
  languages: ["English", "Urdu"],
  social: {
    instagram: "https://www.instagram.com/junkettoursofficial/",
    facebook: "https://www.facebook.com/JunketToursOfficial",
    tiktok: "https://www.tiktok.com/@junkettours",
  },
  logoPath: "/images-removebg-preview.png",
  ogImagePath: "/og-image.jpg",
  /** Brand colours (see globals.css --havezic-primary). */
  themeColor: "#fb5b32",
  backgroundColor: "#ffffff",
} as const;

/** One-line postal address, e.g. for footers and legal pages. */
export function formatBusinessAddress(): string {
  const a = BUSINESS.address;
  return `${a.streetAddress}, ${a.addressLocality} ${a.postalCode}, ${a.countryName}`;
}

export const BUSINESS_SAME_AS: string[] = Object.values(BUSINESS.social);
