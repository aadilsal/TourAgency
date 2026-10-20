"use client";

import { Mail, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/cn";
import { mailtoHref, splitContact, telHref, whatsappHref } from "./contact";

const base =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sun";

/**
 * One-tap Call / WhatsApp / Email buttons for an inbox row. Each button is a
 * 44px touch target; buttons without a usable phone / email are left out.
 */
export function ContactActions({
  name,
  phone,
  email,
  about,
  compact,
  className,
}: {
  name: string;
  phone?: string | null;
  email?: string | null;
  /** What they asked about, for the WhatsApp greeting ("booking request for Hunza"). */
  about?: string;
  /** Icon-only buttons (labels stay as aria-label / tooltip). */
  compact?: boolean;
  className?: string;
}) {
  const c = splitContact(phone, email);
  const tel = telHref(c.phone);
  const wa = whatsappHref(c.phone, name, about);
  const mail = mailtoHref(c.email, about ? `Your ${about}` : undefined);

  if (!tel && !wa && !mail) {
    return <p className={cn("text-xs text-muted", className)}>No phone or email given.</p>;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          title={`WhatsApp ${name}`}
          aria-label={`WhatsApp ${name}`}
          className={cn(base, "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700")}
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          {compact ? null : <span>WhatsApp</span>}
        </a>
      ) : null}
      {tel ? (
        <a
          href={tel}
          title={`Call ${c.phone}`}
          aria-label={`Call ${name}`}
          className={cn(base, "border-border bg-white text-foreground hover:bg-black/5")}
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden />
          {compact ? null : <span>Call</span>}
        </a>
      ) : null}
      {mail ? (
        <a
          href={mail}
          title={`Email ${c.email}`}
          aria-label={`Email ${name}`}
          className={cn(base, "border-border bg-white text-foreground hover:bg-black/5")}
        >
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          {compact ? null : <span>Email</span>}
        </a>
      ) : null}
    </div>
  );
}
