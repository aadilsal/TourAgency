"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
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

type Currency = "PKR" | "USD";
type PaymentMethod = "bank" | "easypaisa" | "jazzcash";

const DEFAULT_LOGO_URL = "/images-removebg-preview.png";

type InvoiceDoc = {
  _id: Id<"invoices">;
  invoiceNumber?: string;
  clientName: string;
  itineraryId?: Id<"itineraries">;
  invoiceDate: string;
  currency: Currency;
  status: "draft" | "paid";
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    price: number;
  }>;
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function money(currency: Currency, n: number) {
  const sym = currency === "USD" ? "$" : "PKR";
  return `${sym} ${Number.isFinite(n) ? n.toLocaleString() : "0"}`;
}

function paymentTemplate(method: PaymentMethod) {
  if (method === "easypaisa") {
    return [
      "Easypaisa payment details",
      "",
      "Account title: Junket Tours",
      "Account number: __________",
      "Instructions: Share screenshot after payment.",
    ].join("\n");
  }
  if (method === "jazzcash") {
    return [
      "JazzCash payment details",
      "",
      "Account title: Junket Tours",
      "Account number: __________",
      "Instructions: Share screenshot after payment.",
    ].join("\n");
  }
  return [
    "Bank transfer details",
    "",
    "Bank name: __________",
    "Account title: Junket Tours",
    "Account number: __________",
    "IBAN: __________",
    "Instructions: Share receipt after payment.",
  ].join("\n");
}

export function AdminInvoiceWizard({ invoiceId: invoiceIdProp }: { invoiceId?: string }) {
  const sessionToken = useConvexSessionToken();
  const canMutate = typeof sessionToken === "string";
  const minDate = useMemo(() => todayYmdLocal(), []);

  const createDraft = useMutation(api.invoices.createDraft);
  const patchDraft = useMutation(api.invoices.patchDraft);
  const markPaid = useMutation(api.invoices.markPaid);
  const exportDocx = useAction(api.documentsActions.exportInvoiceDocx);

  const [step, setStep] = useState(1);
  const steps = ["Basic", "Items", "Pricing", "Payment", "Notes", "Export"];

  const [invoiceId, setInvoiceId] = useState<Id<"invoices"> | null>(
    invoiceIdProp ? (invoiceIdProp as Id<"invoices">) : null,
  );
  const [clientName, setClientName] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [currency, setCurrency] = useState<Currency>("PKR");

  const [items, setItems] = useState<InvoiceDoc["items"]>([
    { name: "Trip package", description: "", quantity: 1, price: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [tripSummary, setTripSummary] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [paymentDetails, setPaymentDetails] = useState("");

  const [terms, setTerms] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");

  const [savingState, setSavingState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);

  const companyLogoUrl = useQuery(api.media.getSiteAssetUrl, { key: "logo" });
  const publicSettings = useQuery(api.siteSettings.getPublicSiteSettings, {});
  const fallbackLogoAbs = useMemo(() => toAbsoluteUrl(DEFAULT_LOGO_URL), []);
  const officeAddress = publicSettings?.officeAddress?.trim() || undefined;
  const whatsappPhone = publicSettings?.whatsappPhone?.trim() || undefined;
  const contactEmail = publicSettings?.contactEmail?.trim() || undefined;
  const website = (publicSettings as { website?: string } | undefined)?.website?.trim() || undefined;
  const governmentLicenseNo =
    (publicSettings as { governmentLicenseNo?: string } | undefined)?.governmentLicenseNo?.trim() ||
    undefined;

  const invoiceDoc = useQuery(
    api.invoices.getForAdmin,
    invoiceId && typeof sessionToken === "string"
      ? { sessionToken, invoiceId }
      : "skip",
  ) as InvoiceDoc | null | undefined;

  const linkedItinerary = useQuery(
    api.itineraries.getForAdmin,
    invoiceDoc?.itineraryId && typeof sessionToken === "string"
      ? { sessionToken, itineraryId: invoiceDoc.itineraryId }
      : "skip",
  ) as
    | {
        packages?: Array<{
          name: string;
          pricePkr?: number;
          vehicle?: string;
          note?: string;
          stays?: Array<{ location: string; hotel: string; nights: number }>;
        }>;
      }
    | null
    | undefined;

  const didHydrateFromDoc = useRef(false);
  useEffect(() => {
    if (didHydrateFromDoc.current) return;
    if (!invoiceDoc) return;
    // Hydrate local editor state once for editing existing invoices.
    setClientName(invoiceDoc.clientName ?? "");
    setInvoiceDate(invoiceDoc.invoiceDate ?? new Date().toISOString().slice(0, 10));
    setCurrency((invoiceDoc.currency as Currency) ?? "PKR");
    const nextItems = ((invoiceDoc.items as InvoiceDoc["items"]) ?? []).length
      ? ((invoiceDoc.items as InvoiceDoc["items"]) ?? [])
      : [{ name: "Trip package", description: "", quantity: 1, price: 0 }];
    setItems(nextItems);
    setDiscount(Number(invoiceDoc.discount ?? 0));
    setTax(Number(invoiceDoc.tax ?? 0));
    setAdvanceAmount(Number(invoiceDoc.advanceAmount ?? 0));
    setTripSummary(invoiceDoc.tripSummary ?? "");
    setPaymentMethod((invoiceDoc.paymentMethod as PaymentMethod) ?? "bank");
    setPaymentDetails(invoiceDoc.paymentDetails ?? "");
    setTerms(invoiceDoc.terms ?? "");
    setCancellationPolicy(invoiceDoc.cancellationPolicy ?? "");
    setSavingState("saved");
    didHydrateFromDoc.current = true;
  }, [invoiceDoc]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.quantity || 0) * (i.price || 0), 0);
  }, [items]);

  const discountPct = useMemo(() => clamp(discount || 0, 0, 100), [discount]);
  const taxPct = useMemo(() => clamp(tax || 0, 0, 100), [tax]);
  const discountAmount = useMemo(() => (subtotal * discountPct) / 100, [subtotal, discountPct]);
  const taxableBase = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);
  const taxAmount = useMemo(() => (taxableBase * taxPct) / 100, [taxableBase, taxPct]);
  const total = useMemo(() => {
    return Math.max(0, taxableBase + taxAmount);
  }, [taxableBase, taxAmount]);
  const remainingBalance = useMemo(() => {
    return Math.max(0, total - Math.max(0, advanceAmount || 0));
  }, [total, advanceAmount]);

  const saveTimer = useRef<number | null>(null);
  const lastPatchJson = useRef<string>("");

  function queuePatch(
    partial: Omit<Parameters<typeof patchDraft>[0], "sessionToken" | "invoiceId"> | null,
  ) {
    if (!canMutate || !invoiceId || !partial) return;
    const payload = { sessionToken, invoiceId, ...partial } as const;
    const json = JSON.stringify(payload);
    if (json === lastPatchJson.current) return;
    lastPatchJson.current = json;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSavingState("saving");
    saveTimer.current = window.setTimeout(() => {
      void (async () => {
        try {
          await patchDraft(payload);
          setSavingState("saved");
          setMsg(null);
        } catch (e) {
          setSavingState("error");
          setMsg(toUserFacingErrorMessage(e));
        }
      })();
    }, 350);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  const pdfModel: InvoicePdfModel | null = useMemo(() => {
    if (!clientName.trim()) return null;
    return {
      invoiceNumberLabel: invoiceDoc?.invoiceNumber,
      invoiceDateLabel: invoiceDate,
      currency,
      companyLogoUrl: toAbsoluteUrl(companyLogoUrl) ?? fallbackLogoAbs,
      companyName: "JunketTours",
      companyAddress: officeAddress,
      licenceNumber: governmentLicenseNo,
      contact: {
        phone: whatsappPhone,
        email: contactEmail,
        website,
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
      notes: { terms: terms || undefined, cancellationPolicy: cancellationPolicy || undefined },
    };
  }, [
    invoiceDoc?.invoiceNumber,
    invoiceDoc?.status,
    clientName,
    invoiceDate,
    currency,
    companyLogoUrl,
    fallbackLogoAbs,
    officeAddress,
    whatsappPhone,
    contactEmail,
    website,
    governmentLicenseNo,
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
    if (!canMutate) return;
    if (!clientName.trim()) {
      setMsg("Enter client name to continue.");
      return;
    }
    setMsg(null);
    try {
      const id = await createDraft({
        sessionToken,
        clientName,
        invoiceDate,
        currency,
        advanceAmount: Math.max(0, advanceAmount || 0),
        tripSummary: tripSummary.trim() || undefined,
      });
      setInvoiceId(id);
      setStep(2);
      setSavingState("saved");
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    }
  }

  function next() {
    if (step === 1) {
      if (invoiceId) {
        setStep(2);
      } else {
        void onCreateDraft();
      }
      return;
    }
    if (step === steps.length) {
      window.dispatchEvent(new Event("jt:routing:start"));
      window.location.href = "/admin/invoices";
      return;
    }
    setStep((s) => clamp(s + 1, 1, 6));
  }

  function back() {
    setStep((s) => clamp(s - 1, 1, 6));
  }

  if (!canMutate) {
    return (
      <p className="text-sm text-amber-800">
        {sessionToken === undefined
          ? "Loading your session…"
          : "You need an admin session to create invoices."}
      </p>
    );
  }

  return (
    <>
      {msg ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {msg}
        </div>
      ) : null}

      <WizardLayout
        title="Invoice"
        steps={steps}
        currentStep={step}
        onBack={step === 1 ? undefined : back}
        onNext={next}
        nextLabel={step === steps.length ? "Final" : "Next"}
        backDisabled={step === 1}
        nextDisabled={step === 1 ? !clientName.trim() : false}
        savingState={invoiceId ? savingState : "idle"}
        rightActions={
          <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
            Preview PDF
          </Button>
        }
      >
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <FieldLabel required>Client name</FieldLabel>
              <TextInput
                required
                value={clientName}
                onChange={(e) => {
                  const v = e.target.value;
                  setClientName(v);
                  queuePatch({ clientName: v });
                }}
                placeholder="Ahmed Ali"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel required>Invoice date</FieldLabel>
                <TextInput
                  required
                  type="date"
                  min={minDate}
                  value={invoiceDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setInvoiceDate(v);
                    queuePatch({ invoiceDate: v });
                  }}
                />
              </div>
              <div>
                <FieldLabel required>Currency</FieldLabel>
                <SelectField
                  value={currency}
                  onChange={(e) => {
                    const v = e.target.value as Currency;
                    setCurrency(v);
                    queuePatch({ currency: v });
                  }}
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
                {linkedItinerary?.packages?.length ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const ok = window.confirm(
                        "Import packages from the linked itinerary? This will replace your current items.",
                      );
                      if (!ok) return;
                      const next = (linkedItinerary.packages ?? [])
                        .filter((p) => (p.name ?? "").trim())
                        .map((p) => {
                          const stays = (p.stays ?? [])
                            .map((s) => `${s.location}: ${s.hotel} (${s.nights}N)`)
                            .filter((x) => x.trim());
                          const descParts = [
                            p.vehicle?.trim() || "",
                            stays.length ? stays.join("\n") : "",
                            p.note?.trim() || "",
                          ].filter(Boolean);
                          return {
                            name: p.name,
                            description: descParts.length ? descParts.join("\n") : "",
                            quantity: 1,
                            price: typeof p.pricePkr === "number" ? p.pricePkr : 0,
                          };
                        });
                      const safe = next.length
                        ? next
                        : [{ name: "Trip package", description: "", quantity: 1, price: 0 }];
                      setItems(safe);
                      queuePatch({ items: safe });
                    }}
                  >
                    Import packages
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const next = [...items, { name: "", description: "", quantity: 1, price: 0 }];
                    setItems(next);
                    queuePatch({ items: next });
                  }}
                >
                  + Add item
                </Button>
              </div>
            </div>

            {items.length ? (
              <div className="rounded-2xl border border-border bg-panel-elevated p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Package preview
                </p>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-4">
                  <div className="min-w-0 sm:col-span-2">
                    <p className="text-xs text-muted">Item</p>
                    <p className="truncate font-semibold text-foreground">
                      {items[0]?.name?.trim() || "Trip package"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Qty</p>
                    <p className="font-semibold text-foreground tabular-nums">
                      {items[0]?.quantity ?? 1}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Price</p>
                    <p className="font-semibold text-foreground tabular-nums">
                      {money(currency, items[0]?.price ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-panel-elevated p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Item name</FieldLabel>
                      <TextInput
                        value={it.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setItems((prev) => {
                            const next = prev.map((x, i) => (i === idx ? { ...x, name: v } : x));
                            queuePatch({ items: next });
                            return next;
                          });
                        }}
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
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setItems((prev) => {
                              const next = prev.map((x, i) =>
                                i === idx ? { ...x, quantity: v } : x,
                              );
                              queuePatch({ items: next });
                              return next;
                            });
                          }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Price</FieldLabel>
                        <TextInput
                          type="number"
                          min={0}
                          value={it.price}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setItems((prev) => {
                              const next = prev.map((x, i) =>
                                i === idx ? { ...x, price: v } : x,
                              );
                              queuePatch({ items: next });
                              return next;
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <FieldLabel>Description (optional)</FieldLabel>
                    <TextAreaField
                      rows={3}
                      value={it.description ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setItems((prev) => {
                          const next = prev.map((x, i) =>
                            i === idx ? { ...x, description: v } : x,
                          );
                          queuePatch({ items: next });
                          return next;
                        });
                      }}
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
                        setItems((prev) => {
                          const next = prev.filter((_, i) => i !== idx);
                          const safe = next.length ? next : [{ name: "", description: "", quantity: 1, price: 0 }];
                          queuePatch({ items: safe });
                          return safe;
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <FieldLabel>Trip summary (shows on invoice)</FieldLabel>
              <TextAreaField
                rows={5}
                value={tripSummary}
                onChange={(e) => {
                  const v = e.target.value;
                  setTripSummary(v);
                  queuePatch({ tripSummary: v });
                }}
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
                    const v = Number(e.target.value);
                    setDiscount(v);
                    queuePatch({ discount: clamp(v, 0, 100) });
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
                    const v = Number(e.target.value);
                    setTax(v);
                    queuePatch({ tax: clamp(v, 0, 100) });
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Totals</p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {money(currency, subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Discount ({discountPct}%)</span>
                  <span className="font-semibold text-foreground">
                    {money(currency, discountAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Tax ({taxPct}%)</span>
                  <span className="font-semibold text-foreground">
                    {money(currency, taxAmount)}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Advance amount</FieldLabel>
                    <TextInput
                      type="number"
                      min={0}
                      step="0.01"
                      value={advanceAmount}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        const safe = Number.isFinite(v) ? Math.max(0, v) : 0;
                        setAdvanceAmount(safe);
                        queuePatch({ advanceAmount: safe });
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div className="rounded-xl border border-border bg-white/70 px-3 py-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">
                      Remaining balance
                    </p>
                    <p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">
                      {money(currency, remainingBalance)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
                  <span className="text-sm font-bold text-slate-900">Grand total</span>
                  <span className="text-lg font-extrabold tabular-nums text-slate-900">
                    {remainingBalance <= 0.00001 ? "Paid" : money(currency, total)}
                  </span>
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
                onChange={(e) => {
                  const v = e.target.value as PaymentMethod;
                  setPaymentMethod(v);
                  queuePatch({ paymentMethod: v });
                }}
              >
                <option value="bank">Bank transfer</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
              </SelectField>
            </div>

            <div>
              <FieldLabel required>Payment details</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const t = paymentTemplate(paymentMethod);
                    setPaymentDetails(t);
                    queuePatch({ paymentDetails: t });
                  }}
                >
                  Use template
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const t = paymentTemplate("bank");
                    setPaymentMethod("bank");
                    setPaymentDetails(t);
                    queuePatch({ paymentMethod: "bank", paymentDetails: t });
                  }}
                >
                  Bank
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const t = paymentTemplate("easypaisa");
                    setPaymentMethod("easypaisa");
                    setPaymentDetails(t);
                    queuePatch({ paymentMethod: "easypaisa", paymentDetails: t });
                  }}
                >
                  Easypaisa
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const t = paymentTemplate("jazzcash");
                    setPaymentMethod("jazzcash");
                    setPaymentDetails(t);
                    queuePatch({ paymentMethod: "jazzcash", paymentDetails: t });
                  }}
                >
                  JazzCash
                </Button>
              </div>
              <TextAreaField
                rows={6}
                value={paymentDetails}
                onChange={(e) => {
                  setPaymentDetails(e.target.value);
                  queuePatch({ paymentDetails: e.target.value });
                }}
                placeholder="Account title, IBAN, number, instructions…"
              />
            </div>
          </div>
        ) : step === 5 ? (
          <div className="space-y-4">
            <div>
              <FieldLabel>Terms & conditions</FieldLabel>
              <TextAreaField
                rows={5}
                value={terms}
                onChange={(e) => {
                  setTerms(e.target.value);
                  queuePatch({ terms: e.target.value });
                }}
              />
            </div>
            <div>
              <FieldLabel>Cancellation policy</FieldLabel>
              <TextAreaField
                rows={5}
                value={cancellationPolicy}
                onChange={(e) => {
                  setCancellationPolicy(e.target.value);
                  queuePatch({ cancellationPolicy: e.target.value });
                }}
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
              <Button
                type="button"
                variant="secondary"
                disabled={!invoiceId || docxLoading}
                onClick={() => {
                  if (!invoiceId) return;
                  if (!canMutate) return;
                  setMsg(null);
                  setDocxLoading(true);
                  void (async () => {
                    try {
                      const res = await exportDocx({ sessionToken, invoiceId });
                      window.open(res.url, "_blank", "noopener,noreferrer");
                    } catch (e) {
                      setMsg(toUserFacingErrorMessage(e));
                    } finally {
                      setDocxLoading(false);
                    }
                  })();
                }}
              >
                {docxLoading ? "Preparing…" : "Download Word"}
              </Button>
              {pdfModel ? (
                <PDFDownloadLink
                  document={<InvoicePdf model={pdfModel} />}
                  fileName={`invoice-${invoiceDate}.pdf`}
                >
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
                disabled={!invoiceId}
                onClick={() => {
                  if (!invoiceId) return;
                  void (async () => {
                    try {
                      await markPaid({ sessionToken, invoiceId });
                      setMsg("Marked as paid.");
                    } catch (e) {
                      setMsg(toUserFacingErrorMessage(e));
                    }
                  })();
                }}
              >
                Mark as paid
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
              <PDFDownloadLink
                document={<InvoicePdf model={pdfModel} />}
                fileName={`invoice-${invoiceDate}.pdf`}
              >
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

