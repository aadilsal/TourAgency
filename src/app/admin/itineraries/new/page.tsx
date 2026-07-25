import { AdminItinerarySimpleBuilder } from "@/components/admin/AdminItinerarySimpleBuilder";

type Props = {
  searchParams: {
    sourceKind?: string;
    sourceBookingId?: string;
    sourceTourId?: string;
    clientName?: string;
    title?: string;
  };
};

export default function AdminNewItineraryPage({ searchParams }: Props) {
  const sourceBookingId =
    searchParams.sourceKind === "user" ? searchParams.sourceBookingId : undefined;
  const sourceGuestBookingId =
    searchParams.sourceKind === "guest" ? searchParams.sourceBookingId : undefined;

  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Create itinerary</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Fill the form on the left — your PDF updates live on the right. Progress autosaves after you create the draft.
      </p>
      <div className="mt-8">
        <AdminItinerarySimpleBuilder
          initialTitle={searchParams.title}
          initialClientName={searchParams.clientName}
          sourceTourId={searchParams.sourceTourId}
          sourceBookingId={sourceBookingId}
          sourceGuestBookingId={sourceGuestBookingId}
        />
      </div>
    </main>
  );
}

