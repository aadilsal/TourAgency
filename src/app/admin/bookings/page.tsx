import { AdminBookingsTable } from "@/components/admin/AdminBookingsTable";

export default function AdminBookingsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Customisation requests</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Tour customisation requests from guests and members. Filter pending or
        confirmed.
      </p>
      <div className="mt-8">
        <AdminBookingsTable />
      </div>
    </main>
  );
}
