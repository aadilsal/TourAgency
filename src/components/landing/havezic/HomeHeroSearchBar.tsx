"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Users, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { DESTINATIONS_INDEX } from "@/lib/destinations-data";

function FieldShell({
  icon: Icon,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 px-5 py-3",
        className,
      )}
    >
      <Icon className="h-5 w-5 shrink-0 text-havezic-text-light" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function HomeHeroSearchBar() {
  const router = useRouter();
  const [where, setWhere] = useState("");
  const [type, setType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [guests, setGuests] = useState("2");

  const destinationOptions = useMemo(() => {
    return DESTINATIONS_INDEX.map((d) => ({ slug: d.slug, name: d.name }));
  }, []);

  const typeOptions = useMemo(
    () => [
      { value: "", label: "All Activity" },
      { value: "family", label: "Family" },
      { value: "honeymoon", label: "Honeymoon" },
      { value: "adventure", label: "Adventure" },
      { value: "corporate", label: "Corporate" },
      { value: "budget", label: "Budget" },
    ],
    [],
  );

  return (
    <form
      className="mx-auto w-full max-w-5xl"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (where.trim()) params.set("location", where.trim());
        if (type) params.set("type", type);
        if (dateFrom) params.set("from", dateFrom);
        const g = guests.replace(/\D/g, "");
        if (g) params.set("guests", g);
        const qs = params.toString();
        router.push(qs ? `/tours?${qs}` : "/tours");
      }}
      aria-label="Search tours"
    >
      <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_18px_48px_rgba(0,0,0,0.18)] ring-1 ring-black/10 md:rounded-full">
        <div className="grid items-stretch md:grid-cols-[1.15fr_1fr_1fr_0.9fr_auto]">
          <FieldShell icon={MapPin} className="border-b border-black/10 md:border-b-0 md:border-r md:border-black/10">
            <label className="block">
              <span className="block text-[11px] font-semibold text-havezic-text">
                Where to?
              </span>
              <input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                list="hero-destinations"
                placeholder="Any destination"
                className="mt-0.5 w-full bg-transparent text-sm font-semibold text-havezic-accent placeholder:text-havezic-text-light focus:outline-none"
              />
            </label>
            <datalist id="hero-destinations">
              {destinationOptions.map((d) => (
                <option key={d.slug} value={d.name} />
              ))}
            </datalist>
          </FieldShell>

          <FieldShell icon={Search} className="border-b border-black/10 md:border-b-0 md:border-r md:border-black/10">
            <label className="block">
              <span className="block text-[11px] font-semibold text-havezic-text">
                Activity
              </span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-0.5 w-full bg-transparent text-sm font-semibold text-havezic-accent focus:outline-none"
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </FieldShell>

          <FieldShell icon={CalendarDays} className="border-b border-black/10 md:border-b-0 md:border-r md:border-black/10">
            <label className="block">
              <span className="block text-[11px] font-semibold text-havezic-text">
                Date from
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-0.5 w-full bg-transparent text-sm font-semibold text-havezic-accent focus:outline-none"
              />
            </label>
          </FieldShell>

          <FieldShell icon={Users}>
            <label className="block">
              <span className="block text-[11px] font-semibold text-havezic-text">
                Guests
              </span>
              <input
                inputMode="numeric"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="mt-0.5 w-full bg-transparent text-sm font-semibold text-havezic-accent focus:outline-none"
              />
            </label>
          </FieldShell>

          <button
            type="submit"
            className="m-2 inline-flex items-center justify-center gap-2 rounded-full bg-havezic-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-havezic-primary-hover"
          >
            <Search className="h-4 w-4" aria-hidden />
            Search
          </button>
        </div>
      </div>
    </form>
  );
}

