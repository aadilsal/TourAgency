import React from "react";
/* eslint-disable jsx-a11y/alt-text -- React-PDF Image doesn’t support alt */
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { PdfFooterStrip, PdfHeader, type PdfFooterContact } from "@/documents/shared/PdfChrome";

export type InvoicePdfModel = {
  invoiceNumberLabel?: string;
  invoiceDateLabel: string;
  currency: "PKR" | "USD";
  brandColor?: string;
  companyLogoUrl?: string | null;
  companyName?: string;
  companyAddress?: string;
  tripSummary?: string;
  licenceNumber?: string;
  licenceNumber2?: string;
  contact?: PdfFooterContact;
  client: {
    name: string;
    phone?: string;
    email?: string;
  };
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
  /** Amount already paid (>= 0) */
  advanceAmount?: number;
  /** If true, show “Paid” when remaining is 0 */
  isFinal?: boolean;
  payment: {
    method: "bank" | "easypaisa" | "jazzcash";
    details: string;
  };
  /** Structured bank-transfer details (from site settings), shown for the bank method. */
  bankDetails?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    instruction?: string;
  };
  notes?: {
    terms?: string;
    cancellationPolicy?: string;
  };
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingHorizontal: 40,
    paddingBottom: 42,
    fontSize: 9.5,
    color: "#0f172a",
    fontFamily: "Helvetica",
    lineHeight: 1.3,
  },
  row: { flexDirection: "row" },
  muted: { color: "#475569" },
  h1: { fontSize: 20, fontWeight: 700, letterSpacing: -0.3 },
  label: { fontSize: 8, letterSpacing: 1.1, textTransform: "uppercase" },
  companyName: { fontSize: 11, fontWeight: 700 },
  box: {
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    padding: 10,
    backgroundColor: "#ffffff",
  },
  summaryBox: {
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    padding: 10,
    backgroundColor: "#ffffff",
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 5,
    marginTop: 10,
  },
  th: { fontSize: 8, fontWeight: 700, color: "#475569", textTransform: "uppercase" },
  td: { fontSize: 9.5, color: "#0f172a" },
  cellName: { flex: 3 },
  cellQty: { flex: 0.8, textAlign: "right" },
  cellPrice: { flex: 1.2, textAlign: "right" },
  cellTotal: { flex: 1.2, textAlign: "right" },
  lineRow: {
    flexDirection: "row",
    borderBottom: "1px solid #f1f5f9",
    paddingVertical: 5,
  },
  totalsRow: { flexDirection: "row", marginTop: 10 },
  totalsBox: {
    width: 210,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  totalsLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  tripTotal: { fontSize: 10, fontWeight: 700 },
  amountDue: { fontSize: 14, fontWeight: 700 },
  totalDivider: {
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1px solid #e2e8f0",
  },
  paymentText: { fontSize: 8.5, lineHeight: 1.35 },
  payRow: { flexDirection: "row", marginTop: 3 },
  payKey: { fontSize: 8.5, color: "#475569", width: 90 },
  payVal: { fontSize: 9, color: "#0f172a", fontWeight: 700 },
  paidStamp: {
    position: "absolute",
    top: 300,
    left: 175,
    transform: "rotate(-20deg)",
    border: "4px solid #16a34a",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 26,
    opacity: 0.82,
  },
  paidStampText: {
    color: "#16a34a",
    fontSize: 46,
    fontWeight: 700,
    letterSpacing: 5,
  },
});

function money(currency: "PKR" | "USD", n: number) {
  const sym = currency === "USD" ? "$" : "PKR";
  try {
    return `${sym} ${n.toLocaleString()}`;
  } catch {
    return `${sym} ${n}`;
  }
}

export function InvoicePdf({ model }: { model: InvoicePdfModel }) {
  const brand = model.brandColor ?? "#ea580c";
  const subtotal = model.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const discountPct = Math.max(0, Math.min(100, model.discount || 0));
  const taxPct = Math.max(0, Math.min(100, model.tax || 0));
  const discountAmount = (subtotal * discountPct) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableBase * taxPct) / 100;
  const total = Math.max(0, taxableBase + taxAmount);
  // When an invoice is marked paid (isFinal), the outstanding balance becomes
  // zero and a "Paid" state is shown regardless of the recorded advance.
  const showPaid = Boolean(model.isFinal);
  const advance = showPaid ? total : Math.max(0, model.advanceAmount || 0);
  const remaining = showPaid ? 0 : Math.max(0, total - advance);

  const bankRows = (
    [
      ["Bank name", model.bankDetails?.bankName],
      ["Account title", model.bankDetails?.accountTitle],
      ["Account number", model.bankDetails?.accountNumber],
      ["IBAN", model.bankDetails?.iban],
    ] as const
  )
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => ({ label, value: value as string }));

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={false}>
        {showPaid ? (
          <View style={styles.paidStamp} fixed>
            <Text style={styles.paidStampText}>PAID</Text>
          </View>
        ) : null}
        <PdfHeader
          logoUrl={model.companyLogoUrl}
          companyName={model.companyName}
          licenceNumber={model.licenceNumber}
          licenceNumber2={model.licenceNumber2}
        />

        <View style={[styles.row, { justifyContent: "space-between", gap: 12 }]}>
          <View style={{ flex: 1 }}>
            {model.companyName?.trim() ? (
              <Text style={styles.companyName}>{model.companyName}</Text>
            ) : null}
            {model.companyAddress?.trim() ? (
              <Text style={[styles.muted, { marginTop: 3, lineHeight: 1.35, fontSize: 8.5 }]}>
                {model.companyAddress}
              </Text>
            ) : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.h1, { color: brand }]}>Invoice</Text>
            {model.invoiceNumberLabel ? (
              <Text style={[styles.muted, { marginTop: 4, fontSize: 8.5 }]}>
                {model.invoiceNumberLabel}
              </Text>
            ) : null}
            <Text style={[styles.muted, { marginTop: 2, fontSize: 8.5 }]}>
              {model.invoiceDateLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.row, { gap: 10, marginTop: 12 }]}>
          <View style={[styles.box, { flex: 1 }]}>
            <Text style={[styles.label, styles.muted]}>Client</Text>
            <Text style={{ marginTop: 5, fontSize: 10.5, fontWeight: 700 }}>
              {model.client.name}
            </Text>
            {model.client.phone?.trim() ? (
              <Text style={[styles.muted, { marginTop: 2, fontSize: 8.5 }]}>
                {`Phone: ${model.client.phone}`}
              </Text>
            ) : null}
            {model.client.email?.trim() ? (
              <Text style={[styles.muted, { fontSize: 8.5 }]}>{`Email: ${model.client.email}`}</Text>
            ) : null}
          </View>
          <View style={[styles.box, { width: 100 }]}>
            <Text style={[styles.label, styles.muted]}>Currency</Text>
            <Text style={{ marginTop: 5, fontSize: 10.5, fontWeight: 700 }}>{model.currency}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.cellName]}>Item</Text>
          <Text style={[styles.th, styles.cellQty]}>Qty</Text>
          <Text style={[styles.th, styles.cellPrice]}>Price</Text>
          <Text style={[styles.th, styles.cellTotal]}>Total</Text>
        </View>

        {model.items.map((i, idx) => {
          const lineTotal = i.quantity * i.price;
          return (
            <View key={`${i.name}-${idx}`} style={styles.lineRow}>
              <View style={styles.cellName}>
                <Text style={[styles.td, { fontWeight: 700 }]}>{i.name}</Text>
                {i.description?.trim() ? (
                  <Text style={[styles.muted, { marginTop: 1, fontSize: 8 }]}>{i.description}</Text>
                ) : null}
              </View>
              <Text style={[styles.td, styles.cellQty]}>{i.quantity}</Text>
              <Text style={[styles.td, styles.cellPrice]}>{money(model.currency, i.price)}</Text>
              <Text style={[styles.td, styles.cellTotal]}>{money(model.currency, lineTotal)}</Text>
            </View>
          );
        })}

        <View style={styles.totalsRow}>
          <View style={[styles.summaryBox, { marginRight: 10 }]}>
            <Text style={[styles.label, styles.muted]}>Trip summary</Text>
            <Text style={[styles.muted, { marginTop: 5, lineHeight: 1.4, fontSize: 8.5 }]}>
              {model.tripSummary?.trim() ? model.tripSummary.trim() : "—"}
            </Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsLine}>
              <Text style={styles.muted}>Subtotal</Text>
              <Text>{money(model.currency, subtotal)}</Text>
            </View>
            {discountPct > 0 ? (
              <View style={styles.totalsLine}>
                <Text style={styles.muted}>{`Discount (${discountPct}%)`}</Text>
                <Text>{money(model.currency, discountAmount)}</Text>
              </View>
            ) : null}
            {taxPct > 0 ? (
              <View style={styles.totalsLine}>
                <Text style={styles.muted}>{`Tax (${taxPct}%)`}</Text>
                <Text>{money(model.currency, taxAmount)}</Text>
              </View>
            ) : null}
            <View style={[styles.totalsLine, styles.totalDivider]}>
              <Text style={styles.tripTotal}>Trip total</Text>
              <Text style={styles.tripTotal}>{money(model.currency, total)}</Text>
            </View>
            {advance > 0 ? (
              <View style={styles.totalsLine}>
                <Text style={styles.muted}>Already paid</Text>
                <Text>{money(model.currency, Math.min(advance, total))}</Text>
              </View>
            ) : null}
            <View style={[styles.totalsLine, { marginTop: 4 }]}>
              <Text style={[styles.amountDue, { color: brand }]}>Amount due</Text>
              <Text style={[styles.amountDue, { color: brand }]}>
                {showPaid ? "Paid" : money(model.currency, remaining)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.box, { marginTop: 12 }]}>
          <Text style={[styles.label, styles.muted]}>Payment</Text>
          <Text style={{ marginTop: 5, fontSize: 10, fontWeight: 700 }}>
            {model.payment.method === "bank"
              ? "Bank transfer"
              : model.payment.method === "easypaisa"
                ? "Easypaisa"
                : "JazzCash"}
          </Text>
          {model.payment.method === "bank" ? (
            <View style={{ marginTop: 4 }}>
              {bankRows.map((r) => (
                <View key={r.label} style={styles.payRow}>
                  <Text style={styles.payKey}>{r.label}</Text>
                  <Text style={styles.payVal}>{r.value}</Text>
                </View>
              ))}
              {model.bankDetails?.instruction?.trim() ? (
                <Text style={[styles.muted, styles.paymentText, { marginTop: 6 }]}>
                  {model.bankDetails.instruction.trim()}
                </Text>
              ) : null}
              {model.payment.details?.trim() ? (
                <Text style={[styles.muted, styles.paymentText, { marginTop: 6 }]}>
                  {model.payment.details}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={[styles.muted, styles.paymentText, { marginTop: 4 }]}>
              {model.payment.details?.trim() ? model.payment.details : "—"}
            </Text>
          )}
        </View>

        <PdfFooterStrip
          contact={{
            ...(model.contact ?? {}),
            officeAddress: model.contact?.officeAddress ?? model.companyAddress,
          }}
        />
      </Page>
    </Document>
  );
}
