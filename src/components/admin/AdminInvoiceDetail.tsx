"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { Modal } from "@/components/ui/Modal";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePdf, type InvoicePdfModel } from "@/documents/invoice/InvoicePdf";
import { toAbsoluteUrl } from "@/lib/absoluteUrl";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

type InvoiceDoc = {
  _id: Id<"invoices">;
  clientName: string;
  itineraryId?: Id<"itineraries">;
  invoiceDate: string;
  currency: "PKR" | "USD";
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
  paymentMethod: "bank" | "easypaisa" | "jazzcash";
  paymentDetails: string;
  terms?: string;
  cancellationPolicy?: string;
};

export function AdminInvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const [previewOpen, setPreviewOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const inv = useQuery(
    api.invoices.getForAdmin,
    canQuery ? { sessionToken, invoiceId: invoiceId as Id<"invoices"> } : "skip",
  ) as InvoiceDoc | null | undefined;

  const companyLogoUrl = useQuery(api.media.getSiteAssetUrl, { key: "logo" });
  const publicSettings = useQuery(api.siteSettings.getPublicSiteSettings, {});

  const markPaid = useMutation(api.invoices.markPaid);

  const pdfModel: InvoicePdfModel | null = useMemo(() => {
    if (!inv) return null;
    return {
      invoiceDateLabel: inv.invoiceDate,
      currency: inv.currency,
      companyLogoUrl:
        toAbsoluteUrl(companyLogoUrl) ??
        toAbsoluteUrl("/images-removebg-preview.png"),
      companyName: "JunketTours",
      companyAddress: publicSettings?.officeAddress?.trim() || undefined,
      client: { name: inv.clientName },
      items: inv.items ?? [],
      discount: inv.discount ?? 0,
      tax: inv.tax ?? 0,
      payment: { method: inv.paymentMethod, details: inv.paymentDetails },
      notes: { terms: inv.terms, cancellationPolicy: inv.cancellationPolicy },
    };
  }, [inv, companyLogoUrl, publicSettings?.officeAddress]);

  if (!canQuery) {
    return (
      <p className="text-sm text-amber-800">
        {sessionToken === undefined
          ? "Loading your session…"
          : "You need an admin session to view invoices."}
      </p>
    );
  }

  if (inv === undefined) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (!inv) {
    return <p className="text-sm text-muted">Invoice not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Invoice</h1>
          <p className="mt-1 text-sm text-brand-muted">
            {inv.clientName || "—"} · {inv.invoiceDate} · {inv.currency}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/invoices">
            <Button type="button" variant="secondary">
              Back to list
            </Button>
          </Link>
          <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
          {pdfModel ? (
            <PDFDownloadLink
              document={<InvoicePdf model={pdfModel} />}
              fileName={`invoice-${inv.invoiceDate}.pdf`}
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
            onClick={() => {
              void (async () => {
                try {
                  await markPaid({ sessionToken, invoiceId: inv._id as Id<"invoices"> });
                  setMsg("Marked as paid.");
                } catch (e) {
                  setMsg(toUserFacingErrorMessage(e));
                }
              })();
            }}
          >
            Mark paid
          </Button>
        </div>
      </div>

      {msg ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {msg}
        </div>
      ) : null}

      <Card className="p-5">
        <p className="text-sm font-semibold text-foreground">Status</p>
        <p className="mt-1 text-sm text-muted">
          {inv.status === "paid" ? "Paid" : "Draft"}
        </p>
      </Card>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Invoice preview"
        description="This is the PDF preview."
        panelClassName="max-w-5xl"
      >
        <div className="h-[75vh] overflow-hidden rounded-xl border border-border bg-white">
          {pdfModel ? (
            <PDFViewer style={{ width: "100%", height: "100%" }}>
              <InvoicePdf model={pdfModel} />
            </PDFViewer>
          ) : (
            <p className="p-4 text-sm text-muted">Preparing…</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

