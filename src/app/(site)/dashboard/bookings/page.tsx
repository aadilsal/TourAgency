import type { Metadata } from "next";
import { DashboardBookings } from "@/components/DashboardBookings";

// robots noindex is inherited from dashboard/layout.tsx
export const metadata: Metadata = { title: "My Bookings" };

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
