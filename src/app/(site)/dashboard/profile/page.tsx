import { DashboardProfile } from "@/components/DashboardProfile";

export default function DashboardProfilePage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-white">
        Profile
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Keep your name and phone up to date for confirmations and linked guest
        bookings.
      </p>
      <DashboardProfile />
    </div>
  );
}
