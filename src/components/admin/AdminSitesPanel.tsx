"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import type { Id } from "@convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useEditorForm } from "@/hooks/useEditorForm";
import { confirmDiscard } from "@/hooks/useUnsavedChangesGuard";
import { QueryErrorBanner } from "@/components/admin/shared/EditorStatus";

type SiteRow = {
  _id: Id<"sites">;
  provinceId: Id<"provinces">;
  provinceSlug: string;
  provinceName: string;
  slug: string;
  name: string;
  type: "historical" | "cultural" | "natural" | "adventure";
  summary: string;
  history: string;
  city?: string;
  featured: boolean;
  sortOrder: number;
  isActive: boolean;
};

const siteTypes = ["historical", "cultural", "natural", "adventure"] as const;
type SiteType = (typeof siteTypes)[number];

type SiteForm = {
  provinceId: string;
  type: SiteType;
  name: string;
  summary: string;
  history: string;
  city: string;
  featured: boolean;
  isActive: boolean;
  sortOrder: string;
};

const EMPTY_FORM: SiteForm = {
  provinceId: "",
  type: "historical",
  name: "",
  summary: "",
  history: "",
  city: "",
  featured: false,
  isActive: true,
  sortOrder: "0",
};

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function AdminSitesPanel() {
  const sessionToken = useConvexSessionToken();
  const canMutate = typeof sessionToken === "string";
  const provinces = useQuery(api.provinces.listForTourAssignment, {});
  const [filterProvince, setFilterProvince] = useState("");
  const rowsQuery = useSafeQuery(
    api.sites.listForAdmin,
    canMutate
      ? { sessionToken, provinceSlug: filterProvince || undefined }
      : "skip",
  );
  const createSite = useMutation(api.sites.createSite);
  const updateSite = useMutation(api.sites.updateSite);
  const deleteSite = useMutation(api.sites.deleteSite);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SiteRow | null>(null);
  const form = useEditorForm<SiteForm>(EMPTY_FORM);
  const { values, setField, dirty } = form;
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const list = useMemo(() => (rowsQuery.data ?? []) as SiteRow[], [rowsQuery.data]);

  function openNew() {
    setEditing(null);
    const defaultProvinceId =
      (provinces ?? []).find((p) => p.slug === filterProvince)?._id ??
      (provinces ?? [])[0]?._id ??
      "";
    form.reset({ ...EMPTY_FORM, provinceId: defaultProvinceId, sortOrder: String(list.length) });
    setMsg(null);
    setModalOpen(true);
  }

  function openEdit(s: SiteRow) {
    setEditing(s);
    form.reset({
      provinceId: s.provinceId,
      type: s.type,
      name: s.name,
      summary: s.summary,
      history: s.history,
      city: s.city ?? "",
      featured: s.featured,
      isActive: s.isActive,
      sortOrder: String(s.sortOrder),
    });
    setMsg(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const sortOrder = Number(values.sortOrder);
    if (values.sortOrder.trim() === "" || !Number.isFinite(sortOrder)) {
      setMsg("Sort order must be a number.");
      return;
    }
    if (!values.provinceId) {
      setMsg("Add a province first — sites must belong to one.");
      return;
    }
    setSaving(true);
    try {
      if (!canMutate) throw new Error("Not authenticated");
      const provinceId = values.provinceId as Id<"provinces">;
      if (editing) {
        await updateSite({
          sessionToken,
          siteId: editing._id,
          ...(provinceId !== editing.provinceId ? { provinceId } : {}),
          name: values.name.trim(),
          type: values.type,
          summary: values.summary.trim(),
          history: values.history.trim(),
          // Blank = clear (null); previously a cleared city was silently kept.
          city: values.city.trim() || null,
          featured: values.featured,
          isActive: values.isActive,
          sortOrder,
        });
        setMsg("Site saved.");
      } else {
        await createSite({
          sessionToken,
          provinceId,
          slug: slugify(values.name),
          name: values.name.trim(),
          type: values.type,
          summary: values.summary.trim(),
          history: values.history.trim(),
          city: values.city.trim() || undefined,
          featured: values.featured,
          sortOrder,
          isActive: values.isActive,
        });
        setMsg("Site created.");
      }
      form.markSaved();
      setModalOpen(false);
    } catch (err) {
      setMsg(toUserFacingErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: SiteRow) {
    setMsg(null);
    if (!canMutate) {
      setMsg("Session expired — refresh and sign in again.");
      return;
    }
    if (!window.confirm(`Delete the site "${s.name}"? This cannot be undone.`)) return;
    try {
      await deleteSite({ sessionToken, siteId: s._id });
      setMsg("Site deleted.");
    } catch (err) {
      setMsg(toUserFacingErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <QueryErrorBanner error={rowsQuery.error} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          Add site
        </Button>
        <label className="text-sm font-semibold text-slate-600">
          Filter province
          <select
            className="ml-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={filterProvince}
            onChange={(e) => setFilterProvince(e.target.value)}
          >
            <option value="">All</option>
            {(provinces ?? []).map((p) => (
              <option key={p._id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {msg && !modalOpen ? <p className="text-sm text-slate-600">{msg}</p> : null}
      </div>

      {rowsQuery.isLoading ? <p className="text-sm text-slate-500">Loading…</p> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="whitespace-nowrap bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Site</th>
              <th className="px-4 py-3">Province</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s._id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">
                    {s.name}
                    {!s.isActive ? (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        Hidden
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-slate-500">{s.slug}</p>
                </td>
                <td className="px-4 py-3">{s.provinceName}</td>
                <td className="px-4 py-3 capitalize">{s.type}</td>
                <td className="px-4 py-3">{s.featured ? "Yes" : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                    onClick={() => openEdit(s)}
                    aria-label={`Edit ${s.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    onClick={() => void handleDelete(s)}
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        confirmClose={dirty}
        title={editing ? "Edit site" : "Add site"}
      >
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          {msg && modalOpen ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{msg}</p>
          ) : null}
          <label className="block text-xs font-semibold text-slate-600">
            Province
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={values.provinceId}
              onChange={(e) => setField("provinceId", e.target.value)}
              required
            >
              {(provinces ?? []).length === 0 ? <option value="">No provinces yet</option> : null}
              {(provinces ?? []).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Type
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={values.type}
              onChange={(e) => setField("type", e.target.value as SiteType)}
            >
              {siteTypes.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Name
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={values.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Summary
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={2}
              value={values.summary}
              onChange={(e) => setField("summary", e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            History
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={5}
              value={values.history}
              onChange={(e) => setField("history", e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            City
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={values.city}
              onChange={(e) => setField("city", e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(e) => setField("featured", e.target.checked)}
            />
            Featured in scrolly preview
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
            />
            Active
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Sort order
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={values.sortOrder}
              onChange={(e) => setField("sortOrder", e.target.value)}
              required
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (confirmDiscard(dirty)) setModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
