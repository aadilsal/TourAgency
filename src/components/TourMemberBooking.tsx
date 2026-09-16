"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { todayYmdLocal } from "@/lib/todayYmdLocal";
import {
  FieldError,
  FieldLabel,
  FieldHint,
  FormAlert,
  TextInput,
  TextAreaField,
  fieldErrorId,
  fieldErrorProps,
} from "@/components/ui/FormField";
import type { TourCustomisationMessageInput } from "@/lib/tourCustomisationWhatsApp";
import {
  focusFirstError,
  shortRef,
  thankYouHref,
  type FieldErrorMap,
} from "@/lib/formValidation";

type MemberField = "adults" | "children" | "start" | "end";

export function TourMemberBooking({
  tourId,
  tourTitle,
  memberName,
  memberPhone,
  memberEmail,
  plain = false,
  bookable = false,
  onCustomisationSubmitted,
}: {
  tourId: Id<"tours">;
  tourTitle: string;
  memberName: string;
  memberPhone?: string;
  memberEmail?: string;
  plain?: boolean;
  /** True when the tour has a public price — labels the CTA "Book now". */
  bookable?: boolean;
  /**
   * Called after the booking is saved. `ref` is a short booking reference to
   * show on the confirmation page.
   */
  onCustomisationSubmitted?: (
    input: TourCustomisationMessageInput,
    ref?: string,
  ) => void | Promise<void>;
}) {
  const router = useRouter();
  const sessionToken = useConvexSessionToken();
  const minDate = todayYmdLocal();
  const createBooking = useMutation(api.bookings.createBooking);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [preferredStart, setPreferredStart] = useState("");
  const [preferredEnd, setPreferredEnd] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap<MemberField>>({});
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  if (sessionToken === undefined || sessionToken === null) return null;

  const token = sessionToken;
  const peopleCount = Math.max(0, adults) + Math.max(0, children);

  function clearFieldError(field: MemberField) {
    setFieldErrors((x) => ({ ...x, [field]: undefined }));
  }

  function validate() {
    const next: FieldErrorMap<MemberField> = {};
    if (adults < 1) next.adults = "Enter at least one adult traveler.";
    if (children < 0) next.children = "Children can't be negative.";
    if (preferredStart && preferredStart < minDate) {
      next.start = "Past dates can't be selected.";
    }
    if (preferredEnd && preferredEnd < minDate) {
      next.end = "Past dates can't be selected.";
    } else if (preferredStart && preferredEnd && preferredEnd < preferredStart) {
      next.end = "End date must be on or after the start date.";
    }
    setFieldErrors(next);
    focusFirstError([
      next.adults && "mb-adults",
      next.children && "mb-children",
      next.start && "mb-start",
      next.end && "mb-end",
    ]);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setErr(null);
    if (!validate()) return;
    submittingRef.current = true;
    setLoading(true);
    let bookingId: string;
    try {
      bookingId = await createBooking({
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
    } catch (er) {
      setErr(toUserFacingErrorMessage(er));
      submittingRef.current = false;
      setLoading(false);
      return;
    }
    const ref = shortRef(bookingId);
    const messageInput: TourCustomisationMessageInput = {
      tourTitle,
      name: memberName,
      phone: memberPhone?.trim() || "—",
      email: memberEmail,
      preferredStart: preferredStart.trim() || undefined,
      preferredEnd: preferredEnd.trim() || undefined,
      peopleCount,
      notes: notes.trim() || undefined,
      departureCity: departureCity.trim() || undefined,
      adults: adults > 0 ? adults : undefined,
      children: children > 0 ? children : undefined,
    };
    // Saved: stay in the pending state while we hand off / redirect.
    if (onCustomisationSubmitted) {
      await onCustomisationSubmitted(messageInput, ref);
    } else {
      router.push(thankYouHref("booking", ref));
    }
  }

  const wrap = plain
    ? "space-y-3"
    : "mt-8 rounded-2xl border border-white/20 bg-white/90 p-6 shadow-glass backdrop-blur-glass";

  return (
    <div className={wrap}>
      <h2 className="text-base font-bold text-brand-ink">
        {bookable ? "Book as a member" : "Customise as a member"}
      </h2>
      <p className="text-xs text-brand-muted">
        {bookable
          ? "Pick your dates and group size to request this tour at the listed price."
          : "Share your dates and group size — we'll tailor a quote for you."}
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-3">
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
              onChange={(e) => {
                setAdults(Number.parseInt(e.target.value, 10) || 0);
                clearFieldError("adults");
              }}
              {...fieldErrorProps("mb-adults", fieldErrors.adults)}
            />
            <FieldError id={fieldErrorId("mb-adults")}>{fieldErrors.adults}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="mb-children">Children</FieldLabel>
            <TextInput
              id="mb-children"
              type="number"
              min={0}
              value={children}
              onChange={(e) => {
                setChildren(Number.parseInt(e.target.value, 10) || 0);
                clearFieldError("children");
              }}
              {...fieldErrorProps("mb-children", fieldErrors.children)}
            />
            <FieldError id={fieldErrorId("mb-children")}>{fieldErrors.children}</FieldError>
          </div>
        </div>
        <p className="text-xs text-slate-500">Total: {peopleCount} travelers</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel htmlFor="mb-start">Start date</FieldLabel>
            <TextInput
              id="mb-start"
              type="date"
              min={minDate}
              value={preferredStart}
              onChange={(e) => {
                setPreferredStart(e.target.value);
                clearFieldError("start");
              }}
              {...fieldErrorProps("mb-start", fieldErrors.start)}
            />
            <FieldError id={fieldErrorId("mb-start")}>{fieldErrors.start}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="mb-end">End date</FieldLabel>
            <TextInput
              id="mb-end"
              type="date"
              min={preferredStart || minDate}
              value={preferredEnd}
              onChange={(e) => {
                setPreferredEnd(e.target.value);
                clearFieldError("end");
              }}
              {...fieldErrorProps("mb-end", fieldErrors.end)}
            />
            <FieldError id={fieldErrorId("mb-end")}>{fieldErrors.end}</FieldError>
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
        <FormAlert>{err}</FormAlert>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-50"
        >
          {loading ? "Sending…" : bookable ? "Book now" : "Customise your tour"}
        </button>
      </form>
    </div>
  );
}

/** Resolves member profile for TourMemberBooking when embedded in TourStickyBooking. */
export function useMemberProfileForBooking() {
  const sessionToken = useConvexSessionToken();
  const user = useQuery(
    api.auth.getCurrentUser,
    sessionToken ? { sessionToken } : "skip",
  );
  return user;
}
