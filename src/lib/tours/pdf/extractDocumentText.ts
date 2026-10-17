import { extractPdfText } from "./extractPdfText";

const MAX_BYTES = 8 * 1024 * 1024;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Extract plain text from a tour document in the browser.
 * Supports PDF (pdf.js), Word .docx (mammoth), and plain .txt.
 * Legacy .doc (binary) is intentionally unsupported.
 */
export async function extractDocumentText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (file.size > MAX_BYTES) {
    throw new Error("File is too large (max 8MB).");
  }
  if (file.size === 0) {
    throw new Error("File is empty.");
  }

  // PDF
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return extractPdfText(file);
  }

  // Plain text
  if (name.endsWith(".txt") || file.type === "text/plain") {
    const text = (await file.text()).trim();
    if (!text) throw new Error("No text found in the file.");
    return text;
  }

  // Word .docx
  if (name.endsWith(".docx") || file.type === DOCX_MIME) {
    let mammoth: typeof import("mammoth/mammoth.browser.js");
    try {
      mammoth = await import("mammoth/mammoth.browser.js");
    } catch {
      throw new Error("Word reader failed to load. Refresh and try again.");
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = (result?.value ?? "").trim();
    if (!text) {
      throw new Error("No text found in the Word document.");
    }
    return text;
  }

  // Legacy binary .doc
  if (name.endsWith(".doc")) {
    throw new Error(
      "Legacy .doc files aren't supported. Please save as .docx or PDF and try again.",
    );
  }

  throw new Error(
    "Unsupported file. Please choose a PDF, Word (.docx), or text (.txt) file.",
  );
}
