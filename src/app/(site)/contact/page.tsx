"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { Mail, MapPin, MessageCircle, PhoneCall, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  FieldError,
  FieldHint,
  FieldLabel,
  TextAreaField,
  TextInput,
} from "@/components/ui/FormField";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

const PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+92 320 9973486";
const OFFICE_ADDRESS = process.env.NEXT_PUBLIC_OFFICE_ADDRESS ?? "";
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? "";
const MAPS_EMBED = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ?? "";

export default function ContactPage() {
  const sessionToken = useConvexSessionToken();
  const createLead = useMutation(api.leads.createLead);
  const siteSettings = useQuery(api.siteSettings.getPublicSiteSettings, {});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const resolvedPhone = siteSettings?.whatsappPhone?.trim() || PHONE;
  const resolvedEmail = siteSettings?.contactEmail?.trim() || EMAIL;
  const resolvedOfficeAddress = siteSettings?.officeAddress?.trim() || OFFICE_ADDRESS;
  const resolvedMapEmbedUrl = siteSettings?.mapsEmbedUrl?.trim() || MAPS_EMBED;
  const whatsappUrl = `https://wa.me/${resolvedPhone.replace(/\D/g, "") || "923209973486"}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await createLead({
        name: name.trim(),
        phone: phone.trim(),
        source: "Manual",
        message: message.trim() || undefined,
      });
      setSent(true);
      setName("");
      setPhone("");
      setMessage("");
    } catch (error) {
      setErr(toUserFacingErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen py-16 md:py-24">
      <PageContainer>
        <SectionHeader
          variant="onDark"
          eyebrow="Talk to us"
          title="Contact us"
          description="Tell us where you want to go, your budget, and how quickly you want to travel. We’ll reply by WhatsApp, phone, or email."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-brand-ink">Send an inquiry</h2>
            <p className="mt-2 text-sm text-brand-muted">
              This goes into our leads table so the team can follow up even if you
              leave the site.
            </p>

            {sent ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                Thanks. We received your message and will get back to you soon.
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <FieldLabel htmlFor="contact-name" required>
                  Full name
                </FieldLabel>
                <TextInput
                  id="contact-name"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="contact-phone" required>
                  Phone / WhatsApp
                </FieldLabel>
                <TextInput
                  id="contact-phone"
                  required
                  autoComplete="tel"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="contact-message" required>
                  Message
                </FieldLabel>
                <TextAreaField
                  id="contact-message"
                  rows={6}
                  required
                  placeholder="Tell us your destination, dates, and number of travelers."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <FieldHint>
                  Keep it short. We only need enough to reply with the next step.
                </FieldHint>
              </div>
              {err ? <FieldError>{err}</FieldError> : null}
              <Button type="submit" variant="primary" className="w-full py-3" disabled={saving}>
                <Send className="h-4 w-4" aria-hidden />
                {saving ? "Sending…" : "Send message"}
              </Button>
            </form>
          </Card>

          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <PhoneCall className="h-5 w-5 text-brand-accent" aria-hidden />
                <h2 className="text-lg font-bold text-brand-ink">Call or WhatsApp</h2>
              </div>
              <p className="mt-2 text-sm text-brand-muted">Fastest way to book or ask about availability.</p>
              <a
                href={`tel:${resolvedPhone.replace(/\s/g, "")}`}
                className="mt-4 block text-sm font-semibold text-brand-primary hover:underline"
              >
                {resolvedPhone}
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Open WhatsApp chat
              </a>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-brand-accent" aria-hidden />
                <h2 className="text-lg font-bold text-brand-ink">Office</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                {resolvedOfficeAddress || "Address not set yet. Add it in admin contact settings."}
              </p>
              {resolvedMapEmbedUrl ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <iframe
                    title="Office location"
                    src={resolvedMapEmbedUrl}
                    className="h-56 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              ) : null}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-brand-accent" aria-hidden />
                <h2 className="text-lg font-bold text-brand-ink">Email</h2>
              </div>
              <p className="mt-2 text-sm text-brand-muted">
                Use the public email configured in your environment.
              </p>
              <p className="mt-4 text-sm font-semibold text-brand-primary">
                {resolvedEmail || "Add contact email in admin contact settings."}
              </p>
            </Card>

            {sessionToken === undefined ? (
              <p className="text-xs text-slate-500">Preparing contact session…</p>
            ) : null}

            <p className="text-sm text-brand-muted">
              Prefer browsing first? Visit the{" "}
              <Link href="/tours" className="font-semibold text-brand-accent hover:underline">
                tours page
              </Link>{" "}
              or our{" "}
              <Link href="/blog" className="font-semibold text-brand-accent hover:underline">
                travel guides
              </Link>
              .
            </p>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}