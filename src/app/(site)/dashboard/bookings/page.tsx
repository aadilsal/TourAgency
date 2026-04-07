import { DashboardBookings } from "@/components/DashboardBookings";

export default function DashboardBookingsPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-white">
        Your bookings
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Switch between cards and table. Pending shows amber; confirmed shows
        green.
      </p>
      <DashboardBookings />
    </div>
  );
}
