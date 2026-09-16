"use client";

import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput } from "@/components/ui/FormField";
import type { PackageStay } from "@/lib/itineraryPackageMatrix";
import {
  blankPackageTier,
  type EditablePackageTier,
} from "@/components/admin/itinerary/itineraryModel";

type Updater = (updater: (prev: EditablePackageTier[]) => EditablePackageTier[]) => void;

/** Controlled editor for package tiers and their per-tier stay rows. */
export function PackageTiersEditor({
  tiers,
  onChange,
  defaultNights,
}: {
  tiers: EditablePackageTier[];
  onChange: Updater;
  /** Nights prefilled into newly added stay rows. */
  defaultNights: number;
}) {
  const updateTier = (tIdx: number, patch: Partial<EditablePackageTier>) =>
    onChange((prev) => prev.map((x, i) => (i === tIdx ? { ...x, ...patch } : x)));

  const updateStay = (tIdx: number, ri: number, patch: Partial<PackageStay>) =>
    onChange((prev) =>
      prev.map((x, i) => {
        if (i !== tIdx) return x;
        const stays = [...x.stays];
        const cur = stays[ri] ?? { location: "", hotel: "", nights: 1 };
        stays[ri] = { ...cur, ...patch };
        return { ...x, stays };
      }),
    );

  return (
    <div className="mt-4 space-y-6">
      {tiers.map((tier, tIdx) => (
        <div key={tIdx} className="rounded-xl border border-border bg-panel p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[120px] flex-1">
              <FieldLabel>Tier name</FieldLabel>
              <TextInput value={tier.name} onChange={(e) => updateTier(tIdx, { name: e.target.value })} />
            </div>
            <div className="w-28">
              <FieldLabel>PKR</FieldLabel>
              <TextInput
                type="number"
                min={0}
                value={tier.pricePkr ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = Number(raw);
                  // Empty input clears the price instead of saving 0.
                  updateTier(tIdx, { pricePkr: raw === "" || !Number.isFinite(n) ? undefined : n });
                }}
              />
            </div>
            <div className="min-w-[100px] flex-1">
              <FieldLabel>Vehicle (optional)</FieldLabel>
              <TextInput
                value={tier.vehicle ?? ""}
                onChange={(e) => updateTier(tIdx, { vehicle: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                onChange((prev) => {
                  const src = prev[tIdx];
                  if (!src) return prev;
                  const next = [...prev];
                  next.splice(tIdx + 1, 0, {
                    ...src,
                    name: src.name ? `${src.name} (copy)` : "",
                    stays: src.stays.map((s) => ({ ...s })),
                  });
                  return next;
                })
              }
            >
              Duplicate tier
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="border-red-500/40 text-red-600 hover:border-red-400/60 hover:bg-red-500/10"
              disabled={tiers.length <= 1}
              onClick={() => {
                const label = tier.name.trim() || `tier ${tIdx + 1}`;
                if (!window.confirm(`Remove ${label} and its hotel rows?`)) return;
                onChange((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== tIdx)));
              }}
            >
              Remove tier
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            <div className="hidden md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_96px_56px] md:gap-2 md:text-xs md:font-bold md:uppercase md:tracking-wide md:text-muted">
              <div>Location</div>
              <div>Hotel</div>
              <div>Nights</div>
              <div />
            </div>

            <div className="flex items-center justify-between gap-2">
              <FieldLabel className="text-xs uppercase tracking-wide text-muted">Stay rows</FieldLabel>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  onChange((prev) =>
                    prev.map((x, i) =>
                      i === tIdx
                        ? {
                            ...x,
                            stays: [
                              ...x.stays,
                              { location: "", hotel: "", nights: Math.max(1, defaultNights) },
                            ],
                          }
                        : x,
                    ),
                  )
                }
              >
                + Add row
              </Button>
            </div>

            {tier.stays.map((row, ri) => (
              <div
                key={ri}
                className="rounded-xl border border-border/60 bg-panel p-3 md:rounded-none md:border-0 md:bg-transparent md:p-0"
              >
                <div className="grid gap-2 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_96px_56px] md:items-start">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted md:hidden">Location</p>
                    <TextInput
                      value={row.location}
                      onChange={(e) => updateStay(tIdx, ri, { location: e.target.value })}
                      placeholder="e.g. Skardu"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted md:hidden">Hotel</p>
                    <TextInput
                      value={row.hotel}
                      onChange={(e) => updateStay(tIdx, ri, { hotel: e.target.value })}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted md:hidden">Nights</p>
                    <TextInput
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={row.nights}
                      onChange={(e) =>
                        updateStay(tIdx, ri, { nights: Math.max(1, Number(e.target.value) || 1) })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    {tier.stays.length > 1 ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600"
                        onClick={() =>
                          onChange((prev) =>
                            prev.map((x, i) =>
                              i === tIdx ? { ...x, stays: x.stays.filter((_, s) => s !== ri) } : x,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    ) : (
                      <span className="hidden md:block" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2">
            <FieldLabel>Note (optional)</FieldLabel>
            <TextInput value={tier.note ?? ""} onChange={(e) => updateTier(tIdx, { note: e.target.value })} />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => onChange((prev) => [...prev, blankPackageTier(defaultNights)])}
      >
        + Add package tier
      </Button>
    </div>
  );
}
