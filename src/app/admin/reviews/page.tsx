import { AdminReviewsPanel } from "@/components/admin/AdminReviewsPanel";

export default function AdminReviewsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Tour reviews</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Reviews written by your customers. Approved reviews appear on the tour page and count
        towards its star rating.
      </p>
      <div className="mt-8">
        <AdminReviewsPanel />
      </div>
    </main>
  );
}
