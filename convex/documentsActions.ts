"use node";

import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { api, internal } from "./_generated/api.js";
import type { Id } from "./_generated/dataModel.js";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
} from "docx";

function money(currency: "PKR" | "USD", n: number) {
  const sym = currency === "USD" ? "$" : "PKR";
  try {
    return `${sym} ${n.toLocaleString()}`;
  } catch {
    return `${sym} ${n}`;
  }
}

export const exportItineraryDocx = action({
  args: {
    sessionToken: v.string(),
    itineraryId: v.id("itineraries"),
  },
  handler: async (ctx, { sessionToken, itineraryId }) => {
    const ok = await ctx.runQuery(internal.auth.isAdminSession, { sessionToken });
    if (!ok) throw new Error("Unauthorized");

    const itin = await ctx.runQuery(api.itineraries.getForAdmin, {
      sessionToken,
      itineraryId,
    });
    if (!itin) throw new Error("Itinerary not found");

    const filename = `${String(itin.title || "itinerary").replace(/\s+/g, "-").toLowerCase()}.docx`;

    const meta = new Paragraph({
      children: [
        new TextRun({ text: `Client: ${itin.clientName || "—"}`, break: 1 }),
        new TextRun({ text: `Dates: ${itin.startDate} → ${itin.endDate}`, break: 1 }),
        new TextRun({ text: `Days: ${itin.days}`, break: 1 }),
      ],
    });

    const dayParas: Paragraph[] = [];
    for (const d of itin.dayPlans ?? []) {
      dayParas.push(
        new Paragraph({ text: `Day ${d.dayNumber}: ${d.title}`, heading: HeadingLevel.HEADING_2 }),
      );
      const highlights = (d.highlights ?? []).filter(Boolean).join(", ");
      const overnight = (d.overnight ?? "").trim();
      const metaLine = [highlights, overnight].filter(Boolean).join(" · ");
      if (metaLine) dayParas.push(new Paragraph({ text: metaLine }));

      const slots = [
        ["Morning", d.morning ?? []],
        ["Afternoon", d.afternoon ?? []],
        ["Evening", d.evening ?? []],
      ] as const;
      for (const [label, items] of slots) {
        if (!items.length) continue;
        dayParas.push(new Paragraph({ text: label, heading: HeadingLevel.HEADING_3 }));
        for (const a of items) {
          const title = (a.title ?? "").trim();
          const body = (a.description ?? "").trim();
          if (!title && !body) continue;
          dayParas.push(
            new Paragraph({
              children: [
                new TextRun({ text: title || "—", bold: true }),
                new TextRun({ text: body ? ` — ${body}` : "" }),
              ],
            }),
          );
        }
      }
    }

    const packages = itin.packages ?? [];
    const packageRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "Package" })] }),
          new TableCell({ children: [new Paragraph({ text: "Price" })] }),
          new TableCell({ children: [new Paragraph({ text: "Vehicle" })] }),
          new TableCell({ children: [new Paragraph({ text: "Hotels / Stays" })] }),
        ],
      }),
      ...packages.map((p) => {
        const stays = (p.stays ?? [])
          .map((s) => `${s.location}: ${s.hotel} (${s.nights}N)`)
          .join("\n");
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: p.name || "—" })] }),
            new TableCell({
              children: [
                new Paragraph({
                  text:
                    typeof p.pricePkr === "number"
                      ? money("PKR", p.pricePkr)
                      : "—",
                }),
              ],
            }),
            new TableCell({ children: [new Paragraph({ text: (p.vehicle ?? "").trim() || "—" })] }),
            new TableCell({ children: [new Paragraph({ text: stays || "—" })] }),
          ],
        });
      }),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: itin.title || "Itinerary", heading: HeadingLevel.TITLE }),
            meta,
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Itinerary", heading: HeadingLevel.HEADING_1 }),
            ...dayParas,
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Packages", heading: HeadingLevel.HEADING_1 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: packageRows,
            }),
          ],
        },
      ],
    });

    const buf = await Packer.toBuffer(doc);
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Failed to generate download URL");
    return { url, filename, storageId: storageId as Id<"_storage"> };
  },
});

export const exportInvoiceDocx = action({
  args: { sessionToken: v.string(), invoiceId: v.id("invoices") },
  handler: async (ctx, { sessionToken, invoiceId }) => {
    const ok = await ctx.runQuery(internal.auth.isAdminSession, { sessionToken });
    if (!ok) throw new Error("Unauthorized");

    const inv = await ctx.runQuery(api.invoices.getForAdmin, { sessionToken, invoiceId });
    if (!inv) throw new Error("Invoice not found");

    const filename = `invoice-${inv.invoiceDate}.docx`;

    const subtotal = (inv.items ?? []).reduce((sum, i) => sum + i.quantity * i.price, 0);
    const discountPct = Math.max(0, Math.min(100, inv.discount || 0));
    const taxPct = Math.max(0, Math.min(100, inv.tax || 0));
    const discountAmount = (subtotal * discountPct) / 100;
    const taxableBase = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxableBase * taxPct) / 100;
    const total = Math.max(0, taxableBase + taxAmount);

    const itemRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "Item" })] }),
          new TableCell({ children: [new Paragraph({ text: "Qty" })] }),
          new TableCell({ children: [new Paragraph({ text: "Price" })] }),
          new TableCell({ children: [new Paragraph({ text: "Total" })] }),
        ],
      }),
      ...(inv.items ?? []).map((it) => {
        const lineTotal = it.quantity * it.price;
        return new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ text: it.name }),
                ...(it.description?.trim()
                  ? [new Paragraph({ text: it.description.trim() })]
                  : []),
              ],
            }),
            new TableCell({ children: [new Paragraph({ text: String(it.quantity) })] }),
            new TableCell({ children: [new Paragraph({ text: money(inv.currency, it.price) })] }),
            new TableCell({ children: [new Paragraph({ text: money(inv.currency, lineTotal) })] }),
          ],
        });
      }),
    ];

    const totals = [
      `Subtotal: ${money(inv.currency, subtotal)}`,
      discountPct > 0 ? `Discount (${discountPct}%): ${money(inv.currency, discountAmount)}` : null,
      taxPct > 0 ? `Tax (${taxPct}%): ${money(inv.currency, taxAmount)}` : null,
      `Total: ${money(inv.currency, total)}`,
    ].filter(Boolean) as string[];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: "Invoice", heading: HeadingLevel.TITLE }),
            new Paragraph({ text: `Client: ${inv.clientName}` }),
            new Paragraph({ text: `Date: ${inv.invoiceDate}` }),
            inv.invoiceNumber ? new Paragraph({ text: `Invoice #: ${inv.invoiceNumber}` }) : new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: itemRows,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Totals", heading: HeadingLevel.HEADING_2 }),
            ...totals.map((t) => new Paragraph({ text: t })),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Payment", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: inv.paymentDetails?.trim() ? inv.paymentDetails.trim() : "—" }),
          ],
        },
      ],
    });

    const buf = await Packer.toBuffer(doc);
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Failed to generate download URL");
    return { url, filename, storageId: storageId as Id<"_storage"> };
  },
});

