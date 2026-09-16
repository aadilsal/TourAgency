"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCallback, useEffect, useState } from "react";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { PENDING_IMAGE_PREFIX, type TourFormPatch, type TourFormValues } from "./model";

/** Some browsers/OSes leave `File.type` empty even for real images from “Choose file”. */
function isProbablyImageFile(f: File): boolean {
  if (f.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|avif|bmp|heic)$/i.test(f.name);
}

function TourImageThumbPreview({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);
  if (broken) {
    return (
      <div className="flex h-full items-center justify-center px-1 text-center text-[10px] font-medium text-slate-500">
        Image unavailable
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- blob + Convex URLs */
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

export function MediaSection({
  values,
  onChange,
  sessionToken,
  folderKey,
  onMessage,
}: {
  values: TourFormValues;
  onChange: TourFormPatch;
  sessionToken: string | null | undefined;
  /** Logical upload folder, e.g. `tours/{slug}`. */
  folderKey: string;
  onMessage: (message: string | null) => void;
}) {
  const hasToken = typeof sessionToken === "string";
  const generateUploadUrl = useMutation(api.media.generateTourImageUploadUrl);
  const imageRefs = values.imageRefs;
  const [uploading, setUploading] = useState(false);
  /** `blob:` URLs for files being uploaded (key = temporary ref in `imageRefs`). */
  const [pendingFilePreviews, setPendingFilePreviews] = useState<Record<string, string>>({});

  const clearAllPendingPreviews = useCallback(() => {
    setPendingFilePreviews((p) => {
      for (const u of Object.values(p)) URL.revokeObjectURL(u);
      return {};
    });
  }, []);
  useEffect(() => () => clearAllPendingPreviews(), [clearAllPendingPreviews]);

  // Non-throwing: an expired session must not unmount the editor (and its edits).
  const { data: imagePreviewUrls } = useSafeQuery(
    api.media.resolveStorageIdsForAdmin,
    hasToken && imageRefs.length > 0 ? { sessionToken, ids: imageRefs } : "skip",
  );

  const setRefs = (fn: (prev: string[]) => string[]) =>
    onChange((prev) => ({ imageRefs: fn(prev.imageRefs) }));

  function dropPreview(tempId: string, objectUrl: string) {
    URL.revokeObjectURL(objectUrl);
    setPendingFilePreviews((prev) => {
      const rest = { ...prev };
      delete rest[tempId];
      return rest;
    });
  }

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const files = input.files;
    const resetFileInput = () => {
      input.value = "";
    };
    if (!files?.length) {
      resetFileInput();
      return;
    }
    if (!hasToken) {
      onMessage(
        sessionToken === undefined
          ? "Your session is still loading. Wait a moment, then choose images again."
          : "You need a valid admin session to upload. Refresh the page or sign in again.",
      );
      resetFileInput();
      return;
    }
    const token = sessionToken;
    const filesArr = Array.from(files).filter(isProbablyImageFile);
    if (filesArr.length === 0) {
      onMessage("No image files detected. Use JPEG, PNG, WebP, or another common image format.");
      resetFileInput();
      return;
    }
    const entries = filesArr.map((file) => {
      const tempId = `${PENDING_IMAGE_PREFIX}${crypto.randomUUID()}`;
      return { file, tempId, objectUrl: URL.createObjectURL(file) };
    });
    setPendingFilePreviews((prev) => {
      const n = { ...prev };
      for (const { tempId, objectUrl } of entries) n[tempId] = objectUrl;
      return n;
    });
    setRefs((prev) => [...prev, ...entries.map((x) => x.tempId)]);
    setUploading(true);
    onMessage(null);
    try {
      for (const { file, tempId, objectUrl } of entries) {
        try {
          const postUrl = await generateUploadUrl({ sessionToken: token, folderKey });
          const res = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": file.type || "image/jpeg" },
            body: file,
          });
          if (!res.ok) throw new Error(`Upload failed (${res.status})`);
          const data = (await res.json()) as { storageId?: string };
          if (!data.storageId) throw new Error("No storageId from upload");
          dropPreview(tempId, objectUrl);
          setRefs((prev) => prev.map((r) => (r === tempId ? data.storageId! : r)));
        } catch (inner) {
          dropPreview(tempId, objectUrl);
          setRefs((prev) => prev.filter((r) => r !== tempId));
          throw inner;
        }
      }
    } catch (err) {
      // Remove placeholders for files after the failed one too; they would
      // otherwise stay "Uploading…" forever and block saving. (Revoking a URL
      // twice is harmless.)
      for (const { tempId, objectUrl } of entries) dropPreview(tempId, objectUrl);
      setRefs((prev) => prev.filter((r) => !entries.some((x) => x.tempId === r)));
      onMessage(toUserFacingErrorMessage(err));
    } finally {
      setUploading(false);
      resetFileInput();
    }
  }

  function removeImageAt(index: number) {
    const ref = imageRefs[index];
    if (ref) {
      const url = pendingFilePreviews[ref];
      if (url) dropPreview(ref, url);
    }
    setRefs((prev) => prev.filter((_, j) => j !== index));
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs font-bold text-slate-700">Tour images</p>
      <p className="mt-1 text-xs text-slate-500">
        Upload image files from your device — they are stored securely in Convex. Uploaded
        images register under this tour when you save.
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
        <span className="font-semibold text-slate-700">Image folder</span>{" "}
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-800 ring-1 ring-slate-200">
          {folderKey}
        </code>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-brand-primary hover:bg-slate-50">
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={uploading || !hasToken}
            onChange={(e) => void onPickFiles(e)}
          />
          {uploading
            ? "Uploading…"
            : !hasToken && sessionToken === undefined
              ? "Preparing uploads…"
              : "Choose images"}
        </label>
      </div>
      {imageRefs.length > 0 ? (
        <ul className="mt-4 space-y-3 border-t border-slate-200 pt-3">
          {imageRefs.map((ref, i) => {
            const localBlob = pendingFilePreviews[ref];
            const remote = imagePreviewUrls?.[i];
            const src = localBlob ?? remote ?? null;
            const isPending = ref.startsWith(PENDING_IMAGE_PREFIX);
            const waitingRemote = !src && imagePreviewUrls === undefined && !isPending;
            return (
              <li key={`${ref}-${i}`} className="flex items-start gap-3 text-xs">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  {waitingRemote ? (
                    <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden />
                  ) : src ? (
                    <TourImageThumbPreview src={src} />
                  ) : (
                    <div className="flex h-full items-center justify-center px-1 text-center text-[10px] font-medium text-slate-500">
                      No preview
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="break-all font-mono text-slate-700">
                    {isPending ? "Uploading…" : ref.length > 64 ? `${ref.slice(0, 64)}…` : ref}
                  </span>
                  <button
                    type="button"
                    className="mt-1 block text-red-600 hover:underline"
                    onClick={() => removeImageAt(i)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-500">No images yet.</p>
      )}
    </div>
  );
}
