"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FieldError,
  FieldHint,
  FieldLabel,
  TextAreaField,
  TextInput,
} from "@/components/ui/FormField";
import { Upload, Trash2 } from "lucide-react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { cn } from "@/lib/cn";

function toText(lines: string[] | undefined) {
  return (lines ?? []).join("\n");
}

function isProbablyImageFile(file: File) {
  const t = (file.type || "").toLowerCase();
  return t.startsWith("image/");
}

export function AdminAboutContentPanel() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string" && sessionToken.trim().length > 0;

  const snap = useQuery(api.about.getAdmin, canQuery ? { sessionToken } : "skip") as
    | Doc<"aboutPageSettings">
    | null
    | undefined;

  const upsert = useMutation(api.about.upsertAdmin);
  const addPartner = useMutation(api.about.addPartner);
  const removePartner = useMutation(api.about.removePartner);
  const generateLogoUploadUrl = useMutation(api.about.generatePartnerLogoUploadUrl);

  const [eyebrow, setEyebrow] = useState("Community friendly");
  const [heading, setHeading] = useState("Your Reliable Travel Partner");

  const [exploreTitle, setExploreTitle] = useState("");
  const [exploreBodyText, setExploreBodyText] = useState("");
  const [exploreImage, setExploreImage] = useState("");

  const [missionTitle, setMissionTitle] = useState("");
  const [missionBodyText, setMissionBodyText] = useState("");
  const [missionImage, setMissionImage] = useState("");

  const [visionTitle, setVisionTitle] = useState("");
  const [visionBodyText, setVisionBodyText] = useState("");
  const [visionImage, setVisionImage] = useState("");

  const [stat1Value, setStat1Value] = useState("150k+");
  const [stat1Label, setStat1Label] = useState("Satisfied clients");
  const [stat2Value, setStat2Value] = useState("100+");
  const [stat2Label, setStat2Label] = useState("Our hard working staff");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  useEffect(() => {
    if (!snap) return;
    setEyebrow(snap.eyebrow ?? "Community friendly");
    setHeading(snap.heading ?? "Your Reliable Travel Partner");

    setExploreTitle(snap.exploreTitle ?? "");
    setExploreBodyText(toText(snap.exploreBody));
    setExploreImage(snap.exploreImage ?? "");

    setMissionTitle(snap.missionTitle ?? "");
    setMissionBodyText(toText(snap.missionBody));
    setMissionImage(snap.missionImage ?? "");

    setVisionTitle(snap.visionTitle ?? "");
    setVisionBodyText(toText(snap.visionBody));
    setVisionImage(snap.visionImage ?? "");

    const s1 = snap.stats?.[0];
    const s2 = snap.stats?.[1];
    if (s1) {
      setStat1Value(s1.value ?? "150k+");
      setStat1Label(s1.label ?? "Satisfied clients");
    }
    if (s2) {
      setStat2Value(s2.value ?? "100+");
      setStat2Label(s2.label ?? "Our hard working staff");
    }
  }, [snap]);

  const stats = useMemo(
    () => [
      { value: stat1Value, label: stat1Label },
      { value: stat2Value, label: stat2Label },
    ],
    [stat1Label, stat1Value, stat2Label, stat2Value],
  );

  async function onSave() {
    setErr(null);
    setMsg(null);
    if (!canQuery) {
      setErr(sessionToken === undefined ? "Loading…" : "You need an admin session.");
      return;
    }
    setSaving(true);
    try {
      await upsert({
        sessionToken,
        eyebrow,
        heading,
        exploreTitle,
        exploreBodyText,
        exploreImage,
        missionTitle,
        missionBodyText,
        missionImage,
        visionTitle,
        visionBodyText,
        visionImage,
        stats,
      });
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

  const [partnerName, setPartnerName] = useState("");
  const [partnerFile, setPartnerFile] = useState<File | null>(null);
  const [addingPartner, setAddingPartner] = useState(false);

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

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8">
        <h2 className="text-lg font-bold text-foreground">About page content</h2>
        <p className="mt-2 text-sm text-muted">
          Edit the tab text, images, stats, and partner logos shown on the About Us page.
        </p>

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
            <TextInput value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Heading</FieldLabel>
            <TextInput value={heading} onChange={(e) => setHeading(e.target.value)} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Explore tab</h3>
            <div>
              <FieldLabel>Title</FieldLabel>
              <TextInput value={exploreTitle} onChange={(e) => setExploreTitle(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Body (one paragraph per line)</FieldLabel>
              <TextAreaField
                rows={6}
                value={exploreBodyText}
                onChange={(e) => setExploreBodyText(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Image URL</FieldLabel>
              <TextInput value={exploreImage} onChange={(e) => setExploreImage(e.target.value)} />
              <FieldHint>Paste an image URL for now (we can add uploads here too if you want).</FieldHint>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Stats</h3>
            <div>
              <FieldLabel>Stat 1 value</FieldLabel>
              <TextInput value={stat1Value} onChange={(e) => setStat1Value(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Stat 1 label</FieldLabel>
              <TextInput value={stat1Label} onChange={(e) => setStat1Label(e.target.value)} />
            </div>
            <div className="h-px w-full bg-border" aria-hidden />
            <div>
              <FieldLabel>Stat 2 value</FieldLabel>
              <TextInput value={stat2Value} onChange={(e) => setStat2Value(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Stat 2 label</FieldLabel>
              <TextInput value={stat2Label} onChange={(e) => setStat2Label(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Mission tab</h3>
            <div>
              <FieldLabel>Title</FieldLabel>
              <TextInput value={missionTitle} onChange={(e) => setMissionTitle(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Body (one paragraph per line)</FieldLabel>
              <TextAreaField
                rows={6}
                value={missionBodyText}
                onChange={(e) => setMissionBodyText(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Image URL</FieldLabel>
              <TextInput value={missionImage} onChange={(e) => setMissionImage(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Vision tab</h3>
            <div>
              <FieldLabel>Title</FieldLabel>
              <TextInput value={visionTitle} onChange={(e) => setVisionTitle(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Body (one paragraph per line)</FieldLabel>
              <TextAreaField
                rows={6}
                value={visionBodyText}
                onChange={(e) => setVisionBodyText(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Image URL</FieldLabel>
              <TextInput value={visionImage} onChange={(e) => setVisionImage(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
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
                key={`${p.name}-${idx}`}
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
                  onClick={() => {
                    if (!confirm(`Remove ${p.name}?`)) return;
                    void removePartner({ sessionToken, index: idx });
                  }}
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

