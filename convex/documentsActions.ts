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
  AlignmentType,
  BorderStyle,
  ShadingType,
} from "docx";

const BRAND = "EA580C";
const INK = "0F172A";
const MUTED = "475569";
const PANEL = "F8FAFC";

const NO_SIDE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
const NO_BORDER = {
  top: NO_SIDE,
  bottom: NO_SIDE,
  left: NO_SIDE,
  right: NO_SIDE,
  insideHorizontal: NO_SIDE,
  insideVertical: NO_SIDE,
};

function txt(
  text: string,
  opts: { bold?: boolean; color?: string; size?: number; caps?: boolean } = {},
) {
  return new TextRun({
    text: opts.caps ? text.toUpperCase() : text,
    bold: opts.bold,
    color: opts.color ?? INK,
    size: opts.size ?? 20, // half-points → 10pt
  });
}

function para(
  runs: TextRun[],
  opts: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacingAfter?: number } = {},
) {
  return new Paragraph({
    children: runs,
    alignment: opts.align,
    spacing: { after: opts.spacingAfter ?? 40 },
  });
}

function money(currency: "PKR" | "USD", n: number) {
  const sym = currency === "USD" ? "$" : "PKR";
  try {
    return `${sym} ${n.toLocaleString()}`;
  } catch {
    return `${sym} ${n}`;
  }
}

type ItineraryPackage = {
  name?: string | null;
  pricePkr?: number | null;
  vehicle?: string | null;
  stays?: Array<{
    location: string;
    hotel: string;
    nights: number;
  }> | null;
};

export const exportItineraryDocx: ReturnType<typeof action> = action({
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

    const packages = (itin.packages ?? []) as ItineraryPackage[];
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
    const blob = new Blob([new Uint8Array(buf)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Failed to generate download URL");
    return { url, filename, storageId: storageId as Id<"_storage"> };
  },
});

export const exportInvoiceDocx: ReturnType<typeof action> = action({
  args: { sessionToken: v.string(), invoiceId: v.id("invoices") },
  handler: async (ctx, { sessionToken, invoiceId }) => {
    const ok = await ctx.runQuery(internal.auth.isAdminSession, { sessionToken });
    if (!ok) throw new Error("Unauthorized");

    const inv = await ctx.runQuery(api.invoices.getForAdmin, { sessionToken, invoiceId });
    if (!inv) throw new Error("Invoice not found");

    const settings = await ctx.runQuery(api.siteSettings.getAdminSiteSettings, {
      sessionToken,
    });
    const bank = settings?.bankDetails ?? {};

    const filename = `invoice-${inv.invoiceDate}.docx`;

    const subtotal = (inv.items ?? []).reduce((sum, i) => sum + i.quantity * i.price, 0);
    const discountPct = Math.max(0, Math.min(100, inv.discount || 0));
    const taxPct = Math.max(0, Math.min(100, inv.tax || 0));
    const discountAmount = (subtotal * discountPct) / 100;
    const taxableBase = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxableBase * taxPct) / 100;
    const total = Math.max(0, taxableBase + taxAmount);
    const isPaid = inv.status === "paid";
    const advance = isPaid ? total : Math.max(0, inv.advanceAmount || 0);
    const remaining = isPaid ? 0 : Math.max(0, total - advance);

    const companyName = "JunketTours";
    const methodLabel =
      inv.paymentMethod === "bank"
        ? "Bank transfer"
        : inv.paymentMethod === "easypaisa"
          ? "Easypaisa"
          : "JazzCash";

    // Header: company (left) + INVOICE / number / date (right) — mirrors the PDF.
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDER,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: NO_BORDER,
              width: { size: 55, type: WidthType.PERCENTAGE },
              children: [
                para([txt(companyName, { bold: true, size: 24 })]),
                ...(settings?.officeAddress?.trim()
                  ? [para([txt(settings.officeAddress.trim(), { color: MUTED, size: 17 })])]
                  : []),
              ],
            }),
            new TableCell({
              borders: NO_BORDER,
              width: { size: 45, type: WidthType.PERCENTAGE },
              children: [
                para([txt("INVOICE", { bold: true, color: BRAND, size: 36 })], {
                  align: AlignmentType.RIGHT,
                }),
                ...(inv.invoiceNumber
                  ? [para([txt(inv.invoiceNumber, { color: MUTED, size: 17 })], { align: AlignmentType.RIGHT })]
                  : []),
                para([txt(inv.invoiceDate, { color: MUTED, size: 17 })], {
                  align: AlignmentType.RIGHT,
                }),
                ...(isPaid
                  ? [para([txt("PAID", { bold: true, color: "16A34A", size: 28 })], { align: AlignmentType.RIGHT })]
                  : []),
              ],
            }),
          ],
        }),
      ],
    });

    function labelCell(label: string, value: string, width: number) {
      return new TableCell({
        width: { size: width, type: WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        shading: { fill: "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
        children: [
          para([txt(label, { caps: true, color: MUTED, size: 15 })]),
          para([txt(value, { bold: true, size: 21 })]),
        ],
      });
    }

    const clientTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            labelCell("Bill to", inv.clientName, 70),
            labelCell("Currency", inv.currency, 30),
          ],
        }),
      ],
    });

    function cellPara(runs: TextRun[], align?: (typeof AlignmentType)[keyof typeof AlignmentType]) {
      return new Paragraph({ children: runs, alignment: align });
    }

    const headerCell = (label: string, align?: (typeof AlignmentType)[keyof typeof AlignmentType]) =>
      new TableCell({
        shading: { fill: BRAND, type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [cellPara([txt(label, { bold: true, color: "FFFFFF", size: 16, caps: true })], align)],
      });

    const itemsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell("Item"),
            headerCell("Qty", AlignmentType.RIGHT),
            headerCell("Price", AlignmentType.RIGHT),
            headerCell("Total", AlignmentType.RIGHT),
          ],
        }),
        ...(inv.items ?? []).map((it, idx) => {
          const lineTotal = it.quantity * it.price;
          const shade = idx % 2 === 1 ? PANEL : "FFFFFF";
          const cell = (children: Paragraph[]) =>
            new TableCell({
              shading: { fill: shade, type: ShadingType.CLEAR, color: "auto" },
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children,
            });
          return new TableRow({
            children: [
              cell([
                cellPara([txt(it.name, { bold: true })]),
                ...(it.description?.trim()
                  ? [cellPara([txt(it.description.trim(), { color: MUTED, size: 16 })])]
                  : []),
              ]),
              cell([cellPara([txt(String(it.quantity))], AlignmentType.RIGHT)]),
              cell([cellPara([txt(money(inv.currency, it.price))], AlignmentType.RIGHT)]),
              cell([cellPara([txt(money(inv.currency, lineTotal), { bold: true })], AlignmentType.RIGHT)]),
            ],
          });
        }),
      ],
    });

    const totalsLine = (label: string, value: string, opts: { bold?: boolean; brand?: boolean; size?: number } = {}) =>
      new TableRow({
        children: [
          new TableCell({
            borders: NO_BORDER,
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [cellPara([txt(label, { color: opts.brand ? BRAND : MUTED, bold: opts.bold, size: opts.size })])],
          }),
          new TableCell({
            borders: NO_BORDER,
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [cellPara([txt(value, { bold: opts.bold, color: opts.brand ? BRAND : INK, size: opts.size })], AlignmentType.RIGHT)],
          }),
        ],
      });

    const totalsTable = new Table({
      width: { size: 55, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.RIGHT,
      borders: NO_BORDER,
      rows: [
        totalsLine("Subtotal", money(inv.currency, subtotal)),
        ...(discountPct > 0 ? [totalsLine(`Discount (${discountPct}%)`, money(inv.currency, discountAmount))] : []),
        ...(taxPct > 0 ? [totalsLine(`Tax (${taxPct}%)`, money(inv.currency, taxAmount))] : []),
        totalsLine("Trip total", money(inv.currency, total), { bold: true }),
        ...(advance > 0 ? [totalsLine("Already paid", money(inv.currency, Math.min(advance, total)))] : []),
        totalsLine("Amount due", isPaid ? "PAID" : money(inv.currency, remaining), { bold: true, brand: true, size: 26 }),
      ],
    });

    const bankRows = [
      ["Bank name", bank.bankName],
      ["Account title", bank.accountTitle],
      ["Account number", bank.accountNumber],
      ["IBAN", bank.iban],
    ].filter(([, value]) => Boolean(value && String(value).trim())) as Array<[string, string]>;
    const paymentLines: string[] =
      inv.paymentMethod === "bank"
        ? [
            ...bankRows.map(([label, value]) => `${label}: ${value}`),
            ...(bank.instruction?.trim() ? [bank.instruction.trim()] : []),
            ...(inv.paymentDetails?.trim() ? [inv.paymentDetails.trim()] : []),
          ]
        : [inv.paymentDetails?.trim() ? inv.paymentDetails.trim() : "—"];

    const doc = new Document({
      sections: [
        {
          children: [
            headerTable,
            para([txt("")]),
            clientTable,
            para([txt("")]),
            itemsTable,
            para([txt("")]),
            totalsTable,
            para([txt("")]),
            para([txt("Payment", { caps: true, color: MUTED, size: 15 })]),
            para([txt(methodLabel, { bold: true, size: 21 })]),
            ...paymentLines.map((t) => para([txt(t, { color: MUTED, size: 18 })])),
            ...(inv.tripSummary?.trim()
              ? [
                  para([txt("")]),
                  para([txt("Trip summary", { caps: true, color: MUTED, size: 15 })]),
                  para([txt(inv.tripSummary.trim(), { color: MUTED, size: 18 })]),
                ]
              : []),
            ...(inv.terms?.trim()
              ? [
                  para([txt("")]),
                  para([txt("Terms & conditions", { caps: true, color: MUTED, size: 15 })]),
                  para([txt(inv.terms.trim(), { color: MUTED, size: 18 })]),
                ]
              : []),
            ...(inv.cancellationPolicy?.trim()
              ? [
                  para([txt("Cancellation policy", { caps: true, color: MUTED, size: 15 })]),
                  para([txt(inv.cancellationPolicy.trim(), { color: MUTED, size: 18 })]),
                ]
              : []),
          ],
        },
      ],
    });

    const buf = await Packer.toBuffer(doc);
    const blob = new Blob([new Uint8Array(buf)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Failed to generate download URL");
    return { url, filename, storageId: storageId as Id<"_storage"> };
  },
});

