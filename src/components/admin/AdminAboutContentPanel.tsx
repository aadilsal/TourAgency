"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
      <FieldLabel>Image</FieldLabel>
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
          <button
            type="button"
            className="text-xs font-semibold text-red-600 hover:underline"
            onClick={onRemove}
          >
            Remove
          </button>
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Eyebrow</FieldLabel>
            <TextInput value={values.eyebrow} onChange={(e) => setField("eyebrow", e.target.value)} />
          </div>
          <div>
            <FieldLabel>Heading</FieldLabel>
            <TextInput value={values.heading} onChange={(e) => setField("heading", e.target.value)} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Explore tab</h3>
            <div>
              <FieldLabel>Title</FieldLabel>
              <TextInput value={values.exploreTitle} onChange={(e) => setField("exploreTitle", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Body (one paragraph per line)</FieldLabel>
              <TextAreaField
                rows={6}
                value={values.exploreBodyText}
                onChange={(e) => setField("exploreBodyText", e.target.value)}
              />
            </div>
            <TabImageUploader
              displayUrl={tabImageDisplayUrl("explore")}
              uploading={tabImageUploading.explore}
              onPick={(f) => void uploadTabImage("explore", f)}
              onRemove={() => removeTabImage("explore")}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Stats</h3>
            <div>
              <FieldLabel>Stat 1 value</FieldLabel>
              <TextInput value={values.stat1Value} onChange={(e) => setField("stat1Value", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Stat 1 label</FieldLabel>
              <TextInput value={values.stat1Label} onChange={(e) => setField("stat1Label", e.target.value)} />
            </div>
            <div className="h-px w-full bg-border" aria-hidden />
            <div>
              <FieldLabel>Stat 2 value</FieldLabel>
              <TextInput value={values.stat2Value} onChange={(e) => setField("stat2Value", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Stat 2 label</FieldLabel>
              <TextInput value={values.stat2Label} onChange={(e) => setField("stat2Label", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Mission tab</h3>
            <div>
              <FieldLabel>Title</FieldLabel>
              <TextInput value={values.missionTitle} onChange={(e) => setField("missionTitle", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Body (one paragraph per line)</FieldLabel>
              <TextAreaField
                rows={6}
                value={values.missionBodyText}
                onChange={(e) => setField("missionBodyText", e.target.value)}
              />
            </div>
            <TabImageUploader
              displayUrl={tabImageDisplayUrl("mission")}
              uploading={tabImageUploading.mission}
              onPick={(f) => void uploadTabImage("mission", f)}
              onRemove={() => removeTabImage("mission")}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Vision tab</h3>
            <div>
              <FieldLabel>Title</FieldLabel>
              <TextInput value={values.visionTitle} onChange={(e) => setField("visionTitle", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Body (one paragraph per line)</FieldLabel>
              <TextAreaField
                rows={6}
                value={values.visionBodyText}
                onChange={(e) => setField("visionBodyText", e.target.value)}
              />
            </div>
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
          <Button variant="primary" disabled={saving} onClick={onSave}>
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
          <div>
            <FieldLabel>Partner name</FieldLabel>
            <TextInput value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-havezic-background-light",
                addingPartner && "pointer-events-none opacity-60",
              )}
            >
              <Upload className="h-4 w-4 text-havezic-primary" aria-hidden />
              Choose logo
              <input
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
            <span className="text-xs text-muted">
              {partnerFile ? partnerFile.name : "No file selected"}
            </span>
            <Button
              variant="secondary"
              disabled={addingPartner}
              onClick={() => void onAddPartner()}
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

