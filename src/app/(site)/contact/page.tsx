"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRef, useState } from "react";
import { Mail, MapPin, MessageCircle, PhoneCall, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  FieldError,
  FieldHint,
  FieldLabel,
  FormAlert,
  TextAreaField,
  TextInput,
  fieldErrorId,
  fieldErrorProps,
} from "@/components/ui/FormField";
import {
  FORM_MESSAGES,
  focusFirstError,
  isValidPhone,
  shortRef,
  thankYouHref,
  type FieldErrorMap,
} from "@/lib/formValidation";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { GovernmentLicenceText } from "@/components/GovernmentLicenceText";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { normalizeGoogleMapsEmbedUrl } from "@/lib/googleMapsEmbed";

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
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrorMap<"name" | "phone" | "message">
  >({});
  const submittingRef = useRef(false);

  const resolvedPhone = siteSettings?.whatsappPhone?.trim() || PHONE;
  const resolvedEmail = siteSettings?.contactEmail?.trim() || EMAIL;
  const resolvedOfficeAddress = siteSettings?.officeAddress?.trim() || OFFICE_ADDRESS;
  const resolvedMapEmbedUrl =
    normalizeGoogleMapsEmbedUrl(siteSettings?.mapsEmbedUrl) ||
    normalizeGoogleMapsEmbedUrl(MAPS_EMBED);
  const governmentLicenseNo = siteSettings?.governmentLicenseNo?.trim();
  const governmentLicenseNo2 = (
    siteSettings as { governmentLicenseNo2?: string } | undefined
  )?.governmentLicenseNo2?.trim();
  const whatsappUrl = `https://wa.me/${resolvedPhone.replace(/\D/g, "") || "923209973486"}`;

  function validate() {
    const next: FieldErrorMap<"name" | "phone" | "message"> = {};
    if (!name.trim()) next.name = FORM_MESSAGES.nameRequired;
    if (!phone.trim()) next.phone = FORM_MESSAGES.phoneRequired;
    else if (!isValidPhone(phone)) next.phone = FORM_MESSAGES.phoneInvalid;
    if (!message.trim()) next.message = FORM_MESSAGES.messageRequired;
    setFieldErrors(next);
    focusFirstError([
      next.name && "contact-name",
      next.phone && "contact-phone",
      next.message && "contact-message",
    ]);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setErr(null);
    if (!validate()) return;
    submittingRef.current = true;
    setSaving(true);
    try {
      const leadId = await createLead({
        name: name.trim(),
        phone: phone.trim(),
        source: "Manual",
        message: message.trim() || undefined,
      });
      // Keep the button disabled while we navigate away.
      router.push(thankYouHref("contact", shortRef(leadId)));
    } catch (error) {
      setErr(toUserFacingErrorMessage(error));
      submittingRef.current = false;
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
            <h2 className="text-xl font-bold text-foreground">Send an inquiry</h2>
            <p className="mt-2 text-sm text-muted">
              This goes into our leads table so the team can follow up even if you
              leave the site.
            </p>

            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
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
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((x) => ({ ...x, name: undefined }));
                  }}
                  {...fieldErrorProps("contact-name", fieldErrors.name)}
                />
                <FieldError id={fieldErrorId("contact-name")}>{fieldErrors.name}</FieldError>
              </div>
              <div>
                <FieldLabel htmlFor="contact-phone" required>
                  Phone / WhatsApp
                </FieldLabel>
                <TextInput
                  id="contact-phone"
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setFieldErrors((x) => ({ ...x, phone: undefined }));
                  }}
                  {...fieldErrorProps("contact-phone", fieldErrors.phone)}
                />
                <FieldError id={fieldErrorId("contact-phone")}>{fieldErrors.phone}</FieldError>
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
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setFieldErrors((x) => ({ ...x, message: undefined }));
                  }}
                  {...fieldErrorProps("contact-message", fieldErrors.message)}
                />
                <FieldError id={fieldErrorId("contact-message")}>{fieldErrors.message}</FieldError>
                <FieldHint>
                  Keep it short. We only need enough to reply with the next step.
                </FieldHint>
              </div>
              <FormAlert>{err}</FormAlert>
              <Button
                type="submit"
                variant="primary"
                className="w-full py-3"
                disabled={saving}
                aria-busy={saving}
              >
                <Send className="h-4 w-4" aria-hidden />
                {saving ? "Sending…" : "Send message"}
              </Button>
            </form>
          </Card>

          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <PhoneCall className="h-5 w-5 text-havezic-primary" aria-hidden />
                <h2 className="text-lg font-bold text-foreground">Call or WhatsApp</h2>
              </div>
              <p className="mt-2 text-sm text-muted">Fastest way to book or ask about availability.</p>
              <a
                href={`tel:${resolvedPhone.replace(/\s/g, "")}`}
                className="mt-4 block text-sm font-semibold text-havezic-primary hover:underline"
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
                <MapPin className="h-5 w-5 text-havezic-primary" aria-hidden />
                <h2 className="text-lg font-bold text-foreground">Office</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {resolvedOfficeAddress || "Address not set yet. Add it in admin contact settings."}
              </p>
              <GovernmentLicenceText
                primary={governmentLicenseNo}
                secondary={governmentLicenseNo2}
                className="mt-3"
              />
              {resolvedMapEmbedUrl ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-border bg-havezic-background-light">
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
                <Mail className="h-5 w-5 text-havezic-primary" aria-hidden />
                <h2 className="text-lg font-bold text-foreground">Email</h2>
              </div>
              <p className="mt-2 text-sm text-muted">
                Use the public email configured in your environment.
              </p>
              <p className="mt-4 text-sm font-semibold text-havezic-primary">
                {resolvedEmail || "Add contact email in admin contact settings."}
              </p>
            </Card>

            {sessionToken === undefined ? (
              <p className="text-xs text-havezic-text-light">Preparing contact session…</p>
            ) : null}

            <p className="text-sm text-muted">
              Prefer browsing first? Visit the{" "}
              <Link href="/tours" className="font-semibold text-havezic-primary hover:underline">
                tours page
              </Link>{" "}
              or our{" "}
              <Link href="/blog" className="font-semibold text-havezic-primary hover:underline">
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