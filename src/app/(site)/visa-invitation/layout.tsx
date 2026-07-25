import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pakistan tourist visa invitation letter",
  description:
    "Request an official invitation letter for your Pakistan tourist visa application — submit passport details and our licensed team prepares it for you.",
  alternates: { canonical: "/visa-invitation" },
  openGraph: {
    title: "Pakistan tourist visa invitation letter | JunketTours",
    description:
      "Request an official invitation letter for your Pakistan tourist visa application.",
    url: `${getSiteUrl()}/visa-invitation`,
    type: "website",
  },
};

export default function VisaInvitationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
