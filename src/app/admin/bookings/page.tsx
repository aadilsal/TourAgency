import { AdminBookingsTable } from "@/components/admin/AdminBookingsTable";

export default function AdminBookingsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Bookings</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Bookings and tour change requests from your customers. Update where each one stands,
        keep private notes, or turn it into an itinerary.
      </p>
      <div className="mt-8">
        <AdminBookingsTable />
      </div>
    </main>
  );
}
