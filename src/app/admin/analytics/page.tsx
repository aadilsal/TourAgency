import { AdminAnalyticsClient } from "@/components/admin/AdminAnalyticsClient";

export default function AdminAnalyticsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Analytics</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Cards for total bookings, leads, and revenue (confirmed only), plus
        detailed counts.
      </p>
      <div className="mt-8">
        <AdminAnalyticsClient />
      </div>
    </main>
  );
}
