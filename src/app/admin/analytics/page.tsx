import { AdminAnalyticsClient } from "@/components/admin/AdminAnalyticsClient";

export default function AdminAnalyticsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Analytics</h1>
      <p className="mt-1 text-sm text-zinc-500">
        A quick look at your bookings, enquiries and income. Income counts confirmed bookings
        only.
      </p>
      <div className="mt-8">
        <AdminAnalyticsClient />
      </div>
    </main>
  );
}
