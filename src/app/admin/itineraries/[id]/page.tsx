import { AdminItineraryEditorGate } from "@/components/admin/LazyDocumentEditors";

export default function AdminItineraryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <AdminItineraryEditorGate itineraryId={params.id} />
    </main>
  );
}

