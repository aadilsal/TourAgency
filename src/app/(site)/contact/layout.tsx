import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// contact/page.tsx is a client component, so its metadata lives here.
export const metadata: Metadata = buildMetadata({
  title: "Contact Us — Lahore Office & WhatsApp",
  description:
    "Talk to a Pakistan travel expert: WhatsApp +92 320 9973486, email info@junkettours.co or visit our Lahore office in Johar Town to plan your heritage tour.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
