"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { useAutosave } from "@/hooks/useAutosave";
import { useLocalDraft } from "@/hooks/useLocalDraft";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import {
  DraftRestoreBanner,
  QueryErrorBanner,
  SaveStatusPill,
} from "@/components/admin/shared/EditorStatus";
import { WizardLayout } from "@/components/admin/WizardLayout";
import {
  FieldHint,
  FieldLabel,
  SelectField,
  TextAreaField,
  TextInput,
} from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { todayYmdLocal } from "@/lib/todayYmdLocal";
import { toAbsoluteUrl } from "@/lib/absoluteUrl";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { InvoicePdf, type InvoicePdfModel } from "@/documents/invoice/InvoicePdf";
import type { PackageTier } from "@/lib/itineraryPackageMatrix";
import { normalizePackageTier } from "@/components/admin/itinerary/itineraryModel";

type Currency = "PKR" | "USD";
type PaymentMethod = "bank" | "easypaisa" | "jazzcash";
type InvoiceItem = { name: string; description?: string; quantity: number; price: number };
type InvoicePatch = Omit<FunctionArgs<typeof api.invoices.patchDraft>, "sessionToken" | "invoiceId">;

const DEFAULT_LOGO_URL = "/images-removebg-preview.png";
const STEPS = ["Basic", "Items", "Pricing", "Payment", "Notes", "Export"];
const blankItem = (name = ""): InvoiceItem => ({ name, description: "", quantity: 1, price: 0 });

type InvoiceDoc = {
  _id: Id<"invoices">;
  invoiceNumber?: string;
  clientName: string;
  itineraryId?: Id<"itineraries">;
  invoiceDate: string;
  currency: Currency;
  status: "draft" | "paid";
  items: InvoiceItem[];
  /** Percentage 0–100 */
  discount: number;
  /** Percentage 0–100 */
  tax: number;
  advanceAmount?: number;
  tripSummary?: string;
  paymentMethod: PaymentMethod;
  paymentDetails: string;
  terms?: string;
  cancellationPolicy?: string;
};

/** Editable fields — also the shape of the local crash backup. */
type InvoiceForm = {
  clientName: string;
  invoiceDate: string;
  currency: Currency;
  items: InvoiceItem[];
  discount: number;
  tax: number;
  advanceAmount: number;
  tripSummary: string;
  paymentMethod: PaymentMethod;
  paymentDetails: string;
  terms: string;
  cancellationPolicy: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(currency: Currency, n: number) {
  const sym = currency === "USD" ? "$" : "PKR";
  return `${sym} ${Number.isFinite(n) ? n.toLocaleString() : "0"}`;
}

function paymentTemplate(method: PaymentMethod) {
  if (method === "easypaisa" || method === "jazzcash") {
    return [
      `${method === "easypaisa" ? "Easypaisa" : "JazzCash"} payment details`,
      "",
      "Account title: Junket Tours",
      "Account number: __________",
      "Instructions: Share screenshot after payment.",
    ].join("\n");
  }
  // Bank account details are printed on every invoice automatically, so the
  // template only carries optional instructions.
  return "Please share the payment receipt after completing the transfer.";
}

function formFromDoc(doc: InvoiceDoc): InvoiceForm {
  return {
    clientName: doc.clientName ?? "",
    invoiceDate: doc.invoiceDate ?? new Date().toISOString().slice(0, 10),
    currency: doc.currency ?? "PKR",
    items: doc.items?.length ? doc.items : [blankItem("Trip package")],
    discount: Number(doc.discount ?? 0),
    tax: Number(doc.tax ?? 0),
    advanceAmount: Number(doc.advanceAmount ?? 0),
    tripSummary: doc.tripSummary ?? "",
    paymentMethod: doc.paymentMethod ?? "bank",
    paymentDetails: doc.paymentDetails ?? "",
    terms: doc.terms ?? "",
    cancellationPolicy: doc.cancellationPolicy ?? "",
  };
}

type LinkedItinerary = {
  packageTiers?: PackageTier[];
  packages?: Array<{
    name: string;
    pricePkr?: number;
    vehicle?: string;
    note?: string;
    stays?: Array<{ location: string; hotel: string; nights: number }>;
  }>;
};

/** Line items from a linked itinerary (builder tiers first, legacy packages as fallback). */
function itemsFromItinerary(itin: LinkedItinerary | null | undefined): InvoiceItem[] {
  const tiers = itin?.packageTiers?.length
    ? itin.packageTiers.map((t) => normalizePackageTier(t))
    : (itin?.packages ?? []).map((p) => ({ ...p, stays: p.stays ?? [] }));
  return tiers
    .filter((p) => (p.name ?? "").trim())
    .map((p) => {
      const stays = p.stays
        .filter((s) => s.hotel.trim() || s.location.trim())
        .map((s) => `${s.location}: ${s.hotel} (${s.nights}N)`);
      const description = [p.vehicle?.trim() || "", stays.join("\n"), p.note?.trim() || ""]
        .filter(Boolean)
        .join("\n");
      return {
        name: p.name,
        description,
        quantity: 1,
        price: typeof p.pricePkr === "number" ? p.pricePkr : 0,
      };
    });
}

export function AdminInvoiceWizard({ invoiceId: invoiceIdProp }: { invoiceId?: string }) {
  const router = useRouter();
  const liveToken = useConvexSessionToken();
  // Keep the wizard mounted if the session lapses mid-edit (saves fail visibly).
  const lastTokenRef = useRef<string | null>(null);
  if (typeof liveToken === "string") lastTokenRef.current = liveToken;
  const sessionToken = typeof liveToken === "string" ? liveToken : lastTokenRef.current;
  const sessionLost = liveToken === null && lastTokenRef.current !== null;
  const canMutate = typeof sessionToken === "string";
  const minDate = useMemo(() => todayYmdLocal(), []);

  const createDraft = useMutation(api.invoices.createDraft);
  const patchDraft = useMutation(api.invoices.patchDraft);
  const markPaid = useMutation(api.invoices.markPaid);
  const exportDocx = useAction(api.documentsActions.exportInvoiceDocx);

  const [step, setStep] = useState(1);
  const [invoiceId, setInvoiceId] = useState<Id<"invoices"> | null>(
    invoiceIdProp ? (invoiceIdProp as Id<"invoices">) : null,
  );

  const [form, setForm] = useState<InvoiceForm>(() => ({
    clientName: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    currency: "PKR",
    items: [blankItem("Trip package")],
    discount: 0,
    tax: 0,
    advanceAmount: 0,
    tripSummary: "",
    paymentMethod: "bank",
    paymentDetails: "",
    terms: "",
    cancellationPolicy: "",
  }));
  const {
    clientName,
    invoiceDate,
    currency,
    items,
    discount,
    tax,
    advanceAmount,
    tripSummary,
    paymentMethod,
    paymentDetails,
    terms,
    cancellationPolicy,
  } = form;
  const formRef = useRef(form);
  formRef.current = form;

  const [msg, setMsg] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const companyLogoUrl = useQuery(api.media.getSiteAssetUrl, { key: "logo" });
  const publicSettings = useQuery(api.siteSettings.getPublicSiteSettings, {});
  const fallbackLogoAbs = useMemo(() => toAbsoluteUrl(DEFAULT_LOGO_URL), []);
  const settings = publicSettings as
    | {
        officeAddress?: string;
        whatsappPhone?: string;
        contactEmail?: string;
        website?: string;
        governmentLicenseNo?: string;
        governmentLicenseNo2?: string;
        bankDetails?: {
          bankName?: string;
          accountTitle?: string;
          accountNumber?: string;
          iban?: string;
          instruction?: string;
        };
      }
    | undefined;
  const officeAddress = settings?.officeAddress?.trim() || undefined;
  const bankDetails = settings?.bankDetails;

  /** Same rows the PDF/Word exports print, so the Payment step shows exactly
   *  what the client will see — the admin never has to retype them. */
  const bankRows = useMemo(
    () =>
      (
        [
          ["Bank name", bankDetails?.bankName],
          ["Account title", bankDetails?.accountTitle],
          ["Account number", bankDetails?.accountNumber],
          ["IBAN", bankDetails?.iban],
          ["Instruction", bankDetails?.instruction],
        ] as Array<[string, string | undefined]>
      )
        .map(([label, value]): [string, string] => [label, value?.trim() ?? ""])
        .filter(([, value]) => value.length > 0),
    [bankDetails],
  );

  const invoiceQuery = useSafeQuery(
    api.invoices.getForAdmin,
    invoiceId && canMutate ? { sessionToken, invoiceId } : "skip",
  );
  const invoiceDoc = invoiceQuery.data as InvoiceDoc | null | undefined;

  const linkedItinerary = useSafeQuery(
    api.itineraries.getForAdmin,
    invoiceDoc?.itineraryId && canMutate
      ? { sessionToken, itineraryId: invoiceDoc.itineraryId }
      : "skip",
  ).data as LinkedItinerary | null | undefined;
  const importableItems = useMemo(() => itemsFromItinerary(linkedItinerary), [linkedItinerary]);

  /** Id whose saved values are in the form. Nothing is saved before this. */
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const isHydrated = Boolean(invoiceId) && hydratedId === String(invoiceId);

  useEffect(() => {
    if (!invoiceDoc || !invoiceId || hydratedId === String(invoiceId)) return;
    setForm(formFromDoc(invoiceDoc));
    setHydratedId(String(invoiceId));
  }, [invoiceDoc, invoiceId, hydratedId]);

  const autosave = useAutosave<InvoicePatch>({
    enabled: canMutate && isHydrated,
    save: async (patch) => {
      if (!sessionToken || !invoiceId) throw new Error("Not authenticated");
      await patchDraft({ sessionToken, invoiceId, ...patch });
    },
  });
  const { queue: queueSave, flush: flushSave } = autosave;

  /** Updates the form and queues exactly the changed fields for saving. */
  function update(patch: Partial<InvoiceForm>, save: InvoicePatch = patch) {
    setForm((f) => ({ ...f, ...patch }));
    if (invoiceId) queueSave(save);
  }

  function updateItems(next: InvoiceItem[]) {
    const safe = next.length ? next : [blankItem()];
    update({ items: safe });
  }

  // Local crash backup (per invoice) while edits are unsaved.
  const dirty = isHydrated ? autosave.hasPending : !invoiceId && clientName.trim().length > 0;
  const localDraft = useLocalDraft<InvoiceForm>(
    invoiceId && !isHydrated ? null : `draft:invoice:${invoiceId ?? "new"}`,
    form,
    dirty,
  );
  const { restorable, clear: clearBackup, dismiss: dismissBackup } = localDraft;

  useEffect(() => {
    if (!restorable || !isHydrated) return;
    if (JSON.stringify(restorable.data) === JSON.stringify(form)) clearBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restorable, isHydrated]);

  useEffect(() => {
    if (!invoiceId || restorable) return;
    if (autosave.status === "saved" && !autosave.hasPending) clearBackup();
  }, [autosave.hasPending, autosave.status, clearBackup, invoiceId, restorable]);

  useUnsavedChangesGuard(dirty || creating);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantity || 0) * (i.price || 0), 0),
    [items],
  );
  const discountPct = clamp(discount || 0, 0, 100);
  const taxPct = clamp(tax || 0, 0, 100);
  const discountAmount = (subtotal * discountPct) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableBase * taxPct) / 100;
  const total = Math.max(0, taxableBase + taxAmount);
  const remainingBalance = Math.max(0, total - Math.max(0, advanceAmount || 0));

  const pdfModel: InvoicePdfModel | null = useMemo(() => {
    if (!clientName.trim()) return null;
    return {
      invoiceNumberLabel: invoiceDoc?.invoiceNumber,
      invoiceDateLabel: invoiceDate,
      currency,
      companyLogoUrl: toAbsoluteUrl(companyLogoUrl) ?? fallbackLogoAbs,
      companyName: "JunketTours",
      companyAddress: officeAddress,
      licenceNumber: settings?.governmentLicenseNo?.trim() || undefined,
      licenceNumber2: settings?.governmentLicenseNo2?.trim() || undefined,
      contact: {
        phone: settings?.whatsappPhone?.trim() || undefined,
        email: settings?.contactEmail?.trim() || undefined,
        website: settings?.website?.trim() || undefined,
        officeAddress,
      },
      client: { name: clientName },
      items: items.map((i) => ({
        name: i.name,
        description: i.description?.trim() || undefined,
        quantity: clamp(i.quantity || 0, 0, 9999),
        price: Math.max(0, i.price || 0),
      })),
      discount: discountPct,
      tax: taxPct,
      advanceAmount: Math.max(0, advanceAmount || 0),
      isFinal: invoiceDoc?.status === "paid",
      tripSummary: tripSummary.trim() || undefined,
      payment: { method: paymentMethod, details: paymentDetails },
      bankDetails,
      notes: { terms: terms || undefined, cancellationPolicy: cancellationPolicy || undefined },
    };
  }, [
    invoiceDoc?.invoiceNumber,
    invoiceDoc?.status,
    bankDetails,
    clientName,
    invoiceDate,
    currency,
    companyLogoUrl,
    fallbackLogoAbs,
    officeAddress,
    settings,
    items,
    discountPct,
    taxPct,
    advanceAmount,
    tripSummary,
    paymentMethod,
    paymentDetails,
    terms,
    cancellationPolicy,
  ]);

  async function onCreateDraft() {
    if (!sessionToken || creating || invoiceId) return;
    if (!clientName.trim()) {
      setMsg("Enter client name to continue.");
      return;
    }
    setMsg(null);
    setCreating(true);
    const sent = { ...form };
    try {
      const id = await createDraft({
        sessionToken,
        clientName: sent.clientName,
        invoiceDate: sent.invoiceDate,
        currency: sent.currency,
        advanceAmount: Math.max(0, sent.advanceAmount || 0),
        tripSummary: sent.tripSummary.trim() || undefined,
      });
      clearBackup();
      setInvoiceId(id);
      setHydratedId(String(id));
      // Anything typed while the draft was being created is saved right away.
      const cur = formRef.current;
      const changed: InvoicePatch = {};
      if (cur.clientName !== sent.clientName) changed.clientName = cur.clientName;
      if (cur.invoiceDate !== sent.invoiceDate) changed.invoiceDate = cur.invoiceDate;
      if (cur.currency !== sent.currency) changed.currency = cur.currency;
      if (Object.keys(changed).length) queueSave(changed);
      // Refreshing now reopens this invoice instead of creating another one.
      window.history.replaceState(null, "", `/admin/invoices/${id}`);
      setStep(2);
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  /** Runs `action` only after every pending edit has been saved. */
  async function afterSave(action: () => Promise<void>) {
    setMsg(null);
    try {
      await flushSave();
      await action();
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    }
  }

  function next() {
    if (step === 1) {
      if (invoiceId) setStep(2);
      else void onCreateDraft();
      return;
    }
    if (step === STEPS.length) {
      setFinishing(true);
      void afterSave(async () => {
        router.push("/admin/invoices");
      }).finally(() => setFinishing(false));
      return;
    }
    setStep((s) => clamp(s + 1, 1, STEPS.length));
  }

  if (!canMutate) {
    return (
      <p className="text-sm text-amber-800">
        {liveToken === undefined ? "Loading your session…" : "You need an admin session to create invoices."}
      </p>
    );
  }

  if (invoiceId && !isHydrated) {
    if (invoiceDoc === null) return <p className="text-sm text-muted">Invoice not found.</p>;
    return (
      <div className="space-y-3">
        <QueryErrorBanner error={invoiceQuery.error} />
        <p className="text-sm text-muted">Loading invoice…</p>
      </div>
    );
  }

  return (
    <>
      <QueryErrorBanner error={sessionLost ? new Error("Not authenticated") : invoiceQuery.error} />

      {restorable ? (
        <DraftRestoreBanner
          savedAt={restorable.savedAt}
          onRestore={() => {
            const data = restorable.data;
            setForm(data);
            if (invoiceId) queueSave(data);
            dismissBackup();
          }}
          onDiscard={clearBackup}
        />
      ) : null}

      {msg ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {msg}
        </div>
      ) : null}

      <WizardLayout
        title={invoiceDoc?.invoiceNumber ? `Invoice ${invoiceDoc.invoiceNumber}` : "Invoice"}
        steps={STEPS}
        currentStep={step}
        onBack={step === 1 ? undefined : () => setStep((s) => clamp(s - 1, 1, STEPS.length))}
        onNext={next}
        nextLabel={step === 1 && creating ? "Creating…" : step === STEPS.length ? (finishing ? "Saving…" : "Final") : "Next"}
        backDisabled={step === 1}
        nextDisabled={step === 1 ? !clientName.trim() || creating : finishing}
        rightActions={
          <>
            {invoiceId ? <SaveStatusPill status={autosave.status} error={autosave.error} /> : null}
            {autosave.status === "error" ? (
              <Button type="button" variant="secondary" onClick={() => void flushSave().catch(() => undefined)}>
                Retry save
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
              Preview PDF
            </Button>
          </>
        }
      >
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <FieldLabel required>Client name</FieldLabel>
              <TextInput
                required
                value={clientName}
                onChange={(e) => update({ clientName: e.target.value })}
                placeholder="Ahmed Ali"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel required>Invoice date</FieldLabel>
                <TextInput
                  required
                  type="date"
                  min={invoiceId ? undefined : minDate}
                  value={invoiceDate}
                  onChange={(e) => update({ invoiceDate: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel required>Currency</FieldLabel>
                <SelectField
                  value={currency}
                  onChange={(e) => update({ currency: e.target.value as Currency })}
                >
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                </SelectField>
              </div>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Line items</p>
              <div className="flex items-center gap-2">
                {importableItems.length ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const ok = window.confirm(
                        "Import packages from the linked itinerary? This will replace your current items.",
                      );
                      if (ok) updateItems(importableItems);
                    }}
                  >
                    Import packages
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" onClick={() => updateItems([...items, blankItem()])}>
                  + Add item
                </Button>
              </div>
            </div>

            {items.length ? (
              <div className="rounded-2xl border border-border bg-panel-elevated p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Package preview</p>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-4">
                  <div className="min-w-0 sm:col-span-2">
                    <p className="text-xs text-muted">Item</p>
                    <p className="truncate font-semibold text-foreground">
                      {items[0]?.name?.trim() || "Trip package"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Qty</p>
                    <p className="font-semibold tabular-nums text-foreground">{items[0]?.quantity ?? 1}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Price</p>
                    <p className="font-semibold tabular-nums text-foreground">
                      {money(currency, items[0]?.price ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {items.map((it, idx) => {
                const setItem = (patch: Partial<InvoiceItem>) =>
                  updateItems(items.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
                return (
                  <div key={idx} className="rounded-2xl border border-border bg-panel-elevated p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Item name</FieldLabel>
                        <TextInput
                          value={it.name}
                          onChange={(e) => setItem({ name: e.target.value })}
                          placeholder={idx === 0 ? "Trip package" : "Add-on / Service"}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Qty</FieldLabel>
                          <TextInput
                            type="number"
                            min={0}
                            value={it.quantity}
                            onChange={(e) => setItem({ quantity: num(e.target.value) })}
                          />
                        </div>
                        <div>
                          <FieldLabel>Price</FieldLabel>
                          <TextInput
                            type="number"
                            min={0}
                            value={it.price}
                            onChange={(e) => setItem({ price: num(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <FieldLabel>Description (optional)</FieldLabel>
                      <TextAreaField
                        rows={3}
                        value={it.description ?? ""}
                        onChange={(e) => setItem({ description: e.target.value })}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-muted">
                        Line total:{" "}
                        <span className="font-semibold text-foreground">
                          {money(currency, (it.quantity || 0) * (it.price || 0))}
                        </span>
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                        onClick={() => {
                          const hasContent = it.name.trim() || it.description?.trim() || it.price;
                          if (hasContent && !window.confirm(`Remove "${it.name || "this item"}"?`)) return;
                          updateItems(items.filter((_, i) => i !== idx));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <FieldLabel>Trip summary (shows on invoice)</FieldLabel>
              <TextAreaField
                rows={5}
                value={tripSummary}
                onChange={(e) => update({ tripSummary: e.target.value })}
                placeholder="Short summary of the trip: destinations, dates, inclusions, vehicle, hotels…"
              />
            </div>
          </div>
        ) : step === 3 ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Discount (%)</FieldLabel>
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={discountPct}
                  onChange={(e) => {
                    const v = clamp(num(e.target.value), 0, 100);
                    update({ discount: v });
                  }}
                />
              </div>
              <div>
                <FieldLabel>Tax (%)</FieldLabel>
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={taxPct}
                  onChange={(e) => {
                    const v = clamp(num(e.target.value), 0, 100);
                    update({ tax: v });
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Totals</p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold text-foreground">{money(currency, subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Discount ({discountPct}%)</span>
                  <span className="font-semibold text-foreground">{money(currency, discountAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Tax ({taxPct}%)</span>
                  <span className="font-semibold text-foreground">{money(currency, taxAmount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-sm font-semibold text-foreground">Trip total</span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {money(currency, total)}
                  </span>
                </div>
                <div className="mt-3">
                  <FieldLabel>Already paid (advance)</FieldLabel>
                  <TextInput
                    type="number"
                    min={0}
                    step="0.01"
                    value={advanceAmount}
                    onChange={(e) => update({ advanceAmount: Math.max(0, num(e.target.value)) })}
                    placeholder="0"
                  />
                  <FieldHint>Deposit or payment already received from the customer.</FieldHint>
                </div>
                <div className="mt-4 rounded-xl border-2 border-havezic-primary/40 bg-havezic-primary/5 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-havezic-primary">Amount due</p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
                    {invoiceDoc?.status === "paid" || remainingBalance <= 0.00001
                      ? "Paid"
                      : money(currency, remainingBalance)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    What the customer pays now (trip total minus any advance).
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : step === 4 ? (
          <div className="space-y-4">
            <div>
              <FieldLabel required>Payment method</FieldLabel>
              <SelectField
                value={paymentMethod}
                onChange={(e) => update({ paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="bank">Bank transfer</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
              </SelectField>
            </div>

            {paymentMethod === "bank" ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bank details — printed on this invoice automatically
                </p>
                {bankRows.length > 0 ? (
                  <dl className="mt-2 space-y-1 text-sm">
                    {bankRows.map(([label, value]) => (
                      <div key={label} className="flex flex-wrap gap-x-2">
                        <dt className="min-w-[7.5rem] text-slate-500">{label}</dt>
                        <dd className="font-semibold text-slate-800">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-amber-700">
                    No bank details saved yet — add them in Admin → Settings and they will appear here and
                    on every invoice.
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Managed in <span className="font-semibold">Admin → Settings</span>. No need to retype
                  them below — use the box only for extra instructions.
                </p>
              </div>
            ) : null}

            <div>
              <FieldLabel required>Payment details</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["template", "Use template"],
                    ["bank", "Bank"],
                    ["easypaisa", "Easypaisa"],
                    ["jazzcash", "JazzCash"],
                  ] as const
                ).map(([key, label]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const method = key === "template" ? paymentMethod : key;
                      const t = paymentTemplate(method);
                      if (
                        paymentDetails.trim() &&
                        paymentDetails.trim() !== t &&
                        !window.confirm("Replace the current payment details with the template?")
                      ) {
                        return;
                      }
                      update({ paymentMethod: method, paymentDetails: t });
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <TextAreaField
                rows={6}
                value={paymentDetails}
                onChange={(e) => update({ paymentDetails: e.target.value })}
                placeholder="Account title, IBAN, number, instructions…"
              />
              {paymentMethod === "bank" ? (
                <FieldHint>
                  The bank details above are added automatically — this box is for extra instructions only.
                </FieldHint>
              ) : null}
            </div>
          </div>
        ) : step === 5 ? (
          <div className="space-y-4">
            <div>
              <FieldLabel>Terms & conditions</FieldLabel>
              <TextAreaField rows={5} value={terms} onChange={(e) => update({ terms: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Cancellation policy</FieldLabel>
              <TextAreaField
                rows={5}
                value={cancellationPolicy}
                onChange={(e) => update({ cancellationPolicy: e.target.value })}
              />
              <FieldHint>Keep it short and clear for clients.</FieldHint>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">Preview and export your invoice PDF.</p>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
                Preview
              </Button>
              {pdfModel ? (
                <PDFDownloadLink document={<InvoicePdf model={pdfModel} />} fileName={`invoice-${invoiceDate}.pdf`}>
                  {({ loading }) => (
                    <Button type="button" disabled={loading}>
                      {loading ? "Preparing…" : "Download PDF"}
                    </Button>
                  )}
                </PDFDownloadLink>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                disabled={!invoiceId || docxLoading}
                onClick={() => {
                  if (!invoiceId || !sessionToken) return;
                  setDocxLoading(true);
                  // The Word file is built from the saved record — save first.
                  void afterSave(async () => {
                    const res = await exportDocx({ sessionToken, invoiceId });
                    window.open(res.url, "_blank", "noopener,noreferrer");
                  }).finally(() => setDocxLoading(false));
                }}
              >
                {docxLoading ? "Preparing…" : "Download Word"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!invoiceId || invoiceDoc?.status === "paid"}
                onClick={() => {
                  if (!invoiceId || !sessionToken) return;
                  void afterSave(async () => {
                    await markPaid({ sessionToken, invoiceId });
                    setMsg("Marked as paid.");
                  });
                }}
              >
                {invoiceDoc?.status === "paid" ? "Paid" : "Mark as paid"}
              </Button>
            </div>
          </div>
        )}
      </WizardLayout>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Invoice preview"
        description="This is the PDF preview (Option A)."
        panelClassName="max-w-5xl"
        fullscreenOnMobile
      >
        <div className="relative flex h-[82dvh] flex-col overflow-hidden rounded-xl border border-border bg-white sm:h-[75dvh]">
          <div className="min-h-0 flex-1">
            {pdfModel ? (
              <PDFViewer style={{ width: "100%", height: "100%" }}>
                <InvoicePdf model={pdfModel} />
              </PDFViewer>
            ) : (
              <p className="p-4 text-sm text-muted">Select a client to preview.</p>
            )}
          </div>
          <div className="z-10 flex items-center justify-between gap-2 border-t border-border bg-slate-900 px-3 py-2 text-white sm:px-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPreviewOpen(false)}
              className="border-white/15 bg-white/10 text-white hover:bg-white/15"
            >
              Close
            </Button>
            {pdfModel ? (
              <PDFDownloadLink document={<InvoicePdf model={pdfModel} />} fileName={`invoice-${invoiceDate}.pdf`}>
                {({ loading }) => (
                  <Button type="button" disabled={loading} className="bg-brand-primary text-white">
                    {loading ? "Preparing…" : "Download PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  );
}
