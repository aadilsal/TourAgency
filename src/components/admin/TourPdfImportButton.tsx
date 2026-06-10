"use client";

import { useRef, useState } from "react";
import { useAction } from "convex/react";
import { FileUp } from "lucide-react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { extractPdfText } from "@/lib/tourPdf/extractPdfText";
import type { TourPdfImportDraft } from "@/lib/tourPdf/types";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

const LOG_PREFIX = "[TourPdfImport]";

type Props = {
  sessionToken: string | null | undefined;
  disabled?: boolean;
  onDraft: (draft: TourPdfImportDraft) => void;
  onError?: (message: string) => void;
};

function logImportError(stage: string, err: unknown) {
  console.error(`${LOG_PREFIX} FAILED at stage: ${stage}`);
  if (err instanceof Error) {
    console.error(`${LOG_PREFIX} name:`, err.name);
    console.error(`${LOG_PREFIX} message:`, err.message);
    console.error(`${LOG_PREFIX} stack:`, err.stack);
  } else {
    console.error(`${LOG_PREFIX} raw error:`, err);
  }
}

export function TourPdfImportButton({
  sessionToken,
  disabled,
  onDraft,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const parseTourPdf = useAction(api.tourPdfImport.parseTourPdf);
  const [busy, setBusy] = useState(false);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    console.log(`${LOG_PREFIX} file selected:`, file.name, file.size, file.type);

    if (typeof sessionToken !== "string") {
      const msg =
        sessionToken === undefined
          ? "Your session is still loading. Try again in a moment."
          : "Sign in as admin to import tours from PDF.";
      console.warn(`${LOG_PREFIX} no session token`);
      onError?.(msg);
      return;
    }

    setBusy(true);
    try {
      console.log(`${LOG_PREFIX} step 1/2: extracting PDF text in browser…`);
      const pdfText = await extractPdfText(file);
      console.log(`${LOG_PREFIX} extracted text preview:`, pdfText.slice(0, 200));

      console.log(`${LOG_PREFIX} step 2/2: calling Convex parseTourPdf…`);
      const draft = await parseTourPdf({ sessionToken, pdfText });

      console.log(`${LOG_PREFIX} success:`, {
        title: draft.title,
        slug: draft.slug,
        days: draft.itinerary?.length,
        enrichedByLlm: draft.enrichedByLlm,
        warnings: draft.warnings,
      });

      onDraft(draft);
    } catch (err) {
      logImportError("import", err);
      const friendly = toUserFacingErrorMessage(err);
      console.error(`${LOG_PREFIX} user-facing message:`, friendly);
      onError?.(friendly);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => void onPickFile(e)}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || busy || typeof sessionToken !== "string"}
        onClick={() => inputRef.current?.click()}
      >
        <FileUp className="h-4 w-4" aria-hidden />
        {busy ? "Parsing PDF…" : "Import from PDF"}
      </Button>
    </>
  );
}
