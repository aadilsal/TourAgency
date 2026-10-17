"use client";

import dynamic from "next/dynamic";

/**
 * Browser-only loaders for the screens that use @react-pdf/renderer.
 *
 * On the server, Next loads that ESM-only package as an external via
 * `import()`, which makes every module importing it async during SSR — the
 * editor component is still `undefined` when React renders it ("Element type
 * is invalid… got: undefined"), so React aborts SSR and logs #419. These are
 * admin-only, interactive (live PDF preview) and never indexed, so rendering
 * them only in the browser costs nothing.
 */

function EditorLoading() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border bg-panel-elevated text-sm text-muted">
      Loading editor…
    </div>
  );
}

export const AdminItinerarySimpleBuilder = dynamic(
  () => import("./AdminItinerarySimpleBuilder").then((m) => m.AdminItinerarySimpleBuilder),
  { ssr: false, loading: EditorLoading },
);

export const AdminItineraryEditorGate = dynamic(
  () => import("./AdminItineraryEditorGate").then((m) => m.AdminItineraryEditorGate),
  { ssr: false, loading: EditorLoading },
);

export const AdminInvoiceWizard = dynamic(
  () => import("./AdminInvoiceWizard").then((m) => m.AdminInvoiceWizard),
  { ssr: false, loading: EditorLoading },
);

export const AdminItineraryPdfDownload = dynamic(
  () => import("./AdminItineraryPdfDownload").then((m) => m.AdminItineraryPdfDownload),
  { ssr: false, loading: EditorLoading },
);
