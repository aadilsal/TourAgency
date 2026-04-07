import { AdminBlogPanel } from "@/components/admin/AdminBlogPanel";

export default function AdminBlogPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Blog</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Editor in a modal, publish toggle on the list and in the editor. Drafts
        stay private.
      </p>
      <div className="mt-8">
        <AdminBlogPanel />
      </div>
    </main>
  );
}
