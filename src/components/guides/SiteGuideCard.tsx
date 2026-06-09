import Link from "next/link";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import type { SiteType } from "@/lib/sites-data";

const TYPE_LABELS: Record<SiteType, string> = {
  historical: "Historical",
  cultural: "Cultural",
  natural: "Natural",
  adventure: "Adventure",
};

const TYPE_STYLES: Record<SiteType, string> = {
  historical: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  cultural: "bg-violet-500/15 text-violet-800 dark:text-violet-200",
  natural: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  adventure: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
};

type Props = {
  name: string;
  type: SiteType;
  summary: string;
  history: string;
  city?: string;
  era?: string;
  unesco?: boolean;
  destinationSlug?: string;
  className?: string;
};

export function SiteGuideCard({
  name,
  type,
  summary,
  history,
  city,
  era,
  unesco,
  destinationSlug,
  className,
}: Props) {
  return (
    <Card className={cn("p-6 md:p-7", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                TYPE_STYLES[type],
              )}
            >
              {TYPE_LABELS[type]}
            </span>
            {unesco ? (
              <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-blue-800 dark:text-blue-200">
                UNESCO
              </span>
            ) : null}
            {era ? (
              <span className="text-xs font-medium text-muted">{era}</span>
            ) : null}
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            {name}
          </h3>
          {city ? (
            <p className="mt-1 text-sm text-muted">{city}</p>
          ) : null}
        </div>
        {destinationSlug ? (
          <Link
            href={`/destinations/${destinationSlug}`}
            className="shrink-0 text-sm font-semibold text-havezic-primary hover:underline"
          >
            City tours →
          </Link>
        ) : null}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
        {summary}
      </p>
      <div className="mt-4 text-sm leading-relaxed text-foreground/90 md:text-base">
        {history}
      </div>
    </Card>
  );
}
