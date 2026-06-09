import Link from "next/link";
import { Card } from "@/components/ui/Card";

type Destination = {
  slug: string;
  name: string;
  line: string;
};

export function ProvinceCityDestinations({
  destinations,
  provinceName,
}: {
  destinations: Destination[];
  provinceName: string;
}) {
  if (destinations.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        City tour hubs in {provinceName}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
        Deeper tour listings and booking for specific cities — linked from this province guide.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((d) => (
          <Link key={d.slug} href={`/destinations/${d.slug}`}>
            <Card hover className="h-full p-5">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {d.name}
              </h3>
              <p className="mt-2 text-sm text-muted">{d.line}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-havezic-primary">
                View tours →
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
