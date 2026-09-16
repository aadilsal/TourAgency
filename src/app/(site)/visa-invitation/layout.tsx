import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Pakistan Visa Invitation Letter (LOI)",
  description:
    "Request an official letter of invitation for your Pakistan tourist e-Visa. Submit passport details online and our licensed Lahore team prepares it for you.",
  path: "/visa-invitation",
});

export default function VisaInvitationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
