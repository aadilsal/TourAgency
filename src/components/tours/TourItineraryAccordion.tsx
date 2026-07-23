"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type Day = { day: number; title: string; description: string };

export function TourItineraryAccordion({ itinerary }: { itinerary: Day[] }) {
  // First day open by default, like the Intrepid reference.
  const [open, setOpen] = useState<Set<number>>(new Set([itinerary[0]?.day]));

  function toggle(day: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  return (
    <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-panel">
      {itinerary.map((d) => {
        const isOpen = open.has(d.day);
        return (
          <li key={d.day}>
            <button
              type="button"
              onClick={() => toggle(d.day)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-panel-elevated md:px-6"
            >
              <span className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-havezic-primary/12 text-xs font-bold text-havezic-primary">
                  {d.day}
                </span>
                <span className="font-semibold text-foreground">
                  Day {d.day} · {d.title}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted transition-transform",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {isOpen ? (
              <div className="px-5 pb-5 md:px-6">
                <p className="whitespace-pre-wrap pl-11 text-sm leading-relaxed text-muted">
                  {d.description}
                </p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
