"use client";

import { useMutation } from "convex/react";
import { useSafePaginatedQuery } from "@/hooks/useSafePaginatedQuery";
import { QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { Eye, FileText, Pencil, Plus } from "lucide-react";
import { IconAction, IconActionLink } from "@/components/admin/shared/IconAction";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { asBoolean, asString } from "@/lib/bulkUpload/coerce";
import { importInBatches } from "@/lib/bulkUpload/importInBatches";
import { useEditorForm } from "@/hooks/useEditorForm";
import { useLocalDraft } from "@/hooks/useLocalDraft";
import { confirmDiscard } from "@/hooks/useUnsavedChangesGuard";
import { DraftRestoreBanner } from "@/components/admin/shared/EditorStatus";
import { AdminField, RequiredFieldsNote, useRequiredFields } from "@/components/admin/shared/AdminField";
import { AdvancedSection, MoreMenu } from "@/components/admin/tour-form/fields";

type Post = {
  _id: Id<"blogPosts">;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  metaTitle?: string;
  metaDescription?: string;
  /** Absent = guide (every post written before the Guides/Blog split). */
  kind?: "guide" | "blog";
  createdAt: number;
};

type PostForm = {
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  kind: "guide" | "blog";
};

const EMPTY_POST: PostForm = {
  title: "",
  slug: "",
  content: "",
  metaTitle: "",
  metaDescription: "",
  published: false,
  kind: "guide",
};

const PAGE_SIZE = 50;

function slugFromTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, "-");
}

export function AdminBlogPanel() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const { results, status, loadMore, error: listError } = useSafePaginatedQuery(
    api.blog.listAdminPage,
    canQuery ? { sessionToken } : "skip",
    { initialNumItems: PAGE_SIZE },
  );
  const createPost = useMutation(api.blog.createPost);
  const deletePost = useMutation(api.blog.deletePost);
  const updatePost = useMutation(api.blog.updatePost);
  const seedPosts = useMutation(api.blog.seedSamplePosts);
  const bulkUpsert = useMutation(api.blog.bulkUpsert);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"blogPosts"> | null>(null);
  const form = useEditorForm<PostForm>(EMPTY_POST);
  const { values, setField, dirty } = form;
  const [err, setErr] = useState<string | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  // Title: createPost/updatePost throw "Title can't be empty".
  // Content: createPost `content: v.string()` (the form always sends it).
  const req = useRequiredFields(
    [
      { name: "title", label: "Title", value: values.title },
      { name: "content", label: "Content", value: values.content },
    ],
    { idPrefix: "blog-editor" },
  );

  // Crash-proof backup of the long-form editor while it holds unsaved edits.
  const draft = useLocalDraft<PostForm>(
    editorOpen ? `draft:blog:${editingId ?? "new"}` : null,
    values,
    editorOpen && dirty,
  );

  function openNew() {
    setEditingId(null);
    form.reset(EMPTY_POST);
    req.reset();
    setErr(null);
    setEditorOpen(true);
  }

  function openEdit(p: Post) {
    setEditingId(p._id);
    form.reset({
      title: p.title,
      slug: p.slug,
      content: p.content,
      metaTitle: p.metaTitle ?? "",
      metaDescription: p.metaDescription ?? "",
      published: p.published,
      kind: p.kind ?? "guide",
    });
    req.reset();
    setErr(null);
    setEditorOpen(true);
  }

  /** Called after the Modal has already confirmed a dirty discard. */
  function closeEditor() {
    if (dirty) draft.clear();
    setEditorOpen(false);
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

  /** These used to be fire-and-forget: failures now surface in the panel. */
  async function togglePublished(postId: Id<"blogPosts">, published: boolean) {
    setListErr(null);
    if (typeof sessionToken !== "string") {
      setListErr("You have been signed out. Refresh the page and sign in again.");
      return;
    }
    try {
      await updatePost({ sessionToken, postId, published });
    } catch (e) {
      setListErr(toUserFacingErrorMessage(e));
    }
  }

  async function removePost(postId: Id<"blogPosts">) {
    setListErr(null);
    if (typeof sessionToken !== "string") {
      setListErr("You have been signed out. Refresh the page and sign in again.");
      return;
    }
    try {
      await deletePost({ sessionToken, postId });
    } catch (e) {
      setListErr(toUserFacingErrorMessage(e));
    }
  }

  async function runSeedPosts() {
    setListErr(null);
    if (typeof sessionToken !== "string") {
      setListErr("You have been signed out. Refresh the page and sign in again.");
      return;
    }
    try {
      const r = await seedPosts({ sessionToken });
      if (r.skipped) setListErr("Sample posts are only added when the blog is empty.");
    } catch (e) {
      setListErr(toUserFacingErrorMessage(e));
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!req.guardSubmit(e)) return;
    setErr(null);
    if (typeof sessionToken !== "string") {
      setErr("Session expired — your edits are backed up on this device. Sign in again, then save.");
      return;
    }
    const slug = values.slug.trim() || slugFromTitle(values.title);
    if (!slug) {
      setErr("Add a title.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updatePost({
          sessionToken,
          postId: editingId,
          title: values.title,
          slug,
          content: values.content,
          // Blank = clear (null). Previously a blank meta field could never be removed.
          metaTitle: values.metaTitle.trim() || null,
          metaDescription: values.metaDescription.trim() || null,
          published: values.published,
          kind: values.kind,
        });
      } else {
        await createPost({
          sessionToken,
          title: values.title,
          slug,
          content: values.content,
          metaTitle: values.metaTitle.trim() || undefined,
          metaDescription: values.metaDescription.trim() || undefined,
          published: values.published,
          kind: values.kind,
        });
      }
      draft.clear();
      form.markSaved();
      setEditorOpen(false);
    } catch (er) {
      setErr(toUserFacingErrorMessage(er));
    } finally {
      setSaving(false);
    }
  }

  if (!canQuery) {
    return (
      <p className="text-sm text-brand-muted">
        {sessionToken === undefined ? "Loading…" : "You need an admin session."}
      </p>
    );
  }

  if (status === "LoadingFirstPage") {
    return <p className="text-sm text-brand-muted">Loading…</p>;
  }

  const list = results as Post[];

  return (
    <div className="space-y-6">
      <QueryErrorBanner error={listError} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden />
          New post
        </Button>
        <MoreMenu
          items={[
            { label: "Upload many posts from a spreadsheet", onSelect: () => setBulkOpen(true) },
            process.env.NODE_ENV === "development" && {
              label: "Seed sample posts (developer only)",
              onSelect: () => void runSeedPosts(),
            },
          ]}
        />
        <p className="text-xs text-slate-500">
          Tip: press Ctrl+Enter (Cmd+Enter on Mac) while writing to save the post.
        </p>
      </div>

      {listErr ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {listErr}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className="whitespace-nowrap border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
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
                    <span
                      className={cn(
                        "ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        p.kind === "blog"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {p.kind === "blog" ? "Blog" : "Guide"}
                    </span>
                  </span>
                  <span className="block text-xs font-normal text-slate-400">
                    <span className="sr-only">Web address: </span>/blog/{p.slug}
                  </span>
                </td>
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
                      void togglePublished(p._id, !p.published)
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
                    <IconAction
                      label="Edit post"
                      icon={Pencil}
                      tone="neutral"
                      onClick={() => openEdit(p)}
                    />
                    <IconActionLink href={`/blog/${p.slug}`} label="View post on site" icon={Eye} />
                    <IconAction
                      label="Delete post"
                      onClick={() => {
                        if (confirm(`Delete "${p.title}"? This cannot be undone.`)) {
                          void removePost(p._id);
                        }
                      }}
                    />
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

      {status !== "Exhausted" ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            disabled={status !== "CanLoadMore"}
            onClick={() => loadMore(PAGE_SIZE)}
          >
            {status === "LoadingMore" ? "Loading…" : "Load more posts"}
          </Button>
        </div>
      ) : null}

      <Modal
        open={editorOpen}
        onClose={closeEditor}
        confirmClose={dirty}
        title={editingId ? "Edit post" : "New post"}
        description="Write your post below. Switch on “Published” when it is ready to go live."
        panelClassName="max-w-3xl"
      >
        <form noValidate onSubmit={onSave} className="space-y-3">
          <RequiredFieldsNote />
          {draft.restorable && !dirty ? (
            <DraftRestoreBanner
              savedAt={draft.restorable.savedAt}
              onRestore={() => {
                form.setValues(draft.restorable!.data);
                draft.dismiss();
              }}
              onDiscard={draft.clear}
            />
          ) : null}
          {err ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {err}
            </p>
          ) : null}
          <AdminField
            label="Type"
            htmlFor="blog-post-kind"
            tip="Guides are lasting travel guides, listed under Guides. Blog posts are news and stories, listed under Blog. The post's own web address is the same either way."
          >
            <select
              id="blog-post-kind"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={values.kind}
              onChange={(e) => setField("kind", e.target.value === "blog" ? "blog" : "guide")}
            >
              <option value="guide">Guide — shown under “Guides”</option>
              <option value="blog">Blog post — shown under “Blog”</option>
            </select>
          </AdminField>
          <AdminField
            label="Title"
            htmlFor={req.id("title")}
            required
            tip="The post headline, shown at the top of the article and in the list of posts."
            error={req.errorFor("title")}
          >
            <input
              {...req.fieldProps("title")}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="e.g. Best time to visit Hunza Valley"
              value={values.title}
              onChange={(e) => setField("title", e.target.value)}
            />
          </AdminField>
          <AdminField
            label="Content"
            htmlFor={req.id("content")}
            required
            tip="The full article body shown on the post page."
            hint="Just type normally. Leave an empty line between paragraphs — each block becomes its own paragraph on the website."
            error={req.errorFor("content")}
          >
            <textarea
              {...req.fieldProps("content")}
              rows={14}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm leading-relaxed"
              placeholder="e.g. Hunza is at its best from April to October, when the apricot blossoms and autumn colours draw visitors..."
              value={values.content}
              onChange={(e) => setField("content", e.target.value)}
            />
          </AdminField>
          <AdvancedSection forceOpen={Boolean(err && /slug|address/i.test(err))}>
            <AdminField
              label="Web address (auto from title)"
              htmlFor="blog-editor-slug"
              tip="The end of the post's web address, e.g. /blog/best-time-to-visit-hunza. Changing it later breaks old links to the post."
              hint="Leave blank to build it from the title."
            >
              <input
                id="blog-editor-slug"
                aria-describedby="blog-editor-slug-hint"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g. best-time-to-visit-hunza"
                value={values.slug}
                onChange={(e) => setField("slug", e.target.value)}
              />
            </AdminField>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField
                label="Google title"
                htmlFor="blog-editor-meta-title"
                tip="The title Google shows in search results. Leave blank to use the post title."
                hint="Keep it under 60 characters."
              >
                <input
                  id="blog-editor-meta-title"
                  aria-describedby="blog-editor-meta-title-hint"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g. Best Time to Visit Hunza | JunketTours"
                  value={values.metaTitle}
                  onChange={(e) => setField("metaTitle", e.target.value)}
                />
              </AdminField>
              <AdminField
                label="Google summary"
                htmlFor="blog-editor-meta-description"
                tip="The short summary Google shows under the title in search results."
                hint="Aim for 120-160 characters."
              >
                <input
                  id="blog-editor-meta-description"
                  aria-describedby="blog-editor-meta-description-hint"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g. Month-by-month guide to Hunza weather, blossoms and autumn colours."
                  value={values.metaDescription}
                  onChange={(e) => setField("metaDescription", e.target.value)}
                />
              </AdminField>
            </div>
          </AdvancedSection>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-brand-ink">
                Published
              </span>
              <span className="text-xs text-slate-500">
                When on, the post is visible on the website (Guides or Blog, by its type).
              </span>
            </span>
            <button
              type="button"
              className={cn(
                "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                values.published ? "bg-emerald-500" : "bg-slate-300",
              )}
              role="switch"
              aria-checked={values.published}
              onClick={() => setField("published", !values.published)}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow transition",
                  values.published ? "translate-x-6" : "translate-x-0.5",
                )}
              />
            </button>
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button id="blog-editor-save" type="submit" {...req.submitProps} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create post"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (confirmDiscard(dirty)) closeEditor();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Upload many posts from a spreadsheet"
        description="Upload an Excel (.xlsx) or .json file with one post per row. Rows with the same web address as an existing post update that post; new ones are added. Empty Google title / summary cells keep the current text."
        templateHint={
          <div className="space-y-1">
            <p className="font-semibold">Spreadsheet columns</p>
            <p className="font-mono text-xs">
              title, slug, content, metaTitle, metaDescription, published
            </p>
            <p className="text-xs text-slate-600">
              “slug” is the web address, “metaTitle” / “metaDescription” are the Google title and
              summary, and “published” is yes or no.
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
            importBatch: async (batch) => {
              if (typeof sessionToken !== "string") throw new Error("Not authenticated");
              return bulkUpsert({ sessionToken, rows: batch });
            },
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
