"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import type { Id } from "@convex/_generated/dataModel";
import { useId, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { IconAction } from "@/components/admin/shared/IconAction";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useEditorForm } from "@/hooks/useEditorForm";
import { confirmDiscard } from "@/hooks/useUnsavedChangesGuard";
import { QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { AdminField, InfoTip, RequiredFieldsNote, useRequiredFields } from "@/components/admin/shared/AdminField";
import { AdvancedSection } from "@/components/admin/tour-form/fields";

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

  // Required = createSite's non-optional strings (provinceId, name, summary,
  // history) + updateSite refusing an empty name. The form always sends them.
  const req = useRequiredFields(
    [
      {
        name: "provinceId",
        label: "Province",
        value: values.provinceId,
        message: "Add a province first — sites must belong to one.",
      },
      { name: "name", label: "Name", value: values.name },
      // Optional in convex/sites.ts — existing sites may have them empty.
      { name: "summary", label: "Summary", value: values.summary, when: false },
      { name: "history", label: "History", value: values.history, when: false },
    ],
    { idPrefix: "site" },
  );
  const fieldIdBase = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const typeId = `site-type-${fieldIdBase}`;
  const cityId = `site-city-${fieldIdBase}`;
  const sortOrderId = `site-sort-order-${fieldIdBase}`;

  function openNew() {
    setEditing(null);
    req.reset();
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
    req.reset();
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
      setMsg("Position in list must be a number.");
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
      setMsg("You have been signed out. Refresh the page and sign in again.");
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
        <table className="admin-stack-table min-w-full text-sm">
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
                  <p className="text-xs text-slate-400">
                    {s.city ? s.city : null}
                  </p>
                </td>
                <td data-label="Province" className="px-4 py-3">{s.provinceName}</td>
                <td data-label="Type" className="px-4 py-3 capitalize">{s.type}</td>
                <td data-label="Featured" className="px-4 py-3">{s.featured ? "Yes" : "—"}</td>
                <td data-stack="actions" className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <IconAction
                      label={`Edit ${s.name}`}
                      icon={Pencil}
                      tone="neutral"
                      onClick={() => openEdit(s)}
                    />
                    <IconAction label={`Delete ${s.name}`} onClick={() => void handleDelete(s)} />
                  </div>
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
        description="A place to see, listed on its province’s guide page."
      >
        <form
          noValidate
          onSubmit={(e) => {
            if (!req.guardSubmit(e)) return;
            void handleSave(e);
          }}
          className="space-y-4"
        >
          {msg && modalOpen ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{msg}</p>
          ) : null}
          <RequiredFieldsNote />
          <AdminField
            label="Province"
            htmlFor={req.id("provinceId")}
            required
            tip="The province guide page this site is listed under."
            error={req.errorFor("provinceId")}
          >
            <select
              {...req.fieldProps("provinceId")}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={values.provinceId}
              onChange={(e) => setField("provinceId", e.target.value)}
            >
              {(provinces ?? []).length === 0 ? <option value="">No provinces yet</option> : null}
              {(provinces ?? []).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField
            label="Type"
            htmlFor={typeId}
            tip="Used by the category filter on the province guide page."
          >
            <select
              id={typeId}
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
          </AdminField>
          <AdminField
            label="Name"
            htmlFor={req.id("name")}
            required
            tip="The site's name as shown on the province guide."
            error={req.errorFor("name")}
          >
            <input
              {...req.fieldProps("name")}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="e.g. Badshahi Mosque"
              value={values.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </AdminField>
          <AdminField
            label="Summary"
            htmlFor={req.id("summary")}
            tip="One or two sentences shown at the top of the site's card."
            error={req.errorFor("summary")}
          >
            <textarea
              {...req.fieldProps("summary")}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={2}
              placeholder="e.g. Mughal-era mosque facing Lahore Fort, one of the largest in the world."
              value={values.summary}
              onChange={(e) => setField("summary", e.target.value)}
            />
          </AdminField>
          <AdminField
            label="History"
            htmlFor={req.id("history")}
            tip="The longer background paragraph shown on the site's card in the province guide."
            error={req.errorFor("history")}
          >
            <textarea
              {...req.fieldProps("history")}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={5}
              placeholder="e.g. Built by Emperor Aurangzeb in 1673, the mosque…"
              value={values.history}
              onChange={(e) => setField("history", e.target.value)}
            />
          </AdminField>
          <AdminField
            label="City"
            htmlFor={cityId}
            tip="The nearest city or town, shown under the site name."
            hint="Leave blank to show no city."
          >
            <input
              id={cityId}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="e.g. Lahore"
              value={values.city}
              onChange={(e) => setField("city", e.target.value)}
            />
          </AdminField>
          <div className="relative flex items-center gap-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={values.featured}
                onChange={(e) => setField("featured", e.target.checked)}
              />
              Show in the province preview
            </label>
            <InfoTip label="About Featured">
              Ticked sites appear in the scrolling province preview on the Guides page.
            </InfoTip>
          </div>
          <div className="relative flex items-center gap-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
              />
              Active (visible on site)
            </label>
            <InfoTip label="About Active">
              Untick to hide this site from your website without deleting it.
            </InfoTip>
          </div>
          <AdvancedSection forceOpen={Boolean(msg && /position/i.test(msg))}>
            <AdminField
              label="Position in list"
              htmlFor={sortOrderId}
              tip="Where this site appears within its province. Lower numbers come first."
            >
              <input
                id={sortOrderId}
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="e.g. 1"
                value={values.sortOrder}
                onChange={(e) => setField("sortOrder", e.target.value)}
              />
            </AdminField>
          </AdvancedSection>
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
            <Button type="submit" {...req.submitProps} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
