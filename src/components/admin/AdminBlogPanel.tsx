"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import Link from "next/link";
import { useState, useEffect } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { asBoolean, asString } from "@/lib/bulkUpload/coerce";
import { importInBatches } from "@/lib/bulkUpload/importInBatches";

type Post = {
  _id: Id<"blogPosts">;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: number;
};

export function AdminBlogPanel() {
  const sessionToken = useConvexSessionToken();
  const posts = useQuery(
    api.blog.getPosts,
    sessionToken
      ? { includeDrafts: true, sessionToken }
      : { includeDrafts: false },
  );
  const createPost = useMutation(api.blog.createPost);
  const deletePost = useMutation(api.blog.deletePost);
  const updatePost = useMutation(api.blog.updatePost);
  const seedPosts = useMutation(api.blog.seedSamplePosts);
  const bulkUpsert = useMutation(api.blog.bulkUpsert);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"blogPosts"> | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  function openNew() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setContent("");
    setMetaTitle("");
    setMetaDescription("");
    setPublished(false);
    setErr(null);
    setEditorOpen(true);
  }

  function openEdit(p: Post) {
    setEditingId(p._id);
    setTitle(p.title);
    setSlug(p.slug);
    setContent(p.content);
    setMetaTitle(p.metaTitle ?? "");
    setMetaDescription(p.metaDescription ?? "");
    setPublished(p.published);
    setErr(null);
    setEditorOpen(true);
  }

  useEffect(() => {
    if (!editorOpen) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        document.getElementById("blog-editor-save")?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editorOpen]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      if (editingId) {
        await updatePost({
          postId: editingId,
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
          content,
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          published,
        });
      } else {
        await createPost({
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
          content,
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          published,
        });
      }
      setEditorOpen(false);
    } catch (er) {
      setErr(toUserFacingErrorMessage(er));
    } finally {
      setSaving(false);
    }
  }

  if (posts === undefined) {
    return <p className="text-sm text-brand-muted">Loading…</p>;
  }

  const list = posts as Post[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden />
          New post
        </Button>
        <Button type="button" variant="secondary" onClick={() => setBulkOpen(true)}>
          Bulk upload
        </Button>
        <Button type="button" variant="secondary" onClick={() => void seedPosts({})}>
          Seed sample posts
        </Button>
        <p className="text-xs text-slate-500">
          Editor supports long-form content; Cmd/Ctrl+Enter saves from the modal.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr
                key={p._id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-3 font-medium text-brand-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-400" aria-hidden />
                    {p.title}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">/{p.slug}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className={cn(
                      "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary",
                      p.published ? "bg-emerald-500" : "bg-slate-200",
                    )}
                    role="switch"
                    aria-checked={p.published}
                    onClick={() =>
                      void updatePost({ postId: p._id, published: !p.published })
                    }
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition",
                        p.published ? "translate-x-5" : "translate-x-0.5",
                      )}
                    />
                  </button>
                  <span className="sr-only">
                    {p.published ? "Published" : "Draft"}
                  </span>
                  <span
                    className={cn(
                      "ml-2 align-middle text-xs font-bold",
                      p.published ? "text-emerald-700" : "text-slate-500",
                    )}
                  >
                    {p.published ? "Live" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {new Date(p.createdAt).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-slate-50"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </button>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-slate-50"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      onClick={() => {
                        if (confirm("Delete this post?")) {
                          void deletePost({ postId: p._id });
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
          <p className="p-6 text-sm text-slate-500">No posts yet.</p>
        ) : null}
      </div>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? "Edit post" : "New post"}
        description="Write in the large editor below. Toggle publish when ready."
        panelClassName="max-w-3xl"
      >
        <form onSubmit={onSave} className="space-y-3">
          {err ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {err}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              Title
              <input
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Slug
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="auto from title"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            Content
            <textarea
              required
              rows={14}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              Meta title (SEO)
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Meta description
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
            </label>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-brand-ink">
                Published
              </span>
              <span className="text-xs text-slate-500">
                When on, the post is visible on /blog.
              </span>
            </span>
            <button
              type="button"
              className={cn(
                "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                published ? "bg-emerald-500" : "bg-slate-300",
              )}
              role="switch"
              aria-checked={published}
              onClick={() => setPublished(!published)}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow transition",
                  published ? "translate-x-6" : "translate-x-0.5",
                )}
              />
            </button>
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button id="blog-editor-save" type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create post"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditorOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk upload blog posts"
        description="Upload a .json or .xlsx file. Rows are upserted by slug."
        templateHint={
          <div className="space-y-1">
            <p className="font-semibold">Columns / keys</p>
            <p className="font-mono text-xs">
              title, slug, content, metaTitle, metaDescription, published
            </p>
          </div>
        }
        transformRow={(row) => {
          const title = asString(row.title);
          const slug = asString(row.slug);
          const content = asString(row.content);
          const published = asBoolean(row.published);
          if (!title) throw new Error("Missing title");
          if (!slug) throw new Error("Missing slug");
          if (!content) throw new Error("Missing content");
          if (published === undefined) throw new Error("Missing published");
          return {
            title,
            slug,
            content,
            metaTitle: asString(row.metaTitle),
            metaDescription: asString(row.metaDescription),
            published,
          };
        }}
        onImport={async (rows) => {
          return await importInBatches({
            rows,
            batchSize: 25,
            importBatch: async (batch) => bulkUpsert({ rows: batch }),
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
