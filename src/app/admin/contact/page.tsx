import { AdminContactPanel } from "@/components/admin/AdminContactPanel";

export default function AdminContactPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Leads</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Incoming contact messages and enquiries. Track follow-up status and keep
        internal notes.
      </p>
      <div className="mt-8">
        <AdminContactPanel />
      </div>
    </main>
  );
}
