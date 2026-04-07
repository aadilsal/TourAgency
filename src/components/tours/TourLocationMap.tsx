"use client";

type Props = {
  location: string;
  title: string;
};

/** Google Maps embed via query (no API key). */
export function TourLocationMap({ location, title }: Props) {
  const q = encodeURIComponent(`${location.trim()}, Pakistan`);
  const src = `https://maps.google.com/maps?q=${q}&t=&z=10&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card ring-1 ring-slate-900/[0.04]">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-bold text-brand-ink">Where you&apos;ll go</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Approximate region for <span className="font-medium text-brand-ink">{title}</span>
        </p>
      </div>
      <div className="relative aspect-[16/10] min-h-[220px] w-full bg-slate-100">
        <iframe
          title={`Map: ${location}`}
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </div>
  );
}
