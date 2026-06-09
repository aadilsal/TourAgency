"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

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

export function AdminSitesPanel() {
  const provinces = useQuery(api.provinces.listForTourAssignment, {});
  const [filterProvince, setFilterProvince] = useState("");
  const rows = useQuery(api.sites.listForAdmin, {
    provinceSlug: filterProvince || undefined,
  });
  const updateSite = useMutation(api.sites.updateSite);
  const deleteSite = useMutation(api.sites.deleteSite);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"sites"> | null>(null);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [history, setHistory] = useState("");
  const [city, setCity] = useState("");
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const list = useMemo(() => (rows ?? []) as SiteRow[], [rows]);

  function openEdit(s: SiteRow) {
    setEditingId(s._id);
    setName(s.name);
    setSummary(s.summary);
    setHistory(s.history);
    setCity(s.city ?? "");
    setFeatured(s.featured);
    setIsActive(s.isActive);
    setSortOrder(s.sortOrder);
    setMsg(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    try {
      await updateSite({
        siteId: editingId,
        name: name.trim(),
        summary: summary.trim(),
        history: history.trim(),
        city: city.trim() || undefined,
        featured,
        isActive,
        sortOrder,
      });
      setModalOpen(false);
      setMsg("Site saved.");
    } catch (err) {
      setMsg(toUserFacingErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
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
        {msg ? <p className="text-sm text-slate-600">{msg}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
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
                  <p className="font-semibold text-slate-900">{s.name}</p>
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
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    onClick={() => void deleteSite({ siteId: s._id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Edit site">
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <label className="block text-xs font-semibold text-slate-600">
            Name
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Summary
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            History
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={5}
              value={history}
              onChange={(e) => setHistory(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            City
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Featured in scrolly preview
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Sort order
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
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
