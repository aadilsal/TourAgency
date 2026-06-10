"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FieldError,
  FieldLabel,
  TextInput,
} from "@/components/ui/FormField";
import { GovernmentLicenceText } from "@/components/GovernmentLicenceText";
import { TravelerCard } from "@/components/visa/TravelerCard";
import { useVisaInvitation } from "@/components/visa/VisaInvitationContext";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import {
  createEmptyTraveler,
  parseVisaSubmission,
  passportExpiryWarning,
  type FieldErrors,
  type VisaTravelerForm,
} from "@/lib/visa/validation";
const MAX_TRAVELERS = 10;

type Props = {
  onSuccess?: () => void;
  showHeader?: boolean;
};

export function VisaInvitationForm({
  onSuccess,
  showHeader = true,
}: Props) {
  const createRequest = useMutation(api.visaInvitations.createRequest);
  const siteSettings = useQuery(api.siteSettings.getPublicSiteSettings, {});
  const { markSubmitted } = useVisaInvitation();

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [travelers, setTravelers] = useState<VisaTravelerForm[]>([
    createEmptyTraveler(),
  ]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const expiryWarnings = useMemo(
    () =>
      travelers
        .map((t, i) =>
          t.passportExpiryDate && passportExpiryWarning(t.passportExpiryDate)
            ? i + 1
            : null,
        )
        .filter((n): n is number => n !== null),
    [travelers],
  );

  function updateTraveler(clientId: string, patch: Partial<VisaTravelerForm>) {
    setTravelers((list) =>
      list.map((t) => (t.clientId === clientId ? { ...t, ...patch } : t)),
    );
  }

  function addTraveler() {
    if (travelers.length >= MAX_TRAVELERS) return;
    setTravelers((list) => [...list, createEmptyTraveler()]);
  }

  function removeTraveler(clientId: string) {
    if (travelers.length <= 1) return;
    setTravelers((list) => list.filter((t) => t.clientId !== clientId));
  }

  function scrollToFirstError(errors: FieldErrors) {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey || !formRef.current) return;
    const match = firstKey.match(/^travelers\.(\d+)\./);
    if (match) {
      const el = formRef.current.querySelector(
        `[data-traveler-index="${match[1]}"]`,
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const idMap: Record<string, string> = {
      contactName: "visa-contact-name",
      contactEmail: "visa-contact-email",
      contactPhone: "visa-contact-phone",
      consentGiven: "visa-consent",
    };
    const base = firstKey.split(".")[0];
    const target = idMap[base];
    if (target) {
      document.getElementById(target)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = parseVisaSubmission({
      contactName,
      contactEmail,
      contactPhone,
      consentGiven,
      travelers: travelers.map((t) => ({
        name: t.name,
        sex: t.sex || ("" as const),
        nationalityCode: t.nationalityCode,
        dateOfBirth: t.dateOfBirth,
        passportNumber: t.passportNumber,
        passportIssueDate: t.passportIssueDate,
        passportExpiryDate: t.passportExpiryDate,
      })),
    });

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      scrollToFirstError(parsed.fieldErrors);
      return;
    }

    setSaving(true);
    try {
      await createRequest({
        contactName: parsed.data.contactName,
        contactEmail: parsed.data.contactEmail,
        contactPhone: parsed.data.contactPhone,
        consentGiven: true,
        travelers: parsed.data.travelersWithLabels.map(
          ({ nationalityLabel, ...t }) => ({
            ...t,
            nationalityLabel,
          }),
        ),
      });
      markSubmitted();
      setSent(true);
      onSuccess?.();
    } catch (error) {
      setFormError(toUserFacingErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-emerald-600" />
        <h3 className="mt-3 text-lg font-bold text-emerald-950">
          Request received
        </h3>
        <p className="mt-2 text-sm text-emerald-900/90">
          Thank you. Our licensed team will review your details and contact you
          within 24–48 hours to prepare your visa invitation letter.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="space-y-6"
    >
      {showHeader ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            Submit passport details for each traveler. We prepare official
            invitation letters for Pakistan tourist visas.
          </p>
          <GovernmentLicenceText
            primary={siteSettings?.governmentLicenseNo}
            secondary={
              (siteSettings as { governmentLicenseNo2?: string } | undefined)
                ?.governmentLicenseNo2
            }
            className="text-xs"
          />
        </div>
      ) : null}

      {expiryWarnings.length > 0 ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          Passport for traveler{expiryWarnings.length > 1 ? "s" : ""}{" "}
          {expiryWarnings.join(", ")} expires within 6 months. Many embassies
          require more validity — please verify requirements.
        </div>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold uppercase tracking-wide text-slate-700">
          Primary contact
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="visa-contact-name" required>
              Full name
            </FieldLabel>
            <TextInput
              id="visa-contact-name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              error={!!fieldErrors.contactName}
              autoComplete="name"
            />
            <FieldError>{fieldErrors.contactName}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="visa-contact-email" required>
              Email
            </FieldLabel>
            <TextInput
              id="visa-contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              error={!!fieldErrors.contactEmail}
              autoComplete="email"
            />
            <FieldError>{fieldErrors.contactEmail}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="visa-contact-phone" required>
              Phone / WhatsApp
            </FieldLabel>
            <TextInput
              id="visa-contact-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              error={!!fieldErrors.contactPhone}
              autoComplete="tel"
            />
            <FieldError>{fieldErrors.contactPhone}</FieldError>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Travelers
          </legend>
          <span className="text-xs text-slate-500">
            {travelers.length} / {MAX_TRAVELERS}
          </span>
        </div>

        {fieldErrors.travelers ? (
          <FieldError>{fieldErrors.travelers}</FieldError>
        ) : null}

        <div className="space-y-4">
          {travelers.map((traveler, index) => (
            <TravelerCard
              key={traveler.clientId}
              index={index}
              traveler={traveler}
              errors={fieldErrors}
              onChange={(patch) => updateTraveler(traveler.clientId, patch)}
              onRemove={() => removeTraveler(traveler.clientId)}
              canRemove={travelers.length > 1}
            />
          ))}
        </div>

        {travelers.length < MAX_TRAVELERS ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={addTraveler}
          >
            <Plus className="h-4 w-4" />
            Add another traveler
          </Button>
        ) : null}
      </fieldset>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            id="visa-consent"
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-havezic-primary focus:ring-havezic-primary/30"
          />
          <span className="text-sm text-slate-700">
            I consent to JunketTours processing the passport details provided
            above solely for preparing my tourist visa invitation letter.
          </span>
        </label>
        <FieldError>{fieldErrors.consentGiven}</FieldError>
      </div>

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit visa invitation request"
        )}
      </Button>
    </form>
  );
}
