"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCurrency } from "@/hooks/useCurrency";
import { formatMoney } from "@/lib/money";
import { getTourUnitPrice } from "@/lib/tourPricing";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function ymd(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function TourCalendarPrices({
  price,
  pricePkr,
  priceUsd,
  className,
}: {
  price: number; // legacy PKR
  pricePkr?: number;
  priceUsd?: number;
  className?: string;
}) {
  const currency = useCurrency();
  const basePrice = useMemo(
    () => getTourUnitPrice({ price, pricePkr, priceUsd }, currency),
    [price, pricePkr, priceUsd, currency],
  );
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const grid = useMemo(() => {
    const first = startOfMonth(month);
    const last = endOfMonth(month);

    // Monday as start-of-week
    const jsDow = first.getDay(); // 0 Sun..6 Sat
    const mondayIndex = (jsDow + 6) % 7; // 0 Mon..6 Sun
    const daysInMonth = last.getDate();

    const cells: Array<{ date: Date | null; price?: number }> = [];
    for (let i = 0; i < mondayIndex; i++) cells.push({ date: null });

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(first.getFullYear(), first.getMonth(), d);
      // Simple deterministic price variation to mimic "from" labels in screenshot.
      const key = Number(ymd(date).replaceAll("-", ""));
      const tweak = ((key % 7) - 3) * 0.02; // -6%..+6%
      const price = Math.max(0, Math.round(basePrice * (1 + tweak)));
      cells.push({ date, price });
    }

    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [month, basePrice]);

  const monthLabel = month.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-panel p-6 shadow-sm md:p-8",
        className,
      )}
      aria-label="Calendar and prices"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-foreground">Calendar & Prices</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-panel-elevated text-foreground transition hover:bg-panel"
            aria-label="Previous month"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-panel-elevated text-foreground transition hover:bg-panel"
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-background">
        <div className="grid grid-cols-7 border-b border-border bg-brand-primary/10">
          {DOW.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-xs font-bold uppercase tracking-wide text-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((cell, i) => {
            if (!cell.date) {
              return (
                <div
                  key={`e-${i}`}
                  className="min-h-[64px] border-b border-r border-border/70 bg-background"
                />
              );
            }

            const isFirstRow = i < 7;
            const isLastRow = i >= grid.length - 7;
            const borderBottom = isLastRow ? "" : "border-b border-border/70";
            const borderRight = (i + 1) % 7 === 0 ? "" : "border-r border-border/70";

            return (
              <div
                key={ymd(cell.date)}
                className={cn(
                  "min-h-[64px] bg-background px-2 py-2",
                  borderBottom,
                  borderRight,
                  isFirstRow ? "" : "",
                )}
              >
                <div className="text-xs font-semibold text-muted">
                  {cell.date.getDate()}
                </div>
                <div className="mt-1 text-xs font-bold text-brand-cta">
                  {formatMoney(cell.price ?? 0, currency)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-sm text-muted">
        <span className="font-semibold text-foreground">{monthLabel}</span>{" "}
        availability and “from” prices.
      </p>
    </section>
  );
}

