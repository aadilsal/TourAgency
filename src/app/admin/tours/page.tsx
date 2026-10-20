import { AdminToursPanel } from "@/components/admin/AdminToursPanel";

export default function AdminToursPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Tours</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Add, edit and publish the tours shown on your website.
      </p>
      <div className="mt-8">
        <AdminToursPanel />
      </div>
    </main>
  );
}
