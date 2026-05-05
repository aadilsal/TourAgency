"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id, Doc } from "@convex/_generated/dataModel";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldError, FieldHint, FieldLabel, TextInput } from "@/components/ui/FormField";
import { cn } from "@/lib/cn";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { asBoolean, asNumber, asString } from "@/lib/bulkUpload/coerce";
import { importInBatches } from "@/lib/bulkUpload/importInBatches";

function isProbablyImageFile(file: File) {
  const t = (file.type || "").toLowerCase();
  return t.startsWith("image/");
}

export function AdminTeamPanel() {
  const sessionToken = useConvexSessionToken();
  const canMutate = typeof sessionToken === "string" && sessionToken.trim().length > 0;

  const rows = useQuery(
    api.team.listForAdmin,
    canMutate ? { sessionToken } : "skip",
  ) as Doc<"teamMembers">[] | undefined;

  const ids = useMemo(() => (rows ?? []).map((r) => r._id), [rows]);
  const imageUrls = useQuery(
    api.team.resolveTeamMemberImageUrlsForAdmin,
    canMutate && ids.length > 0 ? { sessionToken, ids } : "skip",
  ) as (string | null)[] | undefined;

  const idToUrl = useMemo(() => {
    const m = new Map<string, string | null>();
    for (let i = 0; i < ids.length; i++) m.set(ids[i] as unknown as string, imageUrls?.[i] ?? null);
    return m;
  }, [ids, imageUrls]);

  const generateUploadUrl = useMutation(api.team.generateTeamMemberImageUploadUrl);
  const create = useMutation(api.team.create);
  const update = useMutation(api.team.update);
  const remove = useMutation(api.team.remove);
  const move = useMutation(api.team.move);
  const bulkUpsert = useMutation(api.team.bulkUpsert);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  async function uploadOne(f: File): Promise<Id<"_storage">> {
    if (!canMutate) throw new Error("Not authenticated");
    const postUrl = await generateUploadUrl({ sessionToken });
    const contentType = f.type || "application/octet-stream";
    const res = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: f,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const data = (await res.json()) as { storageId?: Id<"_storage"> };
    if (!data.storageId) throw new Error("No storageId returned");
    return data.storageId;
  }

  async function onCreate() {
    setErr(null);
    setMsg(null);
    if (!canMutate) {
      setErr(
        sessionToken === undefined
          ? "Your session is still loading. Try again in a moment."
          : "You need an admin session to make changes. Refresh or sign in again.",
      );
      return;
    }
    const n = name.trim();
    const r = role.trim();
    if (!n || !r) {
      setErr("Name and role are required.");
      return;
    }

    setSaving(true);
    try {
      let imageStorageId: Id<"_storage"> | undefined = undefined;
      if (file) imageStorageId = await uploadOne(file);
      await create({
        sessionToken,
        name: n,
        role: r,
        imageStorageId,
        isActive: true,
      });
      setName("");
      setRole("");
      setFile(null);
      setMsg("Team member added.");
    } catch (e) {
      setErr(toUserFacingErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const items = rows ?? [];

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Add team member</h2>
            <p className="mt-2 text-sm text-muted">
              Upload a photo, then set a name and role. The About page shows active members in a carousel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setBulkOpen(true)}
              disabled={!canMutate}
            >
              Bulk upload
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="team-name" required>
              Name
            </FieldLabel>
            <TextInput
              id="team-name"
              placeholder="e.g. Usman"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="team-role" required>
              Role
            </FieldLabel>
            <TextInput
              id="team-role"
              placeholder="e.g. CEO"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel htmlFor="team-image">Photo (optional)</FieldLabel>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-havezic-background-light",
                saving && "pointer-events-none opacity-60",
              )}
            >
              <Upload className="h-4 w-4 text-havezic-primary" aria-hidden />
              Choose image
              <input
                id="team-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && !isProbablyImageFile(f)) {
                    setErr("Please choose an image file.");
                    setFile(null);
                    return;
                  }
                  setFile(f);
                }}
              />
            </label>
            <FieldHint>{file ? file.name : "No file selected"}</FieldHint>
          </div>
        </div>

        {err ? (
          <div className="mt-4">
            <FieldError>{err}</FieldError>
          </div>
        ) : null}
        {msg ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {msg}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={onCreate} disabled={saving}>
            {saving ? "Saving…" : "Add member"}
          </Button>
        </div>
      </Card>

      <Card className="p-6 md:p-8">
        <h2 className="text-lg font-bold text-foreground">Team members</h2>
        <p className="mt-2 text-sm text-muted">
          Use arrows to reorder. Toggle active to show/hide on the public page.
        </p>

        {!canMutate ? (
          <p className="mt-6 text-sm text-muted">
            {sessionToken === undefined
              ? "Loading admin session…"
              : "Admin session unavailable. Please refresh or sign in again."}
          </p>
        ) : items.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No team members yet.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => {
              const url = idToUrl.get(m._id as unknown as string) ?? null;
              return (
                <div
                  key={m._id}
                  className="rounded-2xl border border-border bg-background p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-havezic-background-light ring-1 ring-border">
                      {url ? (
                        <Image src={url} alt="" fill sizes="56px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted">
                          IMG
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{m.name}</p>
                      <p className="truncate text-xs text-muted">{m.role}</p>
                      <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-muted">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={m.isActive}
                          onChange={async (e) => {
                            try {
                              await update({
                                sessionToken,
                                id: m._id,
                                isActive: e.target.checked,
                              });
                            } catch (e2) {
                              setErr(toUserFacingErrorMessage(e2));
                            }
                          }}
                        />
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-border bg-background p-2 text-muted transition hover:bg-havezic-background-light hover:text-foreground"
                        aria-label="Move up"
                        onClick={async () => {
                          try {
                            await move({ sessionToken, id: m._id, direction: "up" });
                          } catch (e2) {
                            setErr(toUserFacingErrorMessage(e2));
                          }
                        }}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-border bg-background p-2 text-muted transition hover:bg-havezic-background-light hover:text-foreground"
                        aria-label="Move down"
                        onClick={async () => {
                          try {
                            await move({ sessionToken, id: m._id, direction: "down" });
                          } catch (e2) {
                            setErr(toUserFacingErrorMessage(e2));
                          }
                        }}
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl border border-border bg-background p-2 text-red-600 transition hover:bg-red-50"
                      aria-label="Delete"
                      onClick={async () => {
                        if (!confirm(`Delete ${m.name}?`)) return;
                        try {
                          await remove({ sessionToken, id: m._id });
                        } catch (e2) {
                          setErr(toUserFacingErrorMessage(e2));
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk upload team members"
        description="Upload a .json or .xlsx file. Rows are upserted by (name + role). Image uploads are not supported in bulk; provide imageStorageId if needed."
        templateHint={
          <div className="space-y-1">
            <p className="font-semibold">Columns / keys</p>
            <p className="font-mono text-xs">name, role, isActive, sortOrder, imageStorageId</p>
          </div>
        }
        transformRow={(row) => {
          const name = asString(row.name);
          const role = asString(row.role);
          if (!name) throw new Error("Missing name");
          if (!role) throw new Error("Missing role");
          return {
            name,
            role,
            isActive: asBoolean(row.isActive),
            sortOrder: asNumber(row.sortOrder),
            imageStorageId: asString(row.imageStorageId),
          };
        }}
        onImport={async (rows) => {
          if (!canMutate) throw new Error("Missing admin session");
          return await importInBatches({
            rows,
            batchSize: 50,
            importBatch: async (batch) =>
              bulkUpsert({
                sessionToken,
                rows: batch.map((b) => ({
                  name: b.name,
                  role: b.role,
                  isActive: b.isActive ?? undefined,
                  sortOrder: b.sortOrder ?? undefined,
                  imageStorageId: b.imageStorageId
                    ? (b.imageStorageId as unknown as Id<"_storage">)
                    : undefined,
                })),
              }),
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

