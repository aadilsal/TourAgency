"use client";

import { buildItineraryWordBlob } from "@/documents/itinerary/ItineraryWord";
import { ItineraryExportRunner } from "@/components/admin/itinerary/ItineraryExportRunner";

export function AdminItineraryWordDownload({ itineraryId }: { itineraryId: string }) {
  return (
    <ItineraryExportRunner itineraryId={itineraryId} kind="docx" build={buildItineraryWordBlob} />
  );
}
