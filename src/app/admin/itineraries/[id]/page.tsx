import { AdminItineraryDetail } from "@/components/admin/AdminItineraryDetail";

export default function AdminItineraryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <AdminItineraryDetail itineraryId={params.id} />
    </main>
  );
}

