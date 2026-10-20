import { AdminBlogPanel } from "@/components/admin/AdminBlogPanel";

export default function AdminBlogPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Blog</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Write travel guides and blog posts for your website. Posts stay hidden until you switch
        on “Published”.
      </p>
      <div className="mt-8">
        <AdminBlogPanel />
      </div>
    </main>
  );
}
