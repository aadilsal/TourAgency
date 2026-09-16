"use client";

import { pdf } from "@react-pdf/renderer";
import { ItineraryPdf, type ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";
import { ItineraryExportRunner } from "@/components/admin/itinerary/ItineraryExportRunner";

function buildPdf(model: ItineraryPdfModel) {
  return pdf(<ItineraryPdf model={model} />).toBlob();
}

export function AdminItineraryPdfDownload({ itineraryId }: { itineraryId: string }) {
  return <ItineraryExportRunner itineraryId={itineraryId} kind="pdf" build={buildPdf} />;
}
