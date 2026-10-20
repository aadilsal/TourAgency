import { BedDouble, MessageCircle } from "lucide-react";

export type RouteStop = { place: string; nights: number };

/**
 * "Your route at a glance" — overnight stops under the itinerary map (the map
 * column is sticky, so this keeps the left side useful beside a long list of
 * days, like Intrepid / G Adventures do).
 */
export function TourRouteGlance({
  stops,
  durationDays,
  whatsappUrl,
}: {
  stops: RouteStop[];
  durationDays: number;
  whatsappUrl: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-panel p-5">
      <h3 className="font-bold text-foreground">Your route at a glance</h3>
      <p className="mt-1 text-sm text-muted">
        {durationDays} days
        {stops.length > 0 ? ` · ${stops.length} ${stops.length === 1 ? "stop" : "stops"}` : ""}
      </p>
      {stops.length > 0 ? (
        <ol className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm">
          {stops.map((s, i) => (
            <li key={`${s.place}-${i}`} className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-havezic-background-light px-3 py-1 font-semibold text-foreground">
                <BedDouble className="h-3.5 w-3.5 text-havezic-primary" aria-hidden />
                {s.place}
                <span className="font-normal text-muted">
                  · {s.nights} {s.nights === 1 ? "night" : "nights"}
                </span>
              </span>
              {i < stops.length - 1 ? (
                <span className="text-muted" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="mt-4 text-sm text-muted">
        Want more time somewhere, or a different hotel? Every trip can be adjusted.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href="#book"
          className="inline-flex min-h-10 items-center rounded-full bg-brand-cta px-4 py-2 text-sm font-bold text-white hover:brightness-110"
        >
          Customise this route
        </a>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-havezic-primary/40"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Ask on WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
