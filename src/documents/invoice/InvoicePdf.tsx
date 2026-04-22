import React from "react";
/* eslint-disable jsx-a11y/alt-text -- React-PDF Image doesn’t support alt */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

export type InvoicePdfModel = {
  invoiceNumberLabel?: string;
  invoiceDateLabel: string;
  currency: "PKR" | "USD";
  brandColor?: string;
  companyLogoUrl?: string | null;
  companyName?: string;
  companyAddress?: string;
  tripSummary?: string;
  footer?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
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
  notes?: {
    terms?: string;
    cancellationPolicy?: string;
  };
};

const styles = StyleSheet.create({
  page: {
    padding: 44,
    paddingBottom: 78,
    fontSize: 11,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  row: { flexDirection: "row" },
  muted: { color: "#475569" },
  h1: { fontSize: 22, fontWeight: 700, letterSpacing: -0.3 },
  label: { fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase" },
  companyName: { fontSize: 12, fontWeight: 700 },
  box: {
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    padding: 14,
    backgroundColor: "#ffffff",
  },
  summaryBox: {
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    padding: 14,
    backgroundColor: "#ffffff",
    minHeight: 148,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 8,
    marginTop: 14,
  },
  th: { fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase" },
  td: { fontSize: 11, color: "#0f172a" },
  cellName: { flex: 3 },
  cellQty: { flex: 1, textAlign: "right" },
  cellPrice: { flex: 1.4, textAlign: "right" },
  cellTotal: { flex: 1.4, textAlign: "right" },
  lineRow: {
    flexDirection: "row",
    borderBottom: "1px solid #f1f5f9",
    paddingVertical: 10,
  },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totalsBox: {
    width: 240,
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    padding: 14,
    backgroundColor: "#f8fafc",
  },
  totalsLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  grand: { fontSize: 16, fontWeight: 700 },
  footerStrip: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 22,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: { fontSize: 9, color: "#ffffff" },
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
  const advance = Math.max(0, model.advanceAmount || 0);
  const remaining = Math.max(0, total - advance);
  const showPaid = Boolean(model.isFinal) && remaining <= 0.00001;

  const footerStrip = (() => {
    const phone = model.footer?.phone?.trim() || "";
    const email = model.footer?.email?.trim() || "";
    const website = model.footer?.website?.trim() || "";
    const address = model.footer?.address?.trim() || model.companyAddress?.trim() || "";
    return [phone, email, website, address].filter(Boolean).join(" | ") || " ";
  })();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.row, { justifyContent: "space-between", gap: 16 }]}>
          <View style={{ flex: 1 }}>
            {model.companyLogoUrl ? (
              <Image
                src={model.companyLogoUrl}
                style={{ width: 90, height: 44, objectFit: "contain" }}
              />
            ) : null}
            {model.companyName?.trim() ? (
              <Text style={[styles.companyName, { marginTop: model.companyLogoUrl ? 8 : 0 }]}>
                {model.companyName}
              </Text>
            ) : null}
            {model.companyAddress?.trim() ? (
              <Text style={[styles.muted, { marginTop: 4, lineHeight: 1.4 }]}>
                {model.companyAddress}
              </Text>
            ) : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.h1, { color: brand }]}>Invoice</Text>
            <Text style={[styles.muted, { marginTop: 4 }]}>
              {model.invoiceNumberLabel ? `${model.invoiceNumberLabel} · ` : ""}
              {model.invoiceDateLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.row, { gap: 12, marginTop: 18 }]}>
          <View style={[styles.box, { flex: 1 }]}>
            <Text style={[styles.label, styles.muted]}>Client</Text>
            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: 700 }}>
              {model.client.name}
            </Text>
            <Text style={[styles.muted, { marginTop: 4 }]}>
              {(model.client.phone && `Phone: ${model.client.phone}`) || ""}
            </Text>
            <Text style={styles.muted}>
              {(model.client.email && `Email: ${model.client.email}`) || ""}
            </Text>
          </View>
          <View style={[styles.box, { width: 220 }]}>
            <Text style={[styles.label, styles.muted]}>Currency</Text>
            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: 700 }}>
              {model.currency}
            </Text>
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
                {i.description ? (
                  <Text style={[styles.muted, { marginTop: 2 }]}>{i.description}</Text>
                ) : null}
              </View>
              <Text style={[styles.td, styles.cellQty]}>{i.quantity}</Text>
              <Text style={[styles.td, styles.cellPrice]}>
                {money(model.currency, i.price)}
              </Text>
              <Text style={[styles.td, styles.cellTotal]}>
                {money(model.currency, lineTotal)}
              </Text>
            </View>
          );
        })}

        <View style={styles.totalsRow}>
          <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
            <View style={[styles.summaryBox, { flex: 1 }]}>
              <Text style={[styles.label, styles.muted]}>Trip summary</Text>
              <Text style={[styles.muted, { marginTop: 8, lineHeight: 1.6 }]}>
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
              {advance > 0 ? (
                <View style={styles.totalsLine}>
                  <Text style={styles.muted}>Advance amount</Text>
                  <Text>{money(model.currency, Math.min(advance, total))}</Text>
                </View>
              ) : null}
              <View style={styles.totalsLine}>
                <Text style={styles.muted}>Remaining balance</Text>
                <Text>{money(model.currency, remaining)}</Text>
              </View>
              <View style={[styles.totalsLine, { marginTop: 10 }]}>
                <Text style={[styles.grand, { color: brand }]}>Total</Text>
                <Text style={styles.grand}>
                  {showPaid ? "Paid" : money(model.currency, total)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.row, { gap: 12, marginTop: 18 }]}>
          <View style={[styles.box, { flex: 1 }]}>
            <Text style={[styles.label, styles.muted]}>Payment</Text>
            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: 700 }}>
              {model.payment.method === "bank"
                ? "Bank transfer"
                : model.payment.method === "easypaisa"
                  ? "Easypaisa"
                  : "JazzCash"}
            </Text>
            <Text style={[styles.muted, { marginTop: 6, lineHeight: 1.5 }]}>
              {model.payment.details?.trim() ? model.payment.details : "—"}
            </Text>
          </View>
          <View style={[styles.box, { flex: 1 }]}>
            <Text style={[styles.label, styles.muted]}>Notes</Text>
            <Text style={[styles.muted, { marginTop: 8, lineHeight: 1.5 }]}>
              {model.notes?.terms?.trim() ? `Terms: ${model.notes.terms}` : "Terms: —"}
            </Text>
            <Text style={[styles.muted, { marginTop: 6, lineHeight: 1.5 }]}>
              {model.notes?.cancellationPolicy?.trim()
                ? `Cancellation: ${model.notes.cancellationPolicy}`
                : "Cancellation: —"}
            </Text>
          </View>
        </View>

        <View style={styles.footerStrip} fixed>
          <Text style={styles.footerText} wrap={false}>
            {footerStrip}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

