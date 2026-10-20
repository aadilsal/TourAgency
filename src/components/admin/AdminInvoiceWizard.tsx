"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  AdminField,
  RequiredFieldsNote,
  useRequiredFields,
} from "@/components/admin/shared/AdminField";
import { SelectField, TextAreaField, TextInput } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { IconAction } from "@/components/admin/shared/IconAction";
import { Modal } from "@/components/ui/Modal";
import { todayYmdLocal } from "@/lib/todayYmdLocal";
import { toAbsoluteUrl } from "@/lib/absoluteUrl";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { PDFDownloadLink, PDFViewer, pdf } from "@react-pdf/renderer";
import { InvoicePdf, type InvoicePdfModel } from "@/documents/invoice/InvoicePdf";
import type { PackageTier } from "@/lib/tours/itineraryPackageMatrix";
import { normalizePackageTier } from "@/components/admin/itinerary/itineraryModel";
import {
  INVOICE_STATUS_OPTIONS,
  type InvoiceStatus,
} from "@/components/admin/itinerary/documentStatus";
import { SendToCustomerButtons } from "@/components/admin/itinerary/SendToCustomerButtons";
import {
  invoiceMessage,
  isPhoneViewport,
  openPdfInNewTab,
} from "@/components/admin/itinerary/sendToCustomer";

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
  clientPhone?: string;
  clientEmail?: string;
  itineraryId?: Id<"itineraries">;
  invoiceDate: string;
  currency: Currency;
  status: InvoiceStatus;
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
  clientPhone: string;
  clientEmail: string;
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

type WalletAccounts = {
  easypaisaAccountTitle?: string;
  easypaisaNumber?: string;
  jazzcashAccountTitle?: string;
  jazzcashNumber?: string;
};

function paymentTemplate(method: PaymentMethod, wallets: WalletAccounts | undefined) {
  if (method === "easypaisa" || method === "jazzcash") {
    const isEp = method === "easypaisa";
    const title = (isEp ? wallets?.easypaisaAccountTitle : wallets?.jazzcashAccountTitle)?.trim();
    const number = (isEp ? wallets?.easypaisaNumber : wallets?.jazzcashNumber)?.trim();
    return [
      `${isEp ? "Easypaisa" : "JazzCash"} payment details`,
      "",
      `Account title: ${title || "Junket Tours"}`,
      number ? `Account number: ${number}` : "",
      "Please share a screenshot after payment.",
    ]
      .filter((line, i) => i === 1 || line)
      .join("\n");
  }
  // Bank account details are printed on every invoice automatically, so the
  // template only carries optional instructions.
  return "Please share the payment receipt after completing the transfer.";
}

function formFromDoc(doc: InvoiceDoc): InvoiceForm {
  return {
    clientName: doc.clientName ?? "",
    clientPhone: doc.clientPhone ?? "",
    clientEmail: doc.clientEmail ?? "",
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
  title?: string;
  startDate?: string;
  endDate?: string;
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
  const setInvoiceStatus = useMutation(api.invoices.setStatus);
  const exportDocx = useAction(api.documentsActions.exportInvoiceDocx);

  const [step, setStep] = useState(1);
  const [invoiceId, setInvoiceId] = useState<Id<"invoices"> | null>(
    invoiceIdProp ? (invoiceIdProp as Id<"invoices">) : null,
  );

  const [form, setForm] = useState<InvoiceForm>(() => ({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
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
    clientPhone,
    clientEmail,
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

  // Required by api.invoices.createDraft (clientName: v.string()). Only gates
  // the step-1 "Next" (which creates the draft) — never autosave.
  const req = useRequiredFields(
    [{ name: "clientName", label: "Client name", value: clientName }],
    { idPrefix: "invoice" },
  );
  const clientNameError = req.errorFor("clientName");
  // Also required by createDraft; it defaults to today, so it can only be
  // blank if the admin cleared it. Marked, not blocking.
  const invoiceDateError = invoiceDate.trim() ? undefined : "Invoice date is required";

  const [msg, setMsg] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const companyLogoUrl = useQuery(api.media.getSiteAssetUrl, { key: "logo" });
  const adminSettings = useSafeQuery(
    api.siteSettings.getAdminSiteSettings,
    canMutate ? { sessionToken } : "skip",
  ).data;
  const fallbackLogoAbs = useMemo(() => toAbsoluteUrl(DEFAULT_LOGO_URL), []);
  const settings = adminSettings as
    | (WalletAccounts & {
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
        invoiceDefaults?: { terms: string; cancellationPolicy: string };
      })
    | undefined;
  const invoiceDefaults = settings?.invoiceDefaults;
  // A brand-new invoice starts with the default terms / cancellation text
  // (once, only into empty boxes). Existing invoices are never changed.
  const textDefaultsApplied = useRef(false);
  useEffect(() => {
    if (textDefaultsApplied.current || invoiceIdProp || invoiceId || !invoiceDefaults) return;
    textDefaultsApplied.current = true;
    setForm((f) => ({
      ...f,
      terms: f.terms.trim() ? f.terms : invoiceDefaults.terms,
      cancellationPolicy: f.cancellationPolicy.trim()
        ? f.cancellationPolicy
        : invoiceDefaults.cancellationPolicy,
    }));
  }, [invoiceDefaults, invoiceId, invoiceIdProp]);

  // Client-only screen (loaded with ssr: false), so reading the viewport here is safe.
  const [isPhone, setIsPhone] = useState(() => isPhoneViewport());
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia("(min-width: 1024px)");
    } catch {
      return;
    }
    const sync = () => setIsPhone(isPhoneViewport());
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq?.removeEventListener?.("change", sync);
  }, []);

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

  const typedDuringCreateRef = useRef<Partial<InvoiceForm> | null>(null);
  /** Id whose saved values are in the form. Nothing is saved before this. */
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const isHydrated = Boolean(invoiceId) && hydratedId === String(invoiceId);

  useEffect(() => {
    if (!invoiceDoc || !invoiceId || hydratedId === String(invoiceId)) return;
    // Edits typed while the draft was being created stay on top (they are
    // already queued for saving).
    const overlay = typedDuringCreateRef.current;
    typedDuringCreateRef.current = null;
    setForm({ ...formFromDoc(invoiceDoc), ...(overlay ?? {}) });
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
      client: {
        name: clientName,
        phone: clientPhone.trim() || undefined,
        email: clientEmail.trim() || undefined,
      },
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
    clientPhone,
    clientEmail,
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

  const sendMessage = useMemo(
    () =>
      invoiceMessage({
        clientName,
        invoiceNumber: invoiceDoc?.invoiceNumber,
        tripTitle: linkedItinerary?.title,
        startDate: linkedItinerary?.startDate,
        endDate: linkedItinerary?.endDate,
        totalLabel: money(currency, total),
        dueLabel:
          invoiceDoc?.status === "paid" || remainingBalance <= 0.00001
            ? undefined
            : money(currency, remainingBalance),
      }),
    [clientName, currency, invoiceDoc?.invoiceNumber, invoiceDoc?.status, linkedItinerary, remainingBalance, total],
  );
  const pdfModelRef = useRef(pdfModel);
  pdfModelRef.current = pdfModel;
  const invoiceDateRef = useRef(invoiceDate);
  invoiceDateRef.current = invoiceDate;
  /** Invoice PDF for "Share PDF" / phone preview (edits saved first). */
  const makePdf = useCallback(async () => {
    await flushSave();
    const model = pdfModelRef.current;
    if (!model) throw new Error("Enter the client name first.");
    const blob = await pdf(<InvoicePdf model={model} />).toBlob();
    return { blob, fileName: `invoice-${invoiceDateRef.current}.pdf` };
  }, [flushSave]);

  function openPreview() {
    if (!isPhone) {
      setPreviewOpen(true);
      return;
    }
    // Phones can't show an embedded PDF well: open it in a new tab instead.
    setMsg(null);
    void openPdfInNewTab(async () => (await makePdf()).blob).catch((e) =>
      setMsg(`Couldn't open the PDF. ${toUserFacingErrorMessage(e)}`),
    );
  }

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
      const serverFillsText = !textDefaultsApplied.current;
      const id = await createDraft({
        sessionToken,
        clientName: sent.clientName,
        clientPhone: sent.clientPhone.trim() || undefined,
        clientEmail: sent.clientEmail.trim() || undefined,
        invoiceDate: sent.invoiceDate,
        currency: sent.currency,
        advanceAmount: Math.max(0, sent.advanceAmount || 0),
        tripSummary: sent.tripSummary.trim() || undefined,
        // Send what's on screen (the defaults the admin saw, or their edits).
        // Before the defaults have loaded, leave them to the server.
        terms: textDefaultsApplied.current || sent.terms.trim() ? sent.terms : undefined,
        cancellationPolicy:
          textDefaultsApplied.current || sent.cancellationPolicy.trim()
            ? sent.cancellationPolicy
            : undefined,
      });
      clearBackup();
      setInvoiceId(id);
      // Anything typed while the draft was being created is saved right away.
      const cur = formRef.current;
      const changed: InvoicePatch = {};
      if (cur.clientName !== sent.clientName) changed.clientName = cur.clientName;
      if (cur.clientPhone !== sent.clientPhone) changed.clientPhone = cur.clientPhone;
      if (cur.clientEmail !== sent.clientEmail) changed.clientEmail = cur.clientEmail;
      if (cur.terms !== sent.terms) changed.terms = cur.terms;
      if (cur.cancellationPolicy !== sent.cancellationPolicy) {
        changed.cancellationPolicy = cur.cancellationPolicy;
      }
      if (cur.invoiceDate !== sent.invoiceDate) changed.invoiceDate = cur.invoiceDate;
      if (cur.currency !== sent.currency) changed.currency = cur.currency;
      if (serverFillsText && !sent.terms.trim() && !sent.cancellationPolicy.trim()) {
        // The server filled in the default text: load the saved invoice so the
        // form shows it, keeping anything typed meanwhile on top.
        textDefaultsApplied.current = true;
        typedDuringCreateRef.current = changed as Partial<InvoiceForm>;
        setHydratedId(null);
      } else {
        setHydratedId(String(id));
      }
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
      // Same rule as before (Next was disabled without a client name), but a
      // click now highlights and focuses the field instead of doing nothing.
      if (!req.guardSubmit()) return;
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
            // Older backups predate some fields (e.g. client phone): keep the current values for those.
            const data = { ...formRef.current, ...restorable.data };
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
        nextLabel={step === 1 && creating ? "Creating…" : step === STEPS.length ? (finishing ? "Saving…" : "Done") : "Next"}
        backDisabled={step === 1}
        nextDisabled={step === 1 ? creating : finishing}
        rightActions={
          <>
            {invoiceId ? <SaveStatusPill status={autosave.status} error={autosave.error} /> : null}
            {autosave.status === "error" ? (
              <Button type="button" variant="secondary" onClick={() => void flushSave().catch(() => undefined)}>
                Retry save
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={openPreview}>
              Preview PDF
            </Button>
          </>
        }
      >
        {step === 1 ? (
          <div className="space-y-4">
            <RequiredFieldsNote />
            <AdminField
              label="Client name"
              htmlFor={req.id("clientName")}
              required
              tip="The customer this invoice is billed to. Printed in the 'Bill to' block of the PDF and Word file."
              error={clientNameError}
            >
              <TextInput
                {...req.fieldProps("clientName")}
                error={Boolean(clientNameError)}
                value={clientName}
                onChange={(e) => update({ clientName: e.target.value })}
                placeholder="e.g. Ahmed Ali"
              />
            </AdminField>

            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField
                label="Customer phone (optional)"
                htmlFor="invoice-client-phone"
                tip="Printed under the client name, and used by “Send on WhatsApp”."
              >
                <TextInput
                  id="invoice-client-phone"
                  type="tel"
                  inputMode="tel"
                  value={clientPhone}
                  onChange={(e) => update({ clientPhone: e.target.value })}
                  placeholder="e.g. 0300 1234567"
                />
              </AdminField>
              <AdminField
                label="Customer email (optional)"
                htmlFor="invoice-client-email"
                tip="Printed under the client name, and used by “Send by email”."
              >
                <TextInput
                  id="invoice-client-email"
                  type="email"
                  inputMode="email"
                  value={clientEmail}
                  onChange={(e) => update({ clientEmail: e.target.value })}
                  placeholder="e.g. ahmed@gmail.com"
                />
              </AdminField>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField
                label="Invoice date"
                htmlFor="invoice-date"
                required
                tip="The date printed on the invoice. New invoices can't be backdated."
                error={invoiceDateError}
              >
                <TextInput
                  id="invoice-date"
                  aria-required
                  error={Boolean(invoiceDateError)}
                  type="date"
                  min={invoiceId ? undefined : minDate}
                  value={invoiceDate}
                  onChange={(e) => update({ invoiceDate: e.target.value })}
                />
              </AdminField>
              <AdminField
                label="Currency"
                htmlFor="invoice-currency"
                required
                tip="Currency for every price, total and the amount due on this invoice."
              >
                <SelectField
                  id="invoice-currency"
                  value={currency}
                  onChange={(e) => update({ currency: e.target.value as Currency })}
                >
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                </SelectField>
              </AdminField>
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
                      <AdminField
                        label="Item name"
                        htmlFor={`invoice-item-${idx}-name`}
                        tip="One line on the invoice table, e.g. the package or an add-on service."
                      >
                        <TextInput
                          id={`invoice-item-${idx}-name`}
                          value={it.name}
                          onChange={(e) => setItem({ name: e.target.value })}
                          placeholder={
                            idx === 0 ? "e.g. 7-day Hunza & Skardu package" : "e.g. Airport transfer (Skardu)"
                          }
                        />
                      </AdminField>
                      <div className="grid grid-cols-2 gap-3">
                        <AdminField
                          label="Qty"
                          htmlFor={`invoice-item-${idx}-qty`}
                          tip="How many of this item — e.g. number of travellers or rooms."
                        >
                          <TextInput
                            id={`invoice-item-${idx}-qty`}
                            type="number"
                            min={0}
                            value={it.quantity}
                            onChange={(e) => setItem({ quantity: num(e.target.value) })}
                            placeholder="e.g. 2"
                          />
                        </AdminField>
                        <AdminField
                          label={`Price (${currency})`}
                          htmlFor={`invoice-item-${idx}-price`}
                          tip="Price for one unit, in the invoice currency. Line total = Qty × Price."
                        >
                          <TextInput
                            id={`invoice-item-${idx}-price`}
                            type="number"
                            min={0}
                            value={it.price}
                            onChange={(e) => setItem({ price: num(e.target.value) })}
                            placeholder={currency === "USD" ? "e.g. 450" : "e.g. 125000"}
                          />
                        </AdminField>
                      </div>
                    </div>

                    <AdminField
                      className="mt-3"
                      label="Description (optional)"
                      htmlFor={`invoice-item-${idx}-description`}
                      tip="Extra detail printed under the item name, e.g. hotels, vehicle or dates."
                    >
                      <TextAreaField
                        id={`invoice-item-${idx}-description`}
                        rows={3}
                        value={it.description ?? ""}
                        onChange={(e) => setItem({ description: e.target.value })}
                        placeholder={"e.g. Prado 4x4 with driver\nHunza: Serena Inn (3N)\nSkardu: Shangrila Resort (2N)"}
                      />
                    </AdminField>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-muted">
                        Line total:{" "}
                        <span className="font-semibold text-foreground">
                          {money(currency, (it.quantity || 0) * (it.price || 0))}
                        </span>
                      </p>
                      <IconAction
                        label="Remove item"
                        onClick={() => {
                          const hasContent = it.name.trim() || it.description?.trim() || it.price;
                          if (hasContent && !window.confirm(`Remove "${it.name || "this item"}"?`)) return;
                          updateItems(items.filter((_, i) => i !== idx));
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <AdminField
                label="Trip summary (shows on invoice)"
                htmlFor="invoice-trip-summary"
                tip="A short paragraph printed on the invoice above the line items. Leave blank to hide it."
              >
                <TextAreaField
                  id="invoice-trip-summary"
                  rows={5}
                  value={tripSummary}
                  onChange={(e) => update({ tripSummary: e.target.value })}
                  placeholder="e.g. 7 days Lahore → Hunza → Skardu, 12–18 May. Prado with driver, 3-star hotels, breakfast & dinner included."
                />
              </AdminField>
            </div>
          </div>
        ) : step === 3 ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField
                label="Discount (%)"
                htmlFor="invoice-discount"
                tip="Percentage taken off the subtotal before tax. Use 0 for no discount."
                hint="A percentage (0–100), not an amount."
              >
                <TextInput
                  id="invoice-discount"
                  placeholder="e.g. 10"
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
              </AdminField>
              <AdminField
                label="Tax (%)"
                htmlFor="invoice-tax"
                tip="Percentage added on top of the discounted subtotal. Use 0 if no tax applies."
                hint="A percentage (0–100), not an amount."
              >
                <TextInput
                  id="invoice-tax"
                  placeholder="e.g. 5"
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
              </AdminField>
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
                <AdminField
                  className="mt-3"
                  label={`Already paid (advance, ${currency})`}
                  htmlFor="invoice-advance"
                  tip="Subtracted from the trip total to get the amount due. Printed on the invoice."
                  hint="Deposit or payment already received from the customer."
                >
                  <TextInput
                    id="invoice-advance"
                    type="number"
                    min={0}
                    step="0.01"
                    value={advanceAmount}
                    onChange={(e) => update({ advanceAmount: Math.max(0, num(e.target.value)) })}
                    placeholder={currency === "USD" ? "e.g. 200" : "e.g. 50000"}
                  />
                </AdminField>
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
            <AdminField
              label="Payment method"
              htmlFor="invoice-payment-method"
              tip="How the customer should pay. Bank transfer prints your saved bank details automatically."
            >
              <SelectField
                id="invoice-payment-method"
                value={paymentMethod}
                onChange={(e) => {
                  const method = e.target.value as PaymentMethod;
                  // Fill the details box from Settings unless the admin wrote their own text.
                  const cur = paymentDetails.trim();
                  const isTemplate =
                    !cur ||
                    (["bank", "easypaisa", "jazzcash"] as const).some(
                      (m) => paymentTemplate(m, settings) === cur,
                    );
                  update(
                    isTemplate
                      ? { paymentMethod: method, paymentDetails: paymentTemplate(method, settings) }
                      : { paymentMethod: method },
                  );
                }}
              >
                <option value="bank">Bank transfer</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
              </SelectField>
            </AdminField>

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
            ) : (paymentMethod === "easypaisa" ? settings?.easypaisaNumber : settings?.jazzcashNumber)?.trim() ? null : (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                No {paymentMethod === "easypaisa" ? "Easypaisa" : "JazzCash"} number saved yet — add it in{" "}
                <span className="font-semibold">Admin → Settings</span> and it will be filled in here.
              </p>
            )}

            <AdminField
              label="Payment details"
              htmlFor="invoice-payment-details"
              tip="Printed in the payment section of the invoice. Use a template button to start from a ready-made text."
              hint={
                paymentMethod === "bank"
                  ? "The bank details above are added automatically — this box is for extra instructions only."
                  : undefined
              }
            >
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
                      const t = paymentTemplate(method, settings);
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
                id="invoice-payment-details"
                rows={6}
                value={paymentDetails}
                onChange={(e) => update({ paymentDetails: e.target.value })}
                placeholder={
                  paymentMethod === "bank"
                    ? "e.g. Please share the transfer receipt on WhatsApp +92 300 1234567."
                    : "e.g. Account title: Junket Tours\nAccount number: 0300 1234567\nShare a screenshot after payment."
                }
              />
            </AdminField>
          </div>
        ) : step === 5 ? (
          <div className="space-y-4">
            {invoiceDefaults &&
            ((!terms.trim() && invoiceDefaults.terms) ||
              (!cancellationPolicy.trim() && invoiceDefaults.cancellationPolicy)) ? (
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const patch: Partial<InvoiceForm> = {};
                    if (!terms.trim() && invoiceDefaults.terms) patch.terms = invoiceDefaults.terms;
                    if (!cancellationPolicy.trim() && invoiceDefaults.cancellationPolicy) {
                      patch.cancellationPolicy = invoiceDefaults.cancellationPolicy;
                    }
                    update(patch);
                  }}
                >
                  Fill empty boxes with our standard text
                </Button>
                <p className="mt-1 text-xs text-muted">
                  Standard text is edited in PDF payment terms &amp; policies.
                </p>
              </div>
            ) : null}
            <AdminField
              label="Terms & conditions"
              htmlFor="invoice-terms"
              tip="Printed in the notes section at the end of the invoice. Leave blank to hide it."
            >
              <TextAreaField
                id="invoice-terms"
                rows={5}
                value={terms}
                onChange={(e) => update({ terms: e.target.value })}
                placeholder={"e.g. 50% advance confirms the booking.\nBalance is due 7 days before departure."}
              />
            </AdminField>
            <AdminField
              label="Cancellation policy"
              htmlFor="invoice-cancellation"
              tip="Printed under the terms on the invoice. Leave blank to hide it."
              hint="Keep it short and clear for clients."
            >
              <TextAreaField
                id="invoice-cancellation"
                rows={5}
                value={cancellationPolicy}
                onChange={(e) => update({ cancellationPolicy: e.target.value })}
                placeholder={"e.g. Free cancellation up to 15 days before departure.\n50% refund 7–14 days before; no refund after that."}
              />
            </AdminField>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">Preview and export your invoice PDF.</p>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={openPreview}>
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
            </div>

            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <p className="text-sm font-semibold text-foreground">Send to customer</p>
              <p className="mt-1 text-xs text-muted">
                Opens WhatsApp or email with a ready message (trip, total and amount due). Attach the
                downloaded PDF — or on a phone use “Share PDF” to send the file directly.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <SendToCustomerButtons
                  phone={clientPhone}
                  email={clientEmail}
                  message={sendMessage}
                  emailSubject={`Invoice${invoiceDoc?.invoiceNumber ? ` ${invoiceDoc.invoiceNumber}` : ""} — JunketTours`}
                  makePdf={pdfModel ? makePdf : undefined}
                  onMessage={setMsg}
                />
              </div>
            </div>

            <AdminField
              label="Payment status"
              htmlFor="invoice-status"
              tip="Unpaid, advance received, or fully paid. “Fully paid” stamps PAID on the invoice."
            >
              <SelectField
                id="invoice-status"
                value={invoiceDoc?.status ?? "draft"}
                disabled={!invoiceId || statusSaving}
                onChange={(e) => {
                  if (!invoiceId || !sessionToken) return;
                  const status = e.target.value as InvoiceStatus;
                  setStatusSaving(true);
                  void afterSave(async () => {
                    await setInvoiceStatus({ sessionToken, invoiceId, status });
                  }).finally(() => setStatusSaving(false));
                }}
              >
                {INVOICE_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectField>
            </AdminField>
          </div>
        )}
      </WizardLayout>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Invoice preview"
        description="This is exactly what the customer will see."
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
