import { AdminItineraryPdfDownload } from "@/components/admin/LazyDocumentEditors";

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

