import * as XLSX from "xlsx";

export type BulkUploadRow = Record<string, unknown>;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function parseFileToRows(file: File): Promise<BulkUploadRow[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".json")) {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("JSON must be an array of objects.");
    }
    const rows: BulkUploadRow[] = [];
    for (const item of parsed) {
      if (!isPlainObject(item)) {
        throw new Error("Every JSON array item must be an object.");
      }
      rows.push(item);
    }
    return rows;
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new Error("No sheets found in workbook.");
    const sheet = wb.Sheets[sheetName];
    if (!sheet) throw new Error("First sheet missing.");

    const json = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    }) as unknown;

    if (!Array.isArray(json)) {
      throw new Error("Could not read sheet rows.");
    }

    const rows: BulkUploadRow[] = [];
    for (const item of json) {
      if (!isPlainObject(item)) continue;
      // Ignore completely empty rows.
      const hasAny = Object.values(item).some(
        (v) => String(v ?? "").trim().length > 0,
      );
      if (hasAny) rows.push(item);
    }
    return rows;
  }

  throw new Error("Unsupported file type. Upload .json or .xlsx.");
}

