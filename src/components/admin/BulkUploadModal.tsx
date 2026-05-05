"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import type { BulkUploadRow } from "@/lib/bulkUpload/parseFileToRows";
import { parseFileToRows } from "@/lib/bulkUpload/parseFileToRows";

export type BulkUploadResult = {
  processed: number;
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: Array<{ index: number; message: string }>;
};

export function BulkUploadModal<T>({
  open,
  onClose,
  title,
  description,
  accept = ".json,.xlsx,.xls",
  templateHint,
  transformRow,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  accept?: string;
  templateHint?: React.ReactNode;
  transformRow: (row: BulkUploadRow, index: number) => T;
  onImport: (rows: T[]) => Promise<BulkUploadResult>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<BulkUploadRow[] | null>(null);
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);

  const transformed = useMemo(() => {
    if (!rawRows) return null;
    try {
      const out = rawRows.map((r, i) => transformRow(r, i));
      return { rows: out, err: null as string | null };
    } catch (e) {
      return { rows: null as T[] | null, err: toUserFacingErrorMessage(e) };
    }
  }, [rawRows, transformRow]);

  async function onPickFile(f: File | null) {
    setFile(f);
    setRawRows(null);
    setParseErr(null);
    setImportErr(null);
    setResult(null);
    if (!f) return;
    try {
      const rows = await parseFileToRows(f);
      if (rows.length === 0) throw new Error("No rows found in file.");
      setRawRows(rows);
    } catch (e) {
      setParseErr(toUserFacingErrorMessage(e));
    }
  }

  async function onDoImport() {
    if (!transformed?.rows) return;
    setBusy(true);
    setImportErr(null);
    setResult(null);
    try {
      const r = await onImport(transformed.rows);
      setResult(r);
    } catch (e) {
      setImportErr(toUserFacingErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const preview = rawRows?.slice(0, 5) ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      panelClassName="max-w-3xl"
      fullscreenOnMobile
    >
      <div className="space-y-4">
        {templateHint ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {templateHint}
          </div>
        ) : null}

        <label className="block text-xs font-semibold text-slate-600">
          Upload file (.json or .xlsx)
          <input
            type="file"
            accept={accept}
            className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            disabled={busy}
          />
        </label>
        {file ? <p className="text-xs text-slate-500">Selected: {file.name}</p> : null}

        {parseErr ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{parseErr}</p>
        ) : null}

        {rawRows ? (
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">
                Parsed rows: {rawRows.length}
              </p>
              <Button
                type="button"
                variant="primary"
                disabled={busy || !transformed?.rows}
                onClick={() => void onDoImport()}
              >
                {busy ? "Importing…" : "Import now"}
              </Button>
            </div>

            {transformed?.err ? (
              <p className="m-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {transformed.err}
              </p>
            ) : null}

            {preview.length > 0 ? (
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Preview (first {preview.length})
                </p>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}

        {importErr ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{importErr}</p>
        ) : null}

        {result ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Imported {result.processed}
            {typeof result.created === "number" ? ` • created ${result.created}` : ""}
            {typeof result.updated === "number" ? ` • updated ${result.updated}` : ""}
            {typeof result.skipped === "number" ? ` • skipped ${result.skipped}` : ""}
            {result.errors?.length ? ` • errors ${result.errors.length}` : ""}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

