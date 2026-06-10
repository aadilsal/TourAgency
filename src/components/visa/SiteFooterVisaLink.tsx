"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

export function SiteFooterVisaLink() {
  return (
    <Link
      href="/visa-invitation"
      className="inline-flex items-center gap-2 text-muted hover:text-havezic-primary"
    >
      <FileText className="h-4 w-4 shrink-0 opacity-80" />
      Visa invitation
    </Link>
  );
}
