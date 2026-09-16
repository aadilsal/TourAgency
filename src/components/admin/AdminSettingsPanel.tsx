"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { FieldHint, FieldLabel, TextAreaField, TextInput } from "@/components/ui/FormField";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { useLocalDraft } from "@/hooks/useLocalDraft";
import { DraftRestoreBanner, QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { FormSaveBar } from "@/components/admin/shared/FormSaveBar";
import { useServerForm } from "@/components/admin/shared/useServerForm";

type SettingsForm = {
  officeAddress: string;
  website: string;
  whatsappPhone: string;
  contactEmail: string;
  mapsEmbedUrl: string;
  governmentLicenseNo: string;
  governmentLicenseNo2: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  bankInstruction: string;
};

const TEXT_KEYS = [
  "officeAddress",
  "website",
  "whatsappPhone",
  "contactEmail",
  "mapsEmbedUrl",
  "governmentLicenseNo",
  "governmentLicenseNo2",
] as const;
type TextKey = (typeof TEXT_KEYS)[number];

const BANK_KEYS = ["bankName", "accountTitle", "accountNumber", "iban", "bankInstruction"] as const;

function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="p-5">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
      </Card>
    </section>
  );
}

/**
 * The one place to edit business/contact/licence/bank details (the Contact
 * screen used to edit the same fields separately). Values shown on the public
 * site, invoices and itinerary PDFs.
 */
export function AdminSettingsPanel() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const { data: snap, error: queryError } = useSafeQuery(
    api.siteSettings.getAdminSiteSettings,
    canQuery ? { sessionToken } : "skip",
  );
  const upsert = useMutation(api.siteSettings.upsertAdminSiteSettings);

  // Form starts from what's STORED; never-set fields show the live fallback so
  // the admin sees what the site currently displays. Only edited fields are
  // ever sent, so an untouched fallback is never written as real data.
  const server = useMemo<SettingsForm | undefined>(() => {
    if (!snap) return undefined;
    const s = snap.stored;
    const f = snap.fallbacks;
    const bank = s.bankDetails ?? f.bankDetails;
    return {
      officeAddress: s.officeAddress ?? f.officeAddress,
      website: s.website ?? f.website,
      whatsappPhone: s.whatsappPhone ?? f.whatsappPhone,
      contactEmail: s.contactEmail ?? f.contactEmail,
      mapsEmbedUrl: s.mapsEmbedUrl ?? f.mapsEmbedUrl,
      governmentLicenseNo: s.governmentLicenseNo ?? f.governmentLicenseNo,
      governmentLicenseNo2: s.governmentLicenseNo2 ?? f.governmentLicenseNo2,
      bankName: bank.bankName ?? "",
      accountTitle: bank.accountTitle ?? "",
      accountNumber: bank.accountNumber ?? "",
      iban: bank.iban ?? "",
      bankInstruction: bank.instruction ?? "",
    };
  }, [snap]);

  const form = useServerForm<SettingsForm>(server);
  const { values, dirty, changedKeys } = form;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOnce, setSavedOnce] = useState(false);

  useUnsavedChangesGuard(dirty);
  const draft = useLocalDraft<SettingsForm | null>(
    "draft:admin:site-settings",
    values,
    dirty,
  );

  if (!canQuery) {
    return (
      <p className="text-sm text-muted">
        {sessionToken === undefined ? "Loading…" : "You need an admin session."}
      </p>
    );
  }

  if (!values || !snap) {
    return (
      <div>
        <QueryErrorBanner error={queryError} />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const usingDefault = (key: TextKey) =>
    snap.stored[key] === null && values[key] === (snap.fallbacks[key] ?? "");

  function field(
    key: TextKey,
    label: string,
    opts: { type?: string; placeholder?: string; multiline?: boolean; wide?: boolean; hint?: string } = {},
  ) {
    const id = `settings-${key}`;
    const v = values![key];
    return (
      <div className={opts.wide ? "sm:col-span-2" : undefined}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {opts.multiline ? (
          <TextAreaField
            id={id}
            rows={3}
            value={v}
            placeholder={opts.placeholder}
            onChange={(e) => form.setField(key, e.target.value)}
          />
        ) : (
          <TextInput
            id={id}
            type={opts.type}
            value={v}
            placeholder={opts.placeholder}
            onChange={(e) => form.setField(key, e.target.value)}
          />
        )}
        {usingDefault(key) ? (
          <FieldHint>Default value — not saved yet. Edit to override.</FieldHint>
        ) : snap!.stored[key] === "" && !v ? (
          <FieldHint>Cleared — hidden on the site.</FieldHint>
        ) : opts.hint ? (
          <FieldHint>{opts.hint}</FieldHint>
        ) : null}
      </div>
    );
  }

  async function save() {
    if (typeof sessionToken !== "string" || !values) return;
    const sent = values;
    const args: Parameters<typeof upsert>[0] = { sessionToken };
    for (const key of changedKeys) {
      if ((TEXT_KEYS as readonly string[]).includes(key)) {
        args[key as TextKey] = sent[key as TextKey];
      }
    }
    if (changedKeys.some((k) => (BANK_KEYS as readonly string[]).includes(k))) {
      args.bankDetails = {
        bankName: sent.bankName.trim(),
        accountTitle: sent.accountTitle.trim(),
        accountNumber: sent.accountNumber.trim(),
        iban: sent.iban.trim(),
        instruction: sent.bankInstruction.trim(),
      };
    }
    if (sent.contactEmail.trim() && !/^\S+@\S+\.\S+$/.test(sent.contactEmail.trim())) {
      setSaveError("Contact email doesn't look valid.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await upsert(args);
      form.markSaved(sent);
      draft.clear();
      setSavedOnce(true);
    } catch (e) {
      setSaveError(toUserFacingErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <QueryErrorBanner error={queryError} />
      {draft.restorable && draft.restorable.data && !dirty ? (
        <DraftRestoreBanner
          savedAt={draft.restorable.savedAt}
          onRestore={() => {
            const data = draft.restorable?.data;
            if (data) form.setValues({ ...values, ...data });
            draft.dismiss();
          }}
          onDiscard={draft.clear}
        />
      ) : null}
      {form.remoteChanged ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <span>Another admin saved settings while you were editing.</span>
          <button
            type="button"
            className="min-h-9 rounded-lg border border-amber-300 bg-white px-3 font-semibold"
            onClick={() => {
              if (window.confirm("Load their latest values and discard your edits?")) form.reset();
            }}
          >
            Load latest
          </button>
        </div>
      ) : null}

      <Section
        title="Business info"
        description="Shown in the site footer, contact page, invoices and itinerary PDFs."
      >
        {field("officeAddress", "Office address", { multiline: true, wide: true })}
        {field("website", "Website", { wide: true, placeholder: "https://www.junkettours.co" })}
      </Section>

      <Section title="Contact & map" description="How customers reach you from the website.">
        {field("whatsappPhone", "WhatsApp phone", { placeholder: "+92 320 9973486" })}
        {field("contactEmail", "Contact email", { type: "email", placeholder: "info@junkettours.co" })}
        {field("mapsEmbedUrl", "Google Maps embed URL", {
          wide: true,
          placeholder: "https://www.google.com/maps/embed?...",
          hint: "Paste the embed link or the full <iframe> code from Google Maps → Share → Embed.",
        })}
      </Section>

      <Section title="Licences" description="Printed on invoices and itinerary PDFs.">
        {field("governmentLicenseNo", "Government licence number (primary)", {
          placeholder: "e.g. DTS registration",
        })}
        {field("governmentLicenseNo2", "Government licence number (secondary)", {
          placeholder: "e.g. second registration",
        })}
      </Section>

      <Section
        id="bank-details"
        title="Bank details"
        description="Printed on every invoice (PDF & Word) and itinerary proposal. This is the only place bank details are edited."
      >
        {(
          [
            ["bankName", "Bank name"],
            ["accountTitle", "Account title"],
            ["accountNumber", "Account number"],
            ["iban", "IBAN"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <FieldLabel htmlFor={`settings-${key}`}>{label}</FieldLabel>
            <TextInput
              id={`settings-${key}`}
              value={values[key]}
              onChange={(e) => form.setField(key, e.target.value)}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="settings-bankInstruction">Payment instruction (optional)</FieldLabel>
          <TextInput
            id="settings-bankInstruction"
            value={values.bankInstruction}
            placeholder="e.g. Share the payment receipt after transfer."
            onChange={(e) => form.setField("bankInstruction", e.target.value)}
          />
          {snap.stored.bankDetails === null ? (
            <FieldHint>Default bank details — not saved yet. Edit any field to save your own.</FieldHint>
          ) : null}
        </div>
      </Section>

      <FormSaveBar
        dirty={dirty}
        saving={saving}
        savedOnce={savedOnce}
        error={saveError}
        onSave={() => void save()}
        onDiscard={form.reset}
        saveLabel="Save settings"
      />
    </div>
  );
}
