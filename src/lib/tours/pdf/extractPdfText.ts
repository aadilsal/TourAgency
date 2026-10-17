const MAX_PDF_BYTES = 8 * 1024 * 1024;

/** Served from /public/pdfjs — avoids CDN worker failures in dev/production. */
const LOCAL_WORKER_SRC = "/pdfjs/pdf.worker.min.mjs";

/**
 * Extract plain text from a tour PDF in the browser (pdf.js).
 */
export async function extractPdfText(file: File): Promise<string> {
  console.log("[extractPdfText] start:", file.name, file.size, file.type);

  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    throw new Error("Please choose a PDF file.");
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("PDF is too large (max 8MB).");
  }
  if (file.size === 0) {
    throw new Error("PDF file is empty.");
  }

  let pdfjs: typeof import("pdfjs-dist/legacy/build/pdf.mjs");
  try {
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    console.log("[extractPdfText] pdfjs loaded, version:", pdfjs.version);
  } catch (err) {
    console.error("[extractPdfText] failed to import pdfjs-dist:", err);
    throw new Error("PDF reader failed to load. Refresh and try again.");
  }

  pdfjs.GlobalWorkerOptions.workerSrc = LOCAL_WORKER_SRC;
  console.log("[extractPdfText] workerSrc:", LOCAL_WORKER_SRC);

  const data = new Uint8Array(await file.arrayBuffer());
  console.log("[extractPdfText] arrayBuffer bytes:", data.byteLength);

  try {
    const doc = await pdfjs.getDocument({ data }).promise;
    console.log("[extractPdfText] document pages:", doc.numPages);

    const parts: string[] = [];
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      try {
        const page = await doc.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => {
            if (!item || typeof item !== "object") return "";
            const str = (item as { str?: string }).str;
            return typeof str === "string" ? str : "";
          })
          .join(" ");
        parts.push(pageText);
        console.log("[extractPdfText] page", pageNum, "chars:", pageText.length);
      } catch (err) {
        console.error("[extractPdfText] page", pageNum, "failed:", err);
        throw new Error(`Failed to read PDF page ${pageNum}.`);
      }
    }

    const text = parts.join("\n").trim();
    console.log("[extractPdfText] total chars:", text.length);

    if (!text) {
      throw new Error(
        "No text found in PDF. Scanned/image-only PDFs are not supported.",
      );
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Failed to read PDF page")) {
      throw err;
    }
    if (err instanceof Error && err.message.includes("No text found")) {
      throw err;
    }
    console.error("[extractPdfText] getDocument failed:", err);
    throw new Error(
      "Could not read PDF. Ensure the worker file exists at /pdfjs/pdf.worker.min.mjs.",
    );
  }
}
