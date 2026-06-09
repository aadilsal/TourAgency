"use client";

import { useMemo, useState } from "react";
import { SiteGuideCard } from "./SiteGuideCard";
import type { ProvinceSiteRow } from "@/lib/provinces-server";
import type { SiteType } from "@/lib/sites-data";
import { cn } from "@/lib/cn";

const TABS: Array<{ id: "all" | SiteType; label: string }> = [
  { id: "all", label: "All" },
  { id: "historical", label: "Historical" },
  { id: "cultural", label: "Cultural" },
  { id: "natural", label: "Natural" },
  { id: "adventure", label: "Adventure" },
];

export function ProvinceSitesSection({ sites }: { sites: ProvinceSiteRow[] }) {
  const [tab, setTab] = useState<"all" | SiteType>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return sites;
    return sites.filter((s) => s.type === tab);
  }, [sites, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: sites.length };
    for (const s of sites) {
      c[s.type] = (c[s.type] ?? 0) + 1;
    }
    return c;
  }, [sites]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = counts[t.id] ?? 0;
          if (t.id !== "all" && count === 0) return null;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                tab === t.id
                  ? "border-havezic-primary bg-havezic-primary text-white"
                  : "border-border bg-background text-foreground hover:border-havezic-primary/40",
              )}
            >
              {t.label}
              <span className="ml-1.5 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>
      <div className="mt-8 space-y-6">
        {filtered.map((site) => (
          <SiteGuideCard
            key={site.slug}
            name={site.name}
            type={site.type}
            summary={site.summary}
            history={site.history}
            city={site.city}
            era={site.era}
            unesco={site.unesco}
            destinationSlug={site.destinationSlug}
          />
        ))}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted">No sites in this category yet.</p>
        ) : null}
      </div>
    </div>
  );
}
