import { AdminItineraryWordDownload } from "@/components/admin/AdminItineraryWordDownload";

export default function AdminItineraryWordDownloadPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <AdminItineraryWordDownload itineraryId={params.id} />
    </main>
  );
}