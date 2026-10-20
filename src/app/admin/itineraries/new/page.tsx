import { AdminItinerarySimpleBuilder } from "@/components/admin/LazyDocumentEditors";

type Props = {
  searchParams: {
    sourceKind?: string;
    sourceBookingId?: string;
    sourceTourId?: string;
    clientName?: string;
    title?: string;
    clientPhone?: string;
    clientEmail?: string;
    /** YYYY-MM-DD */
    startDate?: string;
    adults?: string;
    children?: string;
  };
};

/** A repeated query param arrives as an array; keep the first value. */
function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default function AdminNewItineraryPage({ searchParams }: Props) {
  const sp = searchParams as Record<string, string | string[] | undefined>;
  const sourceKind = one(sp.sourceKind);
  const bookingId = one(sp.sourceBookingId);
  const sourceBookingId = sourceKind === "user" ? bookingId : undefined;
  const sourceGuestBookingId = sourceKind === "guest" ? bookingId : undefined;

  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Create itinerary</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Fill the form on the left — your PDF updates live on the right. Progress autosaves after you create the draft.
      </p>
      <div className="mt-8">
        <AdminItinerarySimpleBuilder
          initialTitle={one(sp.title)}
          initialClientName={one(sp.clientName)}
          initialClientPhone={one(sp.clientPhone)}
          initialClientEmail={one(sp.clientEmail)}
          initialStartDate={one(sp.startDate)}
          initialAdults={one(sp.adults)}
          initialChildren={one(sp.children)}
          sourceTourId={one(sp.sourceTourId)}
          sourceBookingId={sourceBookingId}
          sourceGuestBookingId={sourceGuestBookingId}
        />
      </div>
    </main>
  );
}
