import { AdminBookingsTable } from "@/components/admin/AdminBookingsTable";

export default function AdminBookingsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Bookings</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Booking and tour customisation requests from guests and members. Update
        the status, keep internal notes, or create an itinerary.
      </p>
      <div className="mt-8">
        <AdminBookingsTable />
      </div>
    </main>
  );
}
