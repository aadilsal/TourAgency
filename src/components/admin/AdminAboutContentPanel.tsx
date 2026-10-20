"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconAction } from "@/components/admin/shared/IconAction";
import {
  FieldError,
  FieldLabel,
  TextAreaField,
  TextInput,
} from "@/components/ui/FormField";
import { Upload, Trash2 } from "lucide-react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { cn } from "@/lib/cn";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useEditorForm } from "@/hooks/useEditorForm";
import { useLocalDraft } from "@/hooks/useLocalDraft";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import {
  DraftRestoreBanner,
  QueryErrorBanner,
  SaveStatusPill,
} from "@/components/admin/shared/EditorStatus";
import {
  AdminField,
  InfoTip,
  RequiredFieldsNote,
  useRequiredFields,
} from "@/components/admin/shared/AdminField";

type TabKey = "explore" | "mission" | "vision";

type AboutForm = {
  eyebrow: string;
  heading: string;
  exploreTitle: string;
  exploreBodyText: string;
  missionTitle: string;
  missionBodyText: string;
  visionTitle: string;
  visionBodyText: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
};

const DEFAULT_ABOUT_FORM: AboutForm = {
  eyebrow: "Community friendly",
  heading: "Your Reliable Travel Partner",
  exploreTitle: "",
  exploreBodyText: "",
  missionTitle: "",
  missionBodyText: "",
  visionTitle: "",
  visionBodyText: "",
  stat1Value: "150k+",
  stat1Label: "Satisfied clients",
  stat2Value: "100+",
  stat2Label: "Our hard working staff",
};

function toText(lines: string[] | undefined) {
  return (lines ?? []).join("\n");
}

function formFromSnap(snap: Doc<"aboutPageSettings"> | null): AboutForm {
  if (!snap) return DEFAULT_ABOUT_FORM;
  const s1 = snap.stats?.[0];
  const s2 = snap.stats?.[1];
  return {
    eyebrow: snap.eyebrow ?? DEFAULT_ABOUT_FORM.eyebrow,
    heading: snap.heading ?? DEFAULT_ABOUT_FORM.heading,
    exploreTitle: snap.exploreTitle ?? "",
    exploreBodyText: toText(snap.exploreBody),
    missionTitle: snap.missionTitle ?? "",
    missionBodyText: toText(snap.missionBody),
    visionTitle: snap.visionTitle ?? "",
    visionBodyText: toText(snap.visionBody),
    stat1Value: s1?.value ?? DEFAULT_ABOUT_FORM.stat1Value,
    stat1Label: s1?.label ?? DEFAULT_ABOUT_FORM.stat1Label,
    stat2Value: s2?.value ?? DEFAULT_ABOUT_FORM.stat2Value,
    stat2Label: s2?.label ?? DEFAULT_ABOUT_FORM.stat2Label,
  };
}

function isProbablyImageFile(file: File) {
  const t = (file.type || "").toLowerCase();
  return t.startsWith("image/");
}

function TabImageUploader({
  displayUrl,
  uploading,
  onPick,
  onRemove,
}: {
  displayUrl: string | null;
  uploading: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <div className="relative flex items-center gap-1">
        <FieldLabel>Image</FieldLabel>
        <InfoTip label="About Image">
          Shown beside this tab&apos;s text on the About Us page. A landscape photo (about 1400px wide) works best.
        </InfoTip>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-havezic-background-light">
          {displayUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- blob + Convex URLs */
            <img src={displayUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] font-medium text-muted">
              No image
            </div>
          )}
        </div>
        <label
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-havezic-background-light",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          <Upload className="h-4 w-4 text-havezic-primary" aria-hidden />
          {uploading ? "Uploading…" : displayUrl ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onPick(f);
            }}
          />
        </label>
        {displayUrl ? (
          <IconAction label="Remove image" onClick={onRemove} />
        ) : null}
      </div>
    </div>
  );
}

export function AdminAboutContentPanel() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string" && sessionToken.trim().length > 0;

  // Non-throwing: a session expiry shows a banner instead of unmounting the form.
  const snapQuery = useSafeQuery(api.about.getAdmin, canQuery ? { sessionToken } : "skip");
  const snap = snapQuery.data as Doc<"aboutPageSettings"> | null | undefined;

  const upsert = useMutation(api.about.upsertAdmin);
  const addPartner = useMutation(api.about.addPartner);
  const removePartner = useMutation(api.about.removePartner);
  const generateLogoUploadUrl = useMutation(api.about.generatePartnerLogoUploadUrl);

  const form = useEditorForm<AboutForm>(DEFAULT_ABOUT_FORM);
  const { values, setField, reset: resetForm } = form;

  // about.upsertAdmin accepts empty strings, so nothing here may block a save
  // (the live document could already have a blank field). Ids/markup only.
  const req = useRequiredFields(
    [
      { name: "heading", label: "Heading", value: values.heading, when: false },
      { name: "exploreTitle", label: "Explore tab title", value: values.exploreTitle, when: false },
      { name: "missionTitle", label: "Mission tab title", value: values.missionTitle, when: false },
      { name: "visionTitle", label: "Vision tab title", value: values.visionTitle, when: false },
    ],
    { idPrefix: "about" },
  );

  // Tab images are upload-only. `undefined` = leave unchanged; `null` = clear; id = new upload.
  const [tabImageIds, setTabImageIds] = useState<Record<TabKey, Id<"_storage"> | null | undefined>>({
    explore: undefined,
    mission: undefined,
    vision: undefined,
  });
  const [tabImageBlobs, setTabImageBlobs] = useState<Record<TabKey, string | null>>({
    explore: null,
    mission: null,
    vision: null,
  });
  const [tabImageUploading, setTabImageUploading] = useState<Record<TabKey, boolean>>({
    explore: false,
    mission: false,
    vision: false,
  });

  const imagesDirty = Object.values(tabImageIds).some((v) => v !== undefined);
  const dirty = form.dirty || imagesDirty;

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [partnerName, setPartnerName] = useState("");
  const [partnerFile, setPartnerFile] = useState<File | null>(null);
  const [addingPartner, setAddingPartner] = useState(false);

  // Partner name + logo are both checked by onAddPartner before addPartner runs.
  const partnerReq = useRequiredFields(
    [
      { name: "partnerName", label: "Partner name", value: partnerName },
      { name: "partnerLogo", label: "Logo", value: partnerFile, message: "Choose a logo image" },
    ],
    { idPrefix: "about-partner" },
  );

  const partners = useMemo(() => snap?.partners ?? [], [snap?.partners]);

  const partnerStorageIds = useMemo(
    () =>
      partners
        .map((p) => p.logoStorageId)
        .filter((x): x is Id<"_storage"> => !!x),
    [partners],
  );

  const partnerLogoUrls = useQuery(
    api.about.resolvePartnerLogoUrlsForAdmin,
    canQuery && partnerStorageIds.length > 0
      ? { sessionToken, storageIds: partnerStorageIds }
      : "skip",
  ) as (string | null)[] | undefined;

  const storageIdToUrl = useMemo(() => {
    const m = new Map<string, string | null>();
    for (let i = 0; i < partnerStorageIds.length; i++) {
      m.set(partnerStorageIds[i] as unknown as string, partnerLogoUrls?.[i] ?? null);
    }
    return m;
  }, [partnerLogoUrls, partnerStorageIds]);

  // Resolve the currently-saved tab image storage ids to preview URLs.
  const tabStorageIds = useMemo(() => {
    const ids: Id<"_storage">[] = [];
    if (snap?.exploreImageStorageId) ids.push(snap.exploreImageStorageId);
    if (snap?.missionImageStorageId) ids.push(snap.missionImageStorageId);
    if (snap?.visionImageStorageId) ids.push(snap.visionImageStorageId);
    return ids;
  }, [snap?.exploreImageStorageId, snap?.missionImageStorageId, snap?.visionImageStorageId]);

  const tabStorageUrls = useQuery(
    api.about.resolvePartnerLogoUrlsForAdmin,
    canQuery && tabStorageIds.length > 0 ? { sessionToken, storageIds: tabStorageIds } : "skip",
  ) as (string | null)[] | undefined;

  const tabStorageIdToUrl = useMemo(() => {
    const m = new Map<string, string | null>();
    for (let i = 0; i < tabStorageIds.length; i++) {
      m.set(tabStorageIds[i] as unknown as string, tabStorageUrls?.[i] ?? null);
    }
    return m;
  }, [tabStorageIds, tabStorageUrls]);

  /** The image URL to display for a tab: local upload > saved storage id > legacy URL. */
  function tabImageDisplayUrl(key: TabKey): string | null {
    if (tabImageIds[key] === null) return null; // explicitly removed
    if (tabImageBlobs[key]) return tabImageBlobs[key];
    const storageId = snap?.[`${key}ImageStorageId` as const] as Id<"_storage"> | undefined;
    if (storageId) return tabStorageIdToUrl.get(storageId as unknown as string) ?? null;
    const legacy = snap?.[`${key}Image` as const] as string | undefined;
    return legacy || null;
  }

  async function uploadTabImage(key: TabKey, file: File) {
    if (!canQuery) return;
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image file.");
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    setTabImageBlobs((prev) => {
      const old = prev[key];
      if (old) URL.revokeObjectURL(old);
      return { ...prev, [key]: blobUrl };
    });
    setTabImageUploading((prev) => ({ ...prev, [key]: true }));
    setErr(null);
    try {
      const postUrl = await generateLogoUploadUrl({ sessionToken });
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = (await res.json()) as { storageId?: Id<"_storage"> };
      if (!data.storageId) throw new Error("No storageId returned");
      setTabImageIds((prev) => ({ ...prev, [key]: data.storageId! }));
    } catch (e) {
      URL.revokeObjectURL(blobUrl);
      setTabImageBlobs((prev) => ({ ...prev, [key]: null }));
      setErr(toUserFacingErrorMessage(e));
    } finally {
      setTabImageUploading((prev) => ({ ...prev, [key]: false }));
    }
  }

  function removeTabImage(key: TabKey) {
    setTabImageBlobs((prev) => {
      const old = prev[key];
      if (old) URL.revokeObjectURL(old);
      return { ...prev, [key]: null };
    });
    setTabImageIds((prev) => ({ ...prev, [key]: null }));
  }

  // Hydrate from the server ONCE, then only when the stored doc changes AND the
  // form has no unsaved edits. Previously every doc change (e.g. adding or
  // removing a partner patches the same doc) re-synced all fields and wiped
  // whatever the admin was typing, including freshly uploaded tab images.
  const [hydrated, setHydrated] = useState(false);
  const hydratedStamp = useRef<number | null>(null);
  useEffect(() => {
    if (snap === undefined) return;
    const stamp = snap?.updatedAt ?? 0;
    if (hydrated) {
      if (stamp === hydratedStamp.current || dirty) return;
    }
    resetForm(formFromSnap(snap));
    hydratedStamp.current = stamp;
    if (!hydrated) setHydrated(true);
  }, [snap, hydrated, dirty, resetForm]);

  const draft = useLocalDraft<AboutForm>(hydrated ? "draft:about" : null, values, form.dirty);

  const partnerFormDirty = partnerName.trim().length > 0 || partnerFile !== null;
  useUnsavedChangesGuard(dirty || partnerFormDirty);

  function resetImageEdits() {
    setTabImageIds({ explore: undefined, mission: undefined, vision: undefined });
    setTabImageBlobs((prev) => {
      for (const u of Object.values(prev)) if (u) URL.revokeObjectURL(u);
      return { explore: null, mission: null, vision: null };
    });
  }

  async function onSave() {
    setErr(null);
    setMsg(null);
    if (!canQuery) {
      setErr(sessionToken === undefined ? "Loading…" : "You need an admin session.");
      return;
    }
    if (Object.values(tabImageUploading).some(Boolean)) {
      setErr("Wait for image uploads to finish before saving.");
      return;
    }
    setSaving(true);
    try {
      // The editor exposes two stats; keep any further stored stats intact.
      const stats = [
        { value: values.stat1Value, label: values.stat1Label },
        { value: values.stat2Value, label: values.stat2Label },
        ...(snap?.stats ?? []).slice(2),
      ];
      await upsert({
        sessionToken,
        eyebrow: values.eyebrow,
        heading: values.heading,
        exploreTitle: values.exploreTitle,
        exploreBodyText: values.exploreBodyText,
        exploreImageStorageId: tabImageIds.explore,
        missionTitle: values.missionTitle,
        missionBodyText: values.missionBodyText,
        missionImageStorageId: tabImageIds.mission,
        visionTitle: values.visionTitle,
        visionBodyText: values.visionBodyText,
        visionImageStorageId: tabImageIds.vision,
        stats,
      });
      draft.clear();
      form.markSaved();
      resetImageEdits();
      setMsg("Saved.");
    } catch (e) {
      setErr(toUserFacingErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function uploadPartnerLogo(file: File): Promise<Id<"_storage">> {
    if (!canQuery) throw new Error("Not authenticated");
    const postUrl = await generateLogoUploadUrl({ sessionToken });
    const contentType = file.type || "application/octet-stream";
    const res = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const data = (await res.json()) as { storageId?: Id<"_storage"> };
    if (!data.storageId) throw new Error("No storageId returned");
    return data.storageId;
  }

  async function onRemovePartner(p: Doc<"aboutPageSettings">["partners"][number], idx: number) {
    if (!canQuery) return;
    if (!confirm(`Remove ${p.name}?`)) return;
    setErr(null);
    setMsg(null);
    try {
      // Remove by stable id; legacy rows fall back to index + name check so a
      // stale list can never delete the wrong partner.
      await removePartner(
        p.id
          ? { sessionToken, partnerId: p.id }
          : { sessionToken, index: idx, expectedName: p.name },
      );
      setMsg("Partner removed.");
    } catch (e) {
      setErr(toUserFacingErrorMessage(e));
    }
  }

  async function onAddPartner() {
    setErr(null);
    setMsg(null);
    if (!canQuery) return;
    const name = partnerName.trim();
    if (!name) {
      setErr("Partner name is required.");
      return;
    }
    if (!partnerFile) {
      setErr("Please choose a logo image.");
      return;
    }
    setAddingPartner(true);
    try {
      const storageId = await uploadPartnerLogo(partnerFile);
      await addPartner({ sessionToken, name, logoStorageId: storageId });
      setPartnerName("");
      setPartnerFile(null);
      partnerReq.reset();
      setMsg("Partner added.");
    } catch (e) {
      setErr(toUserFacingErrorMessage(e));
    } finally {
      setAddingPartner(false);
    }
  }

  if (!canQuery) {
    return (
      <p className="text-sm text-muted">
        {sessionToken === undefined ? "Loading…" : "You need an admin session."}
      </p>
    );
  }

  // Don't render editable inputs until real data is loaded: typing into
  // placeholder defaults would otherwise be overwritten by the first load.
  if (!hydrated) {
    return snapQuery.error ? (
      <QueryErrorBanner error={snapQuery.error} />
    ) : (
      <p className="text-sm text-muted">Loading About content…</p>
    );
  }

  return (
    <div className="space-y-6">
      <QueryErrorBanner error={snapQuery.error} />
      <Card className="p-6 md:p-8">
        <h2 className="text-lg font-bold text-foreground">About page content</h2>
        <p className="mt-2 text-sm text-muted">
          Edit the tab text, images, stats, and partner logos shown on the About Us page.
        </p>

        {draft.restorable && !form.dirty ? (
          <div className="mt-4">
            <DraftRestoreBanner
              savedAt={draft.restorable.savedAt}
              onRestore={() => {
                form.setValues(draft.restorable!.data);
                draft.dismiss();
              }}
              onDiscard={draft.clear}
            />
          </div>
        ) : null}

        {msg ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            {msg}
          </div>
        ) : null}
        {err ? (
          <div className="mt-4">
            <FieldError>{err}</FieldError>
          </div>
        ) : null}

        <RequiredFieldsNote className="mt-4" />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Eyebrow"
            htmlFor="about-eyebrow"
            tip="Small line shown above the main heading on the About Us page."
          >
            <TextInput
              id="about-eyebrow"
              placeholder="e.g. Community friendly"
              value={values.eyebrow}
              onChange={(e) => setField("eyebrow", e.target.value)}
            />
          </AdminField>
          <AdminField
            label="Heading"
            htmlFor={req.id("heading")}
            tip="The main section heading on the About Us page, under the eyebrow."
            error={req.errorFor("heading")}
          >
            <TextInput
              {...req.fieldProps("heading")}
              placeholder="e.g. Your Reliable Travel Partner"
              value={values.heading}
              onChange={(e) => setField("heading", e.target.value)}
            />
          </AdminField>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Explore tab</h3>
            <AdminField
              label="Title"
              htmlFor={req.id("exploreTitle")}
              tip="Heading shown when visitors open the Explore tab on the About Us page."
              error={req.errorFor("exploreTitle")}
            >
              <TextInput
                {...req.fieldProps("exploreTitle")}
                placeholder="e.g. JunketTours is your reliable travel partner"
                value={values.exploreTitle}
                onChange={(e) => setField("exploreTitle", e.target.value)}
              />
            </AdminField>
            <AdminField
              label="Body"
              htmlFor="about-exploreBody"
              tip="Text under the Explore tab heading. Each line becomes its own paragraph."
              hint="One paragraph per line."
            >
              <TextAreaField
                id="about-exploreBody"
                aria-describedby="about-exploreBody-hint"
                rows={6}
                placeholder="e.g. A Lahore-based, government-registered tour operator running trips to Hunza, Skardu and Swat."
                value={values.exploreBodyText}
                onChange={(e) => setField("exploreBodyText", e.target.value)}
              />
            </AdminField>
            <TabImageUploader
              displayUrl={tabImageDisplayUrl("explore")}
              uploading={tabImageUploading.explore}
              onPick={(f) => void uploadTabImage("explore", f)}
              onRemove={() => removeTabImage("explore")}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Stats</h3>
            <AdminField
              label="Stat 1 value"
              htmlFor="about-stat1Value"
              tip="Big number shown in the stats box under the Explore tab text."
            >
              <TextInput
                id="about-stat1Value"
                placeholder="e.g. 150k+"
                value={values.stat1Value}
                onChange={(e) => setField("stat1Value", e.target.value)}
              />
            </AdminField>
            <AdminField
              label="Stat 1 label"
              htmlFor="about-stat1Label"
              tip="Short caption under the stat 1 number."
            >
              <TextInput
                id="about-stat1Label"
                placeholder="e.g. Satisfied clients"
                value={values.stat1Label}
                onChange={(e) => setField("stat1Label", e.target.value)}
              />
            </AdminField>
            <div className="h-px w-full bg-border" aria-hidden />
            <AdminField
              label="Stat 2 value"
              htmlFor="about-stat2Value"
              tip="Big number shown in the stats box under the Explore tab text."
            >
              <TextInput
                id="about-stat2Value"
                placeholder="e.g. 100+"
                value={values.stat2Value}
                onChange={(e) => setField("stat2Value", e.target.value)}
              />
            </AdminField>
            <AdminField
              label="Stat 2 label"
              htmlFor="about-stat2Label"
              tip="Short caption under the stat 2 number."
            >
              <TextInput
                id="about-stat2Label"
                placeholder="e.g. Our hard working staff"
                value={values.stat2Label}
                onChange={(e) => setField("stat2Label", e.target.value)}
              />
            </AdminField>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Mission tab</h3>
            <AdminField
              label="Title"
              htmlFor={req.id("missionTitle")}
              tip="Heading shown when visitors open the Mission tab on the About Us page."
              error={req.errorFor("missionTitle")}
            >
              <TextInput
                {...req.fieldProps("missionTitle")}
                placeholder="e.g. Make adventure travel possible for all"
                value={values.missionTitle}
                onChange={(e) => setField("missionTitle", e.target.value)}
              />
            </AdminField>
            <AdminField
              label="Body"
              htmlFor="about-missionBody"
              tip="Text under the Mission tab heading. Each line becomes its own paragraph."
              hint="One paragraph per line."
            >
              <TextAreaField
                id="about-missionBody"
                aria-describedby="about-missionBody-hint"
                rows={6}
                placeholder="e.g. We plan safe, well-organised trips across northern Pakistan, from Hunza to Skardu."
                value={values.missionBodyText}
                onChange={(e) => setField("missionBodyText", e.target.value)}
              />
            </AdminField>
            <TabImageUploader
              displayUrl={tabImageDisplayUrl("mission")}
              uploading={tabImageUploading.mission}
              onPick={(f) => void uploadTabImage("mission", f)}
              onRemove={() => removeTabImage("mission")}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Vision tab</h3>
            <AdminField
              label="Title"
              htmlFor={req.id("visionTitle")}
              tip="Heading shown when visitors open the Vision tab on the About Us page."
              error={req.errorFor("visionTitle")}
            >
              <TextInput
                {...req.fieldProps("visionTitle")}
                placeholder="e.g. Organised, exciting tours for every traveller"
                value={values.visionTitle}
                onChange={(e) => setField("visionTitle", e.target.value)}
              />
            </AdminField>
            <AdminField
              label="Body"
              htmlFor="about-visionBody"
              tip="Text under the Vision tab heading. Each line becomes its own paragraph."
              hint="One paragraph per line."
            >
              <TextAreaField
                id="about-visionBody"
                aria-describedby="about-visionBody-hint"
                rows={6}
                placeholder="e.g. To be the first name travellers think of for culture and adventure trips in Pakistan."
                value={values.visionBodyText}
                onChange={(e) => setField("visionBodyText", e.target.value)}
              />
            </AdminField>
            <TabImageUploader
              displayUrl={tabImageDisplayUrl("vision")}
              uploading={tabImageUploading.vision}
              onPick={(f) => void uploadTabImage("vision", f)}
              onRemove={() => removeTabImage("vision")}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <SaveStatusPill dirty={dirty} />
          <Button
            variant="primary"
            {...req.submitProps}
            disabled={saving}
            onClick={() => {
              if (!req.guardSubmit()) return;
              void onSave();
            }}
          >
            {saving ? "Saving…" : "Save About content"}
          </Button>
        </div>
      </Card>

      <Card className="p-6 md:p-8">
        <h2 className="text-lg font-bold text-foreground">Partner logos</h2>
        <p className="mt-2 text-sm text-muted">
          Add partner logos shown under “Our partners in holiday experiences”.
          Save content once before adding partners.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <AdminField
            label="Partner name"
            htmlFor={partnerReq.id("partnerName")}
            required
            tip="Shown when a partner's logo is hovered and used as the logo's alt text on the About Us page."
            error={partnerReq.errorFor("partnerName")}
          >
            <TextInput
              {...partnerReq.fieldProps("partnerName")}
              placeholder="e.g. Pakistan Tourism Development Corporation"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />
          </AdminField>

          <div className="flex flex-wrap items-center gap-3">
            <label
              data-field="partnerLogo"
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-havezic-background-light",
                addingPartner && "pointer-events-none opacity-60",
              )}
            >
              <Upload className="h-4 w-4 text-havezic-primary" aria-hidden />
              Choose logo
              <span className="text-red-600" aria-hidden>
                *
              </span>
              <input
                aria-required
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && !isProbablyImageFile(f)) {
                    setErr("Please choose an image file.");
                    setPartnerFile(null);
                    return;
                  }
                  setPartnerFile(f);
                }}
              />
            </label>
            <span
              className={cn(
                "text-xs",
                partnerReq.errorFor("partnerLogo") ? "font-medium text-red-600" : "text-muted",
              )}
            >
              {partnerFile
                ? partnerFile.name
                : (partnerReq.errorFor("partnerLogo") ?? "No file selected")}
            </span>
            <Button
              variant="secondary"
              {...partnerReq.submitProps}
              disabled={addingPartner}
              onClick={() => {
                if (!partnerReq.guardSubmit()) return;
                void onAddPartner();
              }}
            >
              {addingPartner ? "Adding…" : "Add partner"}
            </Button>
          </div>
        </div>

        {partners.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No partner logos yet.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((p, idx) => (
              <div
                key={p.id ?? `${p.name}-${idx}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 shadow-sm"
              >
                <div className="relative h-12 w-20 overflow-hidden rounded-xl bg-havezic-background-light ring-1 ring-border">
                  {(() => {
                    const url =
                      p.logoExternalUrl ??
                      (p.logoStorageId
                        ? storageIdToUrl.get(p.logoStorageId as unknown as string) ?? null
                        : null);
                    if (!url) {
                      return (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted">
                          LOGO
                        </div>
                      );
                    }
                    return (
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-contain p-2"
                      />
                    );
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{p.name}</p>
                  <p className="truncate text-xs text-muted">
                    {p.logoStorageId ? "Uploaded logo" : p.logoExternalUrl ? "External URL" : "No logo"}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-border bg-background p-2 text-red-600 transition hover:bg-red-50"
                  aria-label="Remove partner"
                  onClick={() => void onRemovePartner(p, idx)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

