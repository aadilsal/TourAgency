"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { AdminItineraryWizard } from "@/components/admin/AdminItineraryWizard";
import { AdminItinerarySimpleBuilder } from "@/components/admin/AdminItinerarySimpleBuilder";

export function AdminItineraryEditorGate({ itineraryId }: { itineraryId: string }) {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";

  const itin = useQuery(
    api.itineraries.getForAdmin,
    canQuery
      ? { sessionToken, itineraryId: itineraryId as Id<"itineraries"> }
      : "skip",
  );

  if (!canQuery) {
    return (
      <p className="text-sm text-muted">
        {sessionToken === undefined ? "Loading session…" : "Sign in required."}
      </p>
    );
  }

  if (itin === undefined) {
    return <p className="text-sm text-muted">Loading itinerary…</p>;
  }

  if (!itin) {
    return <p className="text-sm text-muted">Itinerary not found.</p>;
  }

  const useLegacyWizard = itin.layoutVariant === "advanced";

  if (useLegacyWizard) {
    return <AdminItineraryWizard itineraryId={itineraryId} />;
  }

  return <AdminItinerarySimpleBuilder itineraryId={itineraryId} />;
}
