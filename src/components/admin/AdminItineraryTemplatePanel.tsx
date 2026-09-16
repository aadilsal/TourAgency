"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldHint, FieldLabel, TextAreaField, TextInput } from "@/components/ui/FormField";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { useLocalDraft } from "@/hooks/useLocalDraft";
import { DraftRestoreBanner, QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { FormSaveBar } from "@/components/admin/shared/FormSaveBar";
import { useServerForm } from "@/components/admin/shared/useServerForm";

type PaymentTerm = { percent: number; title: string; description: string };
type TermsBlock = { title: string; body: string };

type TemplateForm = {
  paymentTerms: PaymentTerm[];
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  instruction: string;
  termsBlocks: TermsBlock[];
  defaultIncluded: string;
  defaultNotIncluded: string;
};

const BANK_KEYS = ["bankName", "accountTitle", "accountNumber", "iban", "instruction"] as const;

const splitLines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

export function AdminItineraryTemplatePanel() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const { data: snap, error: queryError } = useSafeQuery(
    api.siteSettings.getAdminSiteSettings,
    canQuery ? { sessionToken } : "skip",
  );
  const upsert = useMutation(api.siteSettings.upsertAdminSiteSettings);

  const server = useMemo<TemplateForm | undefined>(() => {
    if (!snap) return undefined;
    const s = snap.stored;
    const f = snap.fallbacks;
    const bank = s.bankDetails ?? f.bankDetails;
    return {
      paymentTerms: (s.paymentTerms ?? f.paymentTerms).map((t) => ({
        percent: t.percent,
        title: t.title,
        description: t.description ?? "",
      })),
      bankName: bank.bankName ?? "",
      accountTitle: bank.accountTitle ?? "",
      accountNumber: bank.accountNumber ?? "",
      iban: bank.iban ?? "",
      instruction: bank.instruction ?? "",
      termsBlocks: (s.termsBlocks ?? f.termsBlocks).map((b) => ({ title: b.title, body: b.body })),
      defaultIncluded: (s.defaultIncluded ?? f.defaultIncluded).join("\n"),
      defaultNotIncluded: (s.defaultNotIncluded ?? f.defaultNotIncluded).join("\n"),
    };
  }, [snap]);

  const form = useServerForm<TemplateForm>(server);
  const { values, dirty, changedKeys } = form;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOnce, setSavedOnce] = useState(false);

  useUnsavedChangesGuard(dirty);
  const draft = useLocalDraft<TemplateForm | null>(
    "draft:admin:itinerary-template",
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

  const setPaymentTerms = (fn: (prev: PaymentTerm[]) => PaymentTerm[]) =>
    form.setField("paymentTerms", fn(values.paymentTerms));
  const setTermsBlocks = (fn: (prev: TermsBlock[]) => TermsBlock[]) =>
    form.setField("termsBlocks", fn(values.termsBlocks));

  const percentTotal = values.paymentTerms.reduce(
    (sum, t) => sum + (Number.isFinite(t.percent) ? t.percent : 0),
    0,
  );

  async function save() {
    if (typeof sessionToken !== "string" || !values) return;
    const sent = values;
    const args: Parameters<typeof upsert>[0] = { sessionToken };
    if (changedKeys.includes("paymentTerms")) {
      args.paymentTerms = sent.paymentTerms.map((t) => ({
        percent: t.percent,
        title: t.title.trim(),
        description: t.description.trim() || undefined,
      }));
    }
    if (changedKeys.some((k) => (BANK_KEYS as readonly string[]).includes(k))) {
      args.bankDetails = {
        bankName: sent.bankName.trim(),
        accountTitle: sent.accountTitle.trim(),
        accountNumber: sent.accountNumber.trim(),
        iban: sent.iban.trim(),
        instruction: sent.instruction.trim(),
      };
    }
    if (changedKeys.includes("termsBlocks")) {
      args.termsBlocks = sent.termsBlocks.map((b) => ({
        title: b.title.trim(),
        body: b.body.trim(),
      }));
    }
    if (changedKeys.includes("defaultIncluded")) {
      args.defaultIncluded = splitLines(sent.defaultIncluded);
    }
    if (changedKeys.includes("defaultNotIncluded")) {
      args.defaultNotIncluded = splitLines(sent.defaultNotIncluded);
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
    <div className="space-y-6">
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
          <span>Another admin saved these settings while you were editing.</span>
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

      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-semibold">These details appear on every itinerary PDF.</p>
        <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
          Change them once here. Trip-specific content is edited in{" "}
          <Link href="/admin/itineraries/new" className="font-semibold underline">
            Create itinerary
          </Link>
          .
        </p>
        <p className="mt-2">
          Office address, WhatsApp, email, and licence:{" "}
          <Link href="/admin/settings" className="font-semibold underline">
            Site settings
          </Link>
          .
        </p>
      </div>

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Payment terms</p>
        {snap.stored.paymentTerms === null ? (
          <FieldHint>Default terms — not saved yet. Edit to save your own.</FieldHint>
        ) : null}
        <div className="mt-4 space-y-4">
          {values.paymentTerms.map((t, idx) => (
            <div
              key={idx}
              className="grid gap-3 rounded-xl border border-border bg-panel p-3 sm:grid-cols-12"
            >
              <div className="sm:col-span-2">
                <FieldLabel>Percent</FieldLabel>
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  value={t.percent}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPaymentTerms((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, percent: Number.isFinite(v) ? v : 0 } : x,
                      ),
                    );
                  }}
                />
              </div>
              <div className="sm:col-span-3">
                <FieldLabel>Title</FieldLabel>
                <TextInput
                  value={t.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPaymentTerms((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                    );
                  }}
                />
              </div>
              <div className="sm:col-span-6">
                <FieldLabel>Description</FieldLabel>
                <TextInput
                  value={t.description}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPaymentTerms((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, description: v } : x)),
                    );
                  }}
                />
              </div>
              <div className="flex items-end sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-red-700"
                  onClick={() => {
                    const hasContent = t.title.trim() || t.description.trim();
                    if (hasContent && !window.confirm(`Remove payment row "${t.title || "untitled"}"?`)) {
                      return;
                    }
                    setPaymentTerms((prev) => prev.filter((_, i) => i !== idx));
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setPaymentTerms((prev) => [...prev, { percent: 0, title: "", description: "" }])
              }
            >
              + Add payment row
            </Button>
            <span
              className={
                percentTotal === 100 ? "text-xs text-muted" : "text-xs font-semibold text-amber-700"
              }
            >
              Total: {percentTotal}%{percentTotal === 100 ? "" : " (usually 100%)"}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Bank transfer</p>
            <FieldHint>
              Printed on itineraries and invoices. Edited in one place only — Site settings — so
              two screens can never overwrite each other.
            </FieldHint>
          </div>
          <Link
            href="/admin/settings#bank-details"
            className="inline-flex min-h-10 items-center rounded-lg border border-border bg-white px-3 text-sm font-semibold text-havezic-primary hover:bg-slate-50"
          >
            Edit in Site settings
          </Link>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {(
            [
              ["bankName", "Bank name"],
              ["accountTitle", "Account title"],
              ["accountNumber", "Account number"],
              ["iban", "IBAN"],
              ["instruction", "After-payment instruction"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className={key === "instruction" ? "sm:col-span-2" : undefined}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-1 whitespace-pre-line text-foreground">{values[key] || "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Terms &amp; conditions blocks
        </p>
        <div className="mt-4 space-y-4">
          {values.termsBlocks.map((b, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-panel p-3">
              <FieldLabel>Title</FieldLabel>
              <TextInput
                value={b.title}
                onChange={(e) => {
                  const v = e.target.value;
                  setTermsBlocks((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                  );
                }}
              />
              <div className="mt-2">
                <FieldLabel>Body</FieldLabel>
                <TextAreaField
                  rows={4}
                  value={b.body}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTermsBlocks((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, body: v } : x)),
                    );
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 text-red-700"
                onClick={() => {
                  const hasContent = b.title.trim() || b.body.trim();
                  if (hasContent && !window.confirm(`Remove terms block "${b.title || "untitled"}"?`)) {
                    return;
                  }
                  setTermsBlocks((prev) => prev.filter((_, i) => i !== idx));
                }}
              >
                Remove block
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setTermsBlocks((prev) => [...prev, { title: "", body: "" }])}
          >
            + Add terms block
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Default Included / Not included (new itineraries)
        </p>
        <p className="mt-1 text-sm text-muted">One line per item. Used when starting a new itinerary.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Default included</FieldLabel>
            <TextAreaField
              rows={8}
              value={values.defaultIncluded}
              onChange={(e) => form.setField("defaultIncluded", e.target.value)}
              placeholder={"Transport on Prado\nDaily breakfast"}
            />
          </div>
          <div>
            <FieldLabel>Default not included</FieldLabel>
            <TextAreaField
              rows={8}
              value={values.defaultNotIncluded}
              onChange={(e) => form.setField("defaultNotIncluded", e.target.value)}
              placeholder={"Lunch & dinner\nAir tickets"}
            />
          </div>
        </div>
      </Card>

      <FormSaveBar
        dirty={dirty}
        saving={saving}
        savedOnce={savedOnce}
        error={saveError}
        onSave={() => void save()}
        onDiscard={form.reset}
        saveLabel="Save itinerary template"
      />
    </div>
  );
}
