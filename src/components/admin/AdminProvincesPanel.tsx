"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

type ProvinceRow = {
  _id: Id<"provinces">;
  slug: string;
  name: string;
  tagline: string;
  intro: string;
  heroExternalUrl?: string;
  bestTime: string;
  tips: string[];
  costEstimate: string;
  matchTerms: string[];
  sortOrder: number;
  tourCount: number;
  siteCount: number;
};

function fromLines(v: string): string[] {
  return v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

// Sensible defaults for the map/scrolly/palette fields the public /guides page
// needs but which aren't worth exposing as raw inputs to a non-technical admin
// adding a new province. They can be refined later directly in the data if needed.
const NEW_PROVINCE_VISUAL_DEFAULTS = {
  mapPointX: 500,
  mapPointY: 300,
  paletteFrom: "rgba(2, 6, 23, 0.92)",
  paletteVia: "rgba(56, 189, 248, 0.18)",
  paletteTo: "rgba(2, 6, 23, 0.92)",
  paletteAccent: "rgba(56, 189, 248, 0.95)",
} as const;

export function AdminProvincesPanel() {
  const rows = useQuery(api.provinces.listForAdmin, {});
  const syncCatalog = useMutation(api.provinces.syncDefaultCatalog);
  const syncSites = useMutation(api.sites.syncDefaultCatalog);
  const createProvince = useMutation(api.provinces.createProvince);
  const updateProvince = useMutation(api.provinces.updateProvince);
  const deleteProvince = useMutation(api.provinces.deleteProvince);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"provinces"> | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [intro, setIntro] = useState("");
  const [bestTime, setBestTime] = useState("");
  const [tipsInput, setTipsInput] = useState("");
  const [costEstimate, setCostEstimate] = useState("");
  const [matchTermsInput, setMatchTermsInput] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const list = useMemo(() => (rows ?? []) as ProvinceRow[], [rows]);

  function openNew() {
    setEditingId(null);
    setName("");
    setTagline("");
    setIntro("");
    setBestTime("");
    setTipsInput("");
    setCostEstimate("");
    setMatchTermsInput("");
    setSortOrder(list.length);
    setMsg(null);
    setModalOpen(true);
  }

  function openEdit(p: ProvinceRow) {
    setEditingId(p._id);
    setName(p.name);
    setTagline(p.tagline);
    setIntro(p.intro);
    setBestTime(p.bestTime);
    setTipsInput(p.tips.join("\n"));
    setCostEstimate(p.costEstimate);
    setMatchTermsInput(p.matchTerms.join(", "));
    setSortOrder(p.sortOrder);
    setMsg(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const tips = fromLines(tipsInput);
    const matchTerms = matchTermsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    try {
      if (editingId) {
        await updateProvince({
          provinceId: editingId,
          name: name.trim(),
          tagline: tagline.trim(),
          intro: intro.trim(),
          bestTime: bestTime.trim(),
          tips,
          costEstimate: costEstimate.trim(),
          matchTerms,
          sortOrder,
        });
        setMsg("Saved.");
      } else {
        await createProvince({
          slug: slugify(name),
          name: name.trim(),
          tagline: tagline.trim(),
          intro: intro.trim(),
          bestTime: bestTime.trim(),
          tips,
          costEstimate: costEstimate.trim(),
          matchTerms,
          sortOrder,
          mapPointX: NEW_PROVINCE_VISUAL_DEFAULTS.mapPointX,
          mapPointY: NEW_PROVINCE_VISUAL_DEFAULTS.mapPointY,
          mapPointLabel: name.trim(),
          scrollyEyebrow: tagline.trim(),
          scrollyTitle: `${name.trim()}: ${tagline.trim()}`,
          scrollyBullets: tips.slice(0, 3),
          paletteFrom: NEW_PROVINCE_VISUAL_DEFAULTS.paletteFrom,
          paletteVia: NEW_PROVINCE_VISUAL_DEFAULTS.paletteVia,
          paletteTo: NEW_PROVINCE_VISUAL_DEFAULTS.paletteTo,
          paletteAccent: NEW_PROVINCE_VISUAL_DEFAULTS.paletteAccent,
        });
        setMsg("Province created.");
      }
      setModalOpen(false);
    } catch (err) {
      setMsg(toUserFacingErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: ProvinceRow) {
    const ok = window.confirm(
      `Delete "${p.name}"? Its ${p.siteCount} site(s) will also be deleted and any tours assigned to it will be unassigned. This cannot be undone.`,
    );
    if (!ok) return;
    setMsg(null);
    try {
      await deleteProvince({ provinceId: p._id });
      setMsg("Province deleted.");
    } catch (err) {
      setMsg(toUserFacingErrorMessage(err));
    }
  }

  async function handleSync() {
    setSyncing(true);
    setMsg(null);
    try {
      const p = await syncCatalog({});
      const s = await syncSites({});
      setMsg(
        `Synced provinces (${p.created} new, ${p.updated} updated) and sites (${s.created} new, ${s.updated} updated).`,
      );
    } catch (err) {
      setMsg(toUserFacingErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          Add province
        </Button>
        <Button type="button" variant="secondary" onClick={() => void handleSync()} disabled={syncing}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {syncing ? "Syncing…" : "Sync province catalog from seed"}
        </Button>
        {msg && !modalOpen ? <p className="text-sm text-slate-600">{msg}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="whitespace-nowrap bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Province</th>
              <th className="px-4 py-3">Sites</th>
              <th className="px-4 py-3">Tours</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p._id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">/guides/{p.slug}</p>
                </td>
                <td className="px-4 py-3">{p.siteCount}</td>
                <td className="px-4 py-3">{p.tourCount}</td>
                <td className="px-4 py-3">{p.sortOrder}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                    onClick={() => openEdit(p)}
                    aria-label={`Edit ${p.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    onClick={() => void handleDelete(p)}
                    aria-label={`Delete ${p.name}`}
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
        title={editingId ? "Edit province" : "Add province"}
      >
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          {msg && modalOpen ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{msg}</p>
          ) : null}
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
            Tagline
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              required
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Intro
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={4}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              required
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Best time
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={bestTime}
              onChange={(e) => setBestTime(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Tips (one per line)
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={3}
              value={tipsInput}
              onChange={(e) => setTipsInput(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Cost estimate
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={costEstimate}
              onChange={(e) => setCostEstimate(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Match terms (comma-separated)
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={matchTermsInput}
              onChange={(e) => setMatchTermsInput(e.target.value)}
            />
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
