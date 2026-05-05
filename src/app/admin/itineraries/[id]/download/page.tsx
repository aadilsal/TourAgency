import { AdminItineraryPdfDownload } from "@/components/admin/AdminItineraryPdfDownload";

export default function AdminItineraryDownloadPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <AdminItineraryPdfDownload itineraryId={params.id} />
    </main>
  );
}

