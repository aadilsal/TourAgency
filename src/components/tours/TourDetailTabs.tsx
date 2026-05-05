"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";

type Tab = { id: string; label: string };

const DEFAULT_TABS: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "tour-plan", label: "Tour plan" },
  { id: "location", label: "Location" },
  { id: "reviews", label: "Reviews" },
];

export function TourDetailTabs({
  tabs = DEFAULT_TABS,
  className,
}: {
  tabs?: Tab[];
  className?: string;
}) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "overview");

  const ids = useMemo(() => tabs.map((t) => t.id), [tabs]);

  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // pick the top-most visible section (stable)
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).offsetTop -
              (b.target as HTMLElement).offsetTop,
          );
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      {
        root: null,
        rootMargin: "-25% 0px -65% 0px",
        threshold: [0, 0.1, 0.25],
      },
    );

    for (const el of els) obs.observe(el);
    return () => obs.disconnect();
  }, [ids]);

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-2",
        "rounded-2xl border border-border bg-background/70 p-2 backdrop-blur-sm",
        className,
      )}
      aria-label="Tour sections"
    >
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <a
            key={t.id}
            href={`#${t.id}`}
            className={cn(
              "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
              active
                ? "bg-brand-cta text-white shadow-sm"
                : "bg-transparent text-muted hover:bg-panel-elevated hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}

