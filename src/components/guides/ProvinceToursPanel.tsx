import Link from "next/link";
import { TourCardCompact } from "@/components/shared/TourCard";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Tour = {
  slug: string;
  title: string;
  description: string;
  price: number;
  durationDays: number;
  location: string;
  images: string[];
};

type Props = {
  provinceSlug: string;
  provinceName: string;
  tours: Tour[];
};

export function ProvinceToursPanel({ provinceSlug, provinceName, tours }: Props) {
  return (
    <Card className="sticky top-24 p-5 md:p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">
        Tours in {provinceName}
      </h2>
      <p className="mt-1 text-sm text-muted">
        Book directly — same flow as our main tour catalog.
      </p>
      {tours.length > 0 ? (
        <div className="mt-5 space-y-4">
          {tours.slice(0, 6).map((t) => (
            <TourCardCompact
              key={t.slug}
              tour={{
                slug: t.slug,
                title: t.title,
                description: t.description,
                price: t.price,
                durationDays: t.durationDays,
                location: t.location,
                images: t.images,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-havezic-background-light/50 p-5 text-sm text-muted">
          <p>No fixed departures tagged for {provinceName} yet.</p>
          <p className="mt-2">
            We can build a custom heritage plan — chat with us or use the AI planner.
          </p>
        </div>
      )}
      <div className="mt-5 flex flex-col gap-2">
        <ButtonLink href={`/tours?province=${provinceSlug}`} variant="primary" className="w-full">
          All {provinceName} tours
        </ButtonLink>
        <ButtonLink href="/ai-planner" variant="secondary" className="w-full">
          Plan with AI
        </ButtonLink>
        <Link
          href="/tours"
          className="text-center text-sm font-semibold text-havezic-primary hover:underline"
        >
          Browse all tours
        </Link>
      </div>
    </Card>
  );
}
