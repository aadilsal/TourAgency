import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";

function textParagraph(text: string, options: { bold?: boolean; spacingAfter?: number } = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: options.bold })],
    spacing: { after: options.spacingAfter ?? 120 },
  });
}

function labelValue(label: string, value?: string | null) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value?.trim() || "—" }),
    ],
    spacing: { after: 80 },
  });
}

function bulletLine(text: string) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 40 },
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 180, after: 100 },
  });
}

function dayTitle(dayNumber: number, title: string) {
  const trimmed = title.trim();
  return trimmed ? `Day ${dayNumber} - ${trimmed}` : `Day ${dayNumber}`;
}

function simpleDayLine(dayNumber: number, title: string, detail: string, overnight?: string) {
  const parts = [dayTitle(dayNumber, title)];
  if (detail.trim()) parts.push(detail.trim());
  if (overnight?.trim()) parts.push(`Overnight: ${overnight.trim()}`);
  return textParagraph(parts.join(" | "));
}

function packageChain(stays: Array<{ location: string; hotel: string; nights: number }>) {
  return stays
    .filter((s) => s.hotel?.trim())
    .map((s) => `${s.location?.trim() || "Stop"}: ${s.hotel.trim()} (${Math.max(1, s.nights)}N)`)
    .join(" | ");
}

function smallTable(rows: Array<[string, string]>) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
    },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [textParagraph(label, { bold: true })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [textParagraph(value || "—")],
            }),
          ],
        }),
    ),
  });
}

export async function buildItineraryWordBlob(model: ItineraryPdfModel) {
  const children: Array<Paragraph | Table> = [
    textParagraph(model.companyName || "JunketTours", { bold: true, spacingAfter: 60 }),
    new Paragraph({
      text: model.headline?.trim() || "Your Dream Trip Awaits —",
      heading: HeadingLevel.TITLE,
      spacing: { after: 80 },
    }),
    textParagraph(model.variantLabel?.trim() || "", { spacingAfter: 40 }),
    textParagraph(model.tripTitle, { bold: true, spacingAfter: 40 }),
    labelValue("Client", model.clientName),
    labelValue("Dates", model.dateRangeLabel),
    labelValue("Days", model.daysLabel),
    labelValue("Nights", model.nightsLabel),
    labelValue("Pickup & drop-off", model.pickupDropoff),
    labelValue("Compliance", model.complianceLine),
    labelValue("Licence", model.licenceNumber ? `#${model.licenceNumber}` : undefined),
  ];

  if (model.coverSubtitle?.trim()) children.push(textParagraph(model.coverSubtitle.trim()));

  if (model.layoutVariant === "simple") {
    children.push(sectionHeading("Itinerary at a Glance"));
    if ((model.atGlanceDays ?? []).length === 0) {
      children.push(textParagraph("—"));
    } else {
      for (const day of model.atGlanceDays ?? []) {
        children.push(simpleDayLine(day.dayNumber, day.title, day.detail, day.overnight));
      }
    }
  } else {
    children.push(sectionHeading("Itinerary"));
    for (const day of model.dayPlans ?? []) {
      children.push(textParagraph(dayTitle(day.dayNumber, day.title), { bold: true }));
      const highlights = day.highlights ?? [];
      if (highlights.length) {
        for (const item of highlights) children.push(bulletLine(item));
      }
      const slots = [
        ["Morning", day.morning ?? []],
        ["Afternoon", day.afternoon ?? []],
        ["Evening", day.evening ?? []],
      ] as const;
      for (const [label, items] of slots) {
        if (items.length === 0) continue;
        children.push(textParagraph(label, { bold: true }));
        for (const item of items) {
          const content = [item.title?.trim(), item.description?.trim()].filter(Boolean).join(" - ");
          if (content) children.push(bulletLine(content));
        }
      }
      if (day.overnight?.trim()) children.push(textParagraph(`Overnight: ${day.overnight.trim()}`));
    }
  }

  if ((model.packages ?? []).length) {
    children.push(sectionHeading("Packages"));
    for (const pkg of model.packages ?? []) {
      children.push(textParagraph(pkg.name, { bold: true }));
      children.push(textParagraph(pkg.priceLabel));
      if (pkg.vehicle?.trim()) children.push(textParagraph(`Vehicle: ${pkg.vehicle.trim()}`));
      if (pkg.note?.trim()) children.push(textParagraph(pkg.note.trim()));
      if (pkg.stays?.length) {
        children.push(textParagraph(packageChain(pkg.stays)));
      }
    }
  }

  if ((model.included ?? []).length || (model.notIncluded ?? []).length) {
    children.push(sectionHeading("Included / Not included"));
    if ((model.included ?? []).length) {
      children.push(textParagraph("Included", { bold: true }));
      for (const item of model.included ?? []) children.push(bulletLine(item));
    }
    if ((model.notIncluded ?? []).length) {
      children.push(textParagraph("Not included", { bold: true }));
      for (const item of model.notIncluded ?? []) children.push(bulletLine(item));
    }
  }

  if ((model.paymentTerms ?? []).length) {
    children.push(sectionHeading("Payment Terms"));
    for (const term of model.paymentTerms ?? []) {
      const desc = term.description?.trim() ? ` - ${term.description.trim()}` : "";
      children.push(textParagraph(`${term.percent}% - ${term.title}${desc}`));
    }
  }

  if (model.bankDetails) {
    children.push(sectionHeading("Bank Details"));
    const bankRowsSource: Array<[string, string]> = [
      ["Bank", model.bankDetails.bankName ?? ""],
      ["Account title", model.bankDetails.accountTitle ?? ""],
      ["Account number", model.bankDetails.accountNumber ?? ""],
      ["IBAN", model.bankDetails.iban ?? ""],
      ["Instruction", model.bankDetails.instruction ?? ""],
    ];
    const bankRows = bankRowsSource.reduce<Array<[string, string]>>((rows, row) => {
      if (row[1].trim()) rows.push(row);
      return rows;
    }, []);
    if (bankRows.length) children.push(smallTable(bankRows));
  }

  if ((model.termsBlocks ?? []).length) {
    children.push(sectionHeading("Terms & Conditions"));
    for (const block of model.termsBlocks ?? []) {
      children.push(textParagraph(block.title, { bold: true }));
      children.push(textParagraph(block.body));
    }
  }

  if (model.contact) {
    children.push(sectionHeading("Contact"));
    if (model.contact.phone?.trim()) children.push(labelValue("Phone", model.contact.phone));
    if (model.contact.email?.trim()) children.push(labelValue("Email", model.contact.email));
    if (model.contact.website?.trim()) children.push(labelValue("Website", model.contact.website));
    if (model.contact.officeAddress?.trim()) {
      children.push(labelValue("Office", model.contact.officeAddress));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}