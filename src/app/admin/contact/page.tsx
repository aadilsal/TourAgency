import { AdminContactPanel } from "@/components/admin/AdminContactPanel";

export default function AdminContactPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Contact</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Update public office/contact details and review incoming contact messages.
      </p>
      <div className="mt-8">
        <AdminContactPanel />
      </div>
    </main>
  );
}
