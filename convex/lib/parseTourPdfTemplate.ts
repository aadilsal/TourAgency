/** Parsed sections from JunketTours-style tour PDFs (fixed template). */

export type ParsedTourPdfDay = {
  day: number;
  title: string;
  description: string;
};

export type ParsedTourPdfSections = {
  title: string;
  durationDays: number;
  days: ParsedTourPdfDay[];
  note?: string;
  accommodations?: string;
  included: string[];
  excluded: string[];
  paymentTerms?: string;
};

export function normalizePdfText(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function splitListItems(section: string): string[] {
  return section
    .split(/\.\s+/)
    .map((s) => s.replace(/\.\s*$/g, "").trim())
    .filter((s) => s.length > 0);
}

function splitDayTitleAndBody(rest: string): { title: string; description: string } {
  const trimmed = rest.trim();
  const routeEnd = trimmed.match(/^(.+?\(\s*[^)]*hour[^)]*\))\.\s*(.*)$/i);
  if (routeEnd) {
    return {
      title: routeEnd[1]!.trim(),
      description: routeEnd[2]!.trim(),
    };
  }
  const dot = trimmed.indexOf(". ");
  if (dot > 0 && dot < 140) {
    return {
      title: trimmed.slice(0, dot).trim(),
      description: trimmed.slice(dot + 2).trim(),
    };
  }
  const colonBreakfast = trimmed.match(/^(.+?):\s*Breakfast\b/i);
  if (colonBreakfast) {
    return {
      title: colonBreakfast[1]!.trim(),
      description: trimmed.slice(colonBreakfast[0]!.length).trim(),
    };
  }
  return {
    title: trimmed.slice(0, 80).trim(),
    description: trimmed,
  };
}

function parseDaysBlock(block: string): ParsedTourPdfDay[] {
  const chunks = block
    .split(/(?=Day\s+\d+\s*:)/i)
    .map((c) => c.trim())
    .filter(Boolean);

  const days: ParsedTourPdfDay[] = [];
  for (const chunk of chunks) {
    const m = chunk.match(/^Day\s+(\d+)\s*:\s*([\s\S]+)$/i);
    if (!m) continue;
    const dayNum = Number.parseInt(m[1]!, 10);
    if (!Number.isFinite(dayNum) || dayNum < 1) continue;
    const { title, description } = splitDayTitleAndBody(m[2]!);
    days.push({ day: dayNum, title, description });
  }
  return days.sort((a, b) => a.day - b.day);
}

export function slugifyTourTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function inferTourTypesFromText(blob: string): string[] {
  const lower = blob.toLowerCase();
  const types: string[] = [];
  const checks: Array<[string, string[]]> = [
    ["family", ["family", "kid", "child", "children"]],
    ["honeymoon", ["honeymoon", "couple", "romantic"]],
    ["adventure", ["adventure", "trek", "jeep", "4*4", "4x4", "expedition"]],
    ["corporate", ["corporate", "team", "business"]],
    ["budget", ["budget", "economy", "affordable"]],
    [
      "culture",
      [
        "culture",
        "heritage",
        "history",
        "fort",
        "archaeological",
        "mughal",
        "gandhara",
        "shrine",
        "museum",
        "stupa",
        "monument",
      ],
    ],
  ];
  for (const [type, keywords] of checks) {
    if (keywords.some((k) => lower.includes(k))) types.push(type);
  }
  return types.length > 0 ? types : ["culture"];
}

/**
 * Parse a normalized tour PDF text body into structured sections.
 * Expects: title, Day 01…N, Note, Accommodations, Service(s) included, not included, Payment.
 */
export function parseTourPdfTemplate(rawText: string): ParsedTourPdfSections {
  const full = normalizePdfText(rawText);
  if (!full) throw new Error("PDF text is empty");

  const noteIdx = full.search(/\bNote:\s*/i);
  const accIdx = full.search(/\bAccommodations\s*:\s*/i);
  const incIdx = full.search(/\bServices?\s+included\s*:\s*/i);
  const excIdx = full.search(/\bServices?\s+not\s+included\s*:\s*/i);
  const payIdx = full.search(/\bPayment\s+method\s*:\s*/i);

  const mainEnd = noteIdx >= 0 ? noteIdx : accIdx >= 0 ? accIdx : full.length;
  const main = full.slice(0, mainEnd).trim();

  const titleMatch = main.match(/^(\d+\s+days?\s+trip\s+to\s+.+?)\.\s*/i);
  if (!titleMatch) {
    throw new Error(
      'Could not find tour title. Expected format: "N days trip to …"',
    );
  }

  const title = titleMatch[1]!.trim();
  const durationMatch = title.match(/^(\d+)\s+days?/i);
  const durationFromTitle = durationMatch
    ? Number.parseInt(durationMatch[1]!, 10)
    : Number.NaN;
  const daysBlock = main.slice(titleMatch[0]!.length).trim();
  const days = parseDaysBlock(daysBlock);
  if (days.length === 0) {
    throw new Error("No day itinerary found (expected Day 01:, Day 02:, …)");
  }

  const durationDays =
    Number.isFinite(durationFromTitle) && durationFromTitle > 0
      ? durationFromTitle
      : days.length;

  let note: string | undefined;
  if (noteIdx >= 0) {
    const noteEnd =
      accIdx > noteIdx ? accIdx : incIdx > noteIdx ? incIdx : full.length;
    const noteChunk = full.slice(noteIdx, noteEnd);
    const noteBody = noteChunk.replace(/^\s*Note:\s*/i, "").trim();
    note = noteBody || undefined;
  }

  let accommodations: string | undefined;
  if (accIdx >= 0 && incIdx > accIdx) {
    const accStart = accIdx + full.slice(accIdx).search(/\bAccommodations\s*:\s*/i);
    const accLabelEnd =
      accStart + full.slice(accIdx).match(/\bAccommodations\s*:\s*/i)![0]!.length;
    accommodations = full.slice(accLabelEnd, incIdx).trim() || undefined;
  }

  let included: string[] = [];
  if (incIdx >= 0) {
    const incLabel = full.slice(incIdx).match(/\bServices?\s+included\s*:\s*/i)![0]!;
    const incStart = incIdx + incLabel.length;
    const incEnd = excIdx > incIdx ? excIdx : payIdx > incIdx ? payIdx : full.length;
    included = splitListItems(full.slice(incStart, incEnd));
  }

  let excluded: string[] = [];
  if (excIdx >= 0) {
    const excLabel = full.slice(excIdx).match(/\bServices?\s+not\s+included\s*:\s*/i)![0]!;
    const excStart = excIdx + excLabel.length;
    const excEnd = payIdx > excIdx ? payIdx : full.length;
    excluded = splitListItems(full.slice(excStart, excEnd));
  }

  let paymentTerms: string | undefined;
  if (payIdx >= 0) {
    const payLabel = full.slice(payIdx).match(/\bPayment\s+method\s*:\s*/i)![0]!;
    paymentTerms = full.slice(payIdx + payLabel.length).trim() || undefined;
  }

  return {
    title,
    durationDays,
    days,
    note,
    accommodations,
    included,
    excluded,
    paymentTerms,
  };
}
