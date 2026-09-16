"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { useSafePaginatedQuery } from "@/hooks/useSafePaginatedQuery";
import { QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Plus, Trash2, Pencil, HelpCircle } from "lucide-react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { asBoolean, asNumber, asString } from "@/lib/bulkUpload/coerce";
import { importInBatches } from "@/lib/bulkUpload/importInBatches";
import { useEditorForm } from "@/hooks/useEditorForm";
import { confirmDiscard } from "@/hooks/useUnsavedChangesGuard";

type FaqRow = {
  _id: Id<"faqs">;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

type FaqForm = {
  question: string;
  answer: string;
  category: string;
  sortOrder: string;
  isActive: boolean;
};

const DEFAULT_CATEGORY = "General Travel FAQs";
const PAGE_SIZE = 100;

function slugifyCategory(cat: string) {
  return (cat || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Inline sort-order editor. Saves on blur / Enter only (not per keystroke),
 * validates the number, and Escape reverts. Previously every keystroke saved,
 * so clearing the field saved 0 and the row jumped under the cursor.
 */
function SortOrderInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (next: number) => Promise<void>;
}) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!focused && !busy) setText(String(value));
  }, [value, focused, busy]);

  async function commit() {
    const trimmed = text.trim();
    const next = Number(trimmed);
    if (trimmed === "" || !Number.isFinite(next)) {
      setText(String(value));
      return;
    }
    if (next === value) return;
    setBusy(true);
    try {
      await onCommit(next);
    } catch {
      setText(String(value));
    } finally {
      setBusy(false);
    }
  }

  return (
    <input
      className={cn(
        "w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm",
        busy && "opacity-60",
      )}
      type="number"
      aria-label="Sort order"
      value={text}
      disabled={busy}
      onFocus={() => setFocused(true)}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        setFocused(false);
        void commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          setText(String(value));
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

export function AdminFaqsPanel() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const { results, status, loadMore, error: listError } = useSafePaginatedQuery(
    api.faqs.listAdminPage,
    canQuery ? { sessionToken } : "skip",
    { initialNumItems: PAGE_SIZE },
  );

  const upsert = useMutation(api.faqs.upsert);
  const bulkUpsert = useMutation(api.faqs.bulkUpsert);
  const setActive = useMutation(api.faqs.setActive);
  const setSortOrder = useMutation(api.faqs.setSortOrder);
  const remove = useMutation(api.faqs.remove);
  const seed = useMutation(api.faqs.seedSampleFaqs);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"faqs"> | null>(null);
  const form = useEditorForm<FaqForm>({
    question: "",
    answer: "",
    category: DEFAULT_CATEGORY,
    sortOrder: "",
    isActive: true,
  });
  const { values, setField, dirty } = form;
  const [err, setErr] = useState<string | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const list = useMemo(() => (results as FaqRow[] | undefined) ?? [], [results]);
  const allLoaded = status === "Exhausted";

  function openNew() {
    // Only suggest a sort order when the whole list is loaded; otherwise the
    // server appends the FAQ after the current last one.
    const nextSort = allLoaded ? String((list[list.length - 1]?.sortOrder ?? 0) + 1) : "";
    setEditingId(null);
    form.reset({
      question: "",
      answer: "",
      category: DEFAULT_CATEGORY,
      sortOrder: nextSort,
      isActive: true,
    });
    setErr(null);
    setEditorOpen(true);
  }

  function openEdit(row: FaqRow) {
    setEditingId(row._id);
    form.reset({
      question: row.question,
      answer: row.answer,
      category: row.category,
      sortOrder: String(row.sortOrder),
      isActive: row.isActive,
    });
    setErr(null);
    setEditorOpen(true);
  }

  useEffect(() => {
    if (!editorOpen) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        document.getElementById("faq-editor-save")?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editorOpen]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (typeof sessionToken !== "string") {
      setErr("Session expired — refresh and sign in again.");
      return;
    }
    const sortText = values.sortOrder.trim();
    const sortOrder = sortText === "" ? undefined : Number(sortText);
    if (sortOrder !== undefined && !Number.isFinite(sortOrder)) {
      setErr("Sort order must be a number.");
      return;
    }
    if (editingId && sortOrder === undefined) {
      setErr("Sort order is required.");
      return;
    }
    setSaving(true);
    try {
      await upsert({
        sessionToken,
        faqId: editingId ?? undefined,
        question: values.question,
        answer: values.answer,
        category: values.category,
        sortOrder,
        isActive: values.isActive,
      });
      form.markSaved();
      setEditorOpen(false);
    } catch (er) {
      setErr(toUserFacingErrorMessage(er));
    } finally {
      setSaving(false);
    }
  }

  /** Runs a list action and surfaces failures (these used to be fire-and-forget). */
  async function runListAction(action: () => Promise<unknown>) {
    setListErr(null);
    try {
      await action();
    } catch (e) {
      setListErr(toUserFacingErrorMessage(e));
      throw e;
    }
  }

  if (!canQuery) {
    return (
      <p className="text-sm text-muted">
        {sessionToken === undefined ? "Loading…" : "You need an admin session."}
      </p>
    );
  }

  if (status === "LoadingFirstPage") {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const categories = Array.from(new Set(list.map((x) => x.category))).sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <div className="space-y-6">
      <QueryErrorBanner error={listError} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden />
          New FAQ
        </Button>
        <Button type="button" variant="secondary" onClick={() => setBulkOpen(true)}>
          Bulk upload
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            void runListAction(async () => {
              const r = await seed({ sessionToken });
              if (r.skipped) setListErr("Sample FAQs are only added when there are no FAQs yet.");
            }).catch(() => undefined)
          }
        >
          Seed sample FAQs
        </Button>
        <p className="text-xs text-slate-500">
          Tip: use sort order to control how items appear on `/faqs`. Press Enter or click away to save it.
        </p>
      </div>

      {listErr ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {listErr}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="min-w-[880px] w-full text-left text-sm">
          <thead className="whitespace-nowrap border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3">Visible</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row._id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-brand-ink">
                  <span className="inline-flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden />
                    <span className="line-clamp-1">{row.question}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {row.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      #{slugifyCategory(row.category)}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <SortOrderInput
                    value={row.sortOrder}
                    onCommit={(next) =>
                      runListAction(() =>
                        setSortOrder({ sessionToken, faqId: row._id, sortOrder: next }),
                      )
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className={cn(
                      "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary",
                      row.isActive ? "bg-emerald-500" : "bg-slate-200",
                    )}
                    role="switch"
                    aria-checked={row.isActive}
                    onClick={() =>
                      void runListAction(() =>
                        setActive({ sessionToken, faqId: row._id, isActive: !row.isActive }),
                      ).catch(() => undefined)
                    }
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition",
                        row.isActive ? "translate-x-5" : "translate-x-0.5",
                      )}
                    />
                  </button>
                  <span className="sr-only">{row.isActive ? "Visible" : "Hidden"}</span>
                  <span
                    className={cn(
                      "ml-2 align-middle text-xs font-bold",
                      row.isActive ? "text-emerald-700" : "text-slate-500",
                    )}
                  >
                    {row.isActive ? "Shown" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-slate-50"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      onClick={() => {
                        if (confirm("Delete this FAQ? This cannot be undone.")) {
                          void runListAction(() =>
                            remove({ sessionToken, faqId: row._id }),
                          ).catch(() => undefined);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No FAQs yet. Click “New FAQ” or seed sample items.
          </p>
        ) : null}
      </div>

      {!allLoaded ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            disabled={status !== "CanLoadMore"}
            onClick={() => loadMore(PAGE_SIZE)}
          >
            {status === "LoadingMore" ? "Loading…" : "Load more FAQs"}
          </Button>
        </div>
      ) : null}

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        confirmClose={dirty}
        title={editingId ? "Edit FAQ" : "New FAQ"}
        description="Question/answer show on the public FAQs page when Visible is on."
        panelClassName="max-w-2xl"
      >
        <form onSubmit={onSave} className="space-y-3">
          {err ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {err}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
              Question
              <input
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={values.question}
                onChange={(e) => setField("question", e.target.value)}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Category
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                list="faq-categories"
                value={values.category}
                onChange={(e) => setField("category", e.target.value)}
              />
              <datalist id="faq-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Sort order
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                type="number"
                placeholder={editingId ? undefined : "auto (end of list)"}
                value={values.sortOrder}
                onChange={(e) => setField("sortOrder", e.target.value)}
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-slate-600">
            Answer
            <textarea
              required
              rows={8}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed"
              value={values.answer}
              onChange={(e) => setField("answer", e.target.value)}
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-brand-ink">
                Visible on FAQs page
              </span>
              <span className="text-xs text-slate-500">
                When on, this item is shown on `/faqs`.
              </span>
            </span>
            <button
              type="button"
              className={cn(
                "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                values.isActive ? "bg-emerald-500" : "bg-slate-300",
              )}
              role="switch"
              aria-checked={values.isActive}
              onClick={() => setField("isActive", !values.isActive)}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow transition",
                  values.isActive ? "translate-x-6" : "translate-x-0.5",
                )}
              />
            </button>
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button id="faq-editor-save" type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create FAQ"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (confirmDiscard(dirty)) setEditorOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk upload FAQs"
        description="Upload a .json or .xlsx file. Rows are upserted by (category + question). Blank cells keep existing values."
        templateHint={
          <div className="space-y-1">
            <p className="font-semibold">Columns / keys</p>
            <p className="font-mono text-xs">
              question, answer, category, sortOrder, isActive
            </p>
            <p className="text-xs text-slate-600">
              Tip: for XLSX, use TRUE/FALSE for isActive.
            </p>
          </div>
        }
        transformRow={(row) => {
          const question = asString(row.question);
          const answer = asString(row.answer);
          if (!question) throw new Error("Missing question");
          if (!answer) throw new Error("Missing answer");
          return {
            question,
            answer,
            category: asString(row.category),
            sortOrder: asNumber(row.sortOrder),
            isActive: asBoolean(row.isActive),
          };
        }}
        onImport={async (rows) => {
          if (!sessionToken) throw new Error("Missing admin session");
          return await importInBatches({
            rows,
            batchSize: 50,
            importBatch: async (batch) => bulkUpsert({ sessionToken, rows: batch }),
            merge: (a, b) => ({
              processed: a.processed + b.processed,
              created: (a.created ?? 0) + (b.created ?? 0),
              updated: (a.updated ?? 0) + (b.updated ?? 0),
              skipped: (a.skipped ?? 0) + (b.skipped ?? 0),
              errors: [...(a.errors ?? []), ...(b.errors ?? [])],
            }),
          });
        }}
      />
    </div>
  );
}
