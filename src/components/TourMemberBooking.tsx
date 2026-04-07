"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import {
  FieldLabel,
  FieldHint,
  TextInput,
  TextAreaField,
} from "@/components/ui/FormField";

export function TourMemberBooking({
  tourId,
  plain = false,
}: {
  tourId: Id<"tours">;
  plain?: boolean;
}) {
  const router = useRouter();
  const sessionToken = useConvexSessionToken();
  const createBooking = useMutation(api.bookings.createBooking);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [preferredStart, setPreferredStart] = useState("");
  const [preferredEnd, setPreferredEnd] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (sessionToken === undefined || sessionToken === null) return null;

  const token = sessionToken;
  const peopleCount = Math.max(0, adults) + Math.max(0, children);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (peopleCount < 1 || adults < 1) {
      setErr("Enter at least one adult traveler.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      await createBooking({
        sessionToken: token,
        tourId,
        peopleCount,
        notes: notes.trim() || undefined,
        preferredStart: preferredStart.trim() || undefined,
        preferredEnd: preferredEnd.trim() || undefined,
        departureCity: departureCity.trim() || undefined,
        adults: adults > 0 ? adults : undefined,
        children: children > 0 ? children : undefined,
        specialNeeds: specialNeeds.trim() || undefined,
      });
      setNotes("");
      router.push("/dashboard/bookings");
    } catch (er) {
      setErr(toUserFacingErrorMessage(er));
    } finally {
      setLoading(false);
    }
  }

  const wrap = plain
    ? "space-y-3"
    : "mt-8 rounded-2xl border border-white/20 bg-white/90 p-6 shadow-glass backdrop-blur-glass";

  return (
    <div className={wrap}>
      <h2 className="text-base font-bold text-brand-ink">Book as a member</h2>
      <p className="text-xs text-brand-muted">
        Per-person rate × party size. Submitted as pending until confirmed.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel htmlFor="mb-adults" required>
              Adults
            </FieldLabel>
            <TextInput
              id="mb-adults"
              type="number"
              min={1}
              value={adults}
              onChange={(e) =>
                setAdults(Number.parseInt(e.target.value, 10) || 0)
              }
            />
          </div>
          <div>
            <FieldLabel htmlFor="mb-children">Children</FieldLabel>
            <TextInput
              id="mb-children"
              type="number"
              min={0}
              value={children}
              onChange={(e) =>
                setChildren(Number.parseInt(e.target.value, 10) || 0)
              }
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">Total: {peopleCount} travelers</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel htmlFor="mb-start">Start date</FieldLabel>
            <TextInput
              id="mb-start"
              type="date"
              value={preferredStart}
              onChange={(e) => setPreferredStart(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="mb-end">End date</FieldLabel>
            <TextInput
              id="mb-end"
              type="date"
              value={preferredEnd}
              onChange={(e) => setPreferredEnd(e.target.value)}
            />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="mb-city">Departure city</FieldLabel>
          <TextInput
            id="mb-city"
            placeholder="e.g. Islamabad"
            value={departureCity}
            onChange={(e) => setDepartureCity(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="mb-special">Special needs</FieldLabel>
          <TextAreaField
            id="mb-special"
            rows={2}
            value={specialNeeds}
            onChange={(e) => setSpecialNeeds(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="mb-notes">Notes</FieldLabel>
          <TextAreaField
            id="mb-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <FieldHint>Optional requests for the team.</FieldHint>
        </div>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-50"
        >
          {loading ? "Booking…" : "Confirm booking"}
        </button>
      </form>
    </div>
  );
}
