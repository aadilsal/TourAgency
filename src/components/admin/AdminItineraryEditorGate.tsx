"use client";

import { AdminItinerarySimpleBuilder } from "@/components/admin/AdminItinerarySimpleBuilder";

/**
 * Every itinerary — including records made by the retired advanced wizard —
 * opens in the builder. The builder loads the record (with session-safe
 * loading/not-found states), migrates legacy day plans and packages without
 * dropping text, and shows any remaining old-editor fields read-only.
 */
export function AdminItineraryEditorGate({ itineraryId }: { itineraryId: string }) {
  return <AdminItinerarySimpleBuilder key={itineraryId} itineraryId={itineraryId} />;
}
