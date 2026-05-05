"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Mail,
  Minus,
  Phone,
  Plus,
  User,
  Users,
} from "lucide-react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { TourMemberBooking } from "@/components/TourMemberBooking";
import { TourBookingSuccessModal } from "@/components/tours/TourBookingSuccessModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  FieldLabel,
  FieldError,
  TextInput,
  TextAreaField,
} from "@/components/ui/FormField";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";
import { todayYmdLocal } from "@/lib/todayYmdLocal";
import { useCurrency } from "@/hooks/useCurrency";
import { formatMoney } from "@/lib/money";
import { getTourUnitPrice } from "@/lib/tourPricing";

type FieldErrors = {
  name?: string;
  phone?: string;
  tourDate?: string;
  people?: string;
  form?: string;
};

export function TourStickyBooking({
  tourId,
  tourTitle,
  price,
  pricePkr,
  priceUsd,
  durationDays,
  location,
  whatsappUrl,
}: {
  tourId: Id<"tours">;
  tourTitle: string;
  price: number; // legacy PKR
  pricePkr?: number;
  priceUsd?: number;
  durationDays: number;
  location: string;
  whatsappUrl: string | null;
}) {
  const router = useRouter();
  const sessionToken = useConvexSessionToken();
  const createGuest = useMutation(api.bookings.createGuestBooking);
  const currency = useCurrency();
  const unitPrice = useMemo(
    () => getTourUnitPrice({ price, pricePkr, priceUsd }, currency),
    [price, pricePkr, priceUsd, currency],
  );

  const [minDate, setMinDate] = useState("");
  useEffect(() => {
    setMinDate(todayYmdLocal());
  }, []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tourDate, setTourDate] = useState("");
  const [peopleCount, setPeopleCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [successOpen, setSuccessOpen] = useState(false);

  const totalPrice = useMemo(
    () => unitPrice * Math.max(1, peopleCount),
    [unitPrice, peopleCount],
  );

  const scrollToBook = useCallback(() => {
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const validate = useCallback((): boolean => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!phone.trim()) next.phone = "Phone is required so we can confirm your trip.";
    if (!tourDate) next.tourDate = "Choose your preferred start date.";
    if (peopleCount < 1) next.people = "Add at least one traveler.";
    if (minDate && tourDate && tourDate < minDate) {
      next.tourDate = "Past dates can’t be selected.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, phone, tourDate, peopleCount, minDate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors((e) => ({ ...e, form: undefined }));
    try {
      await createGuest({
        tourId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        peopleCount,
        currency,
        notes: notes.trim() || undefined,
        preferredStart: tourDate,
      });
      setSuccessOpen(true);
    } catch (er) {
      setErrors({
        form: toUserFacingErrorMessage(er),
      });
    } finally {
      setLoading(false);
    }
  }

  const bookingsEntry =
    "/login?next=" + encodeURIComponent("/dashboard/bookings");

  function goBookings() {
    setSuccessOpen(false);
    router.push(bookingsEntry);
  }

  function onSuccessModalClose() {
    setSuccessOpen(false);
    router.push(bookingsEntry);
  }

  const loggedIn = typeof sessionToken === "string";

  return (
    <>
      <Card className="overflow-hidden p-6 ring-1 ring-border lg:sticky lg:top-[100px]">
        <div id="book" className="scroll-mt-28">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            From
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {formatMoney(unitPrice, currency)}
            <span className="text-base font-semibold text-muted">
              {" "}
              / person
            </span>
          </p>
          <p className="mt-1 text-sm text-muted">
            {durationDays} days · {location}
          </p>

          {loggedIn ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted">
                You&apos;re signed in — use the form below. Your request is tied
                to your account and appears on your dashboard.
              </p>
              <TourMemberBooking tourId={tourId} plain />
              {whatsappUrl ? (
                <div className="flex justify-center">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition hover:brightness-110"
                    aria-label="Chat on WhatsApp"
                  >
                    <WhatsAppBrandIcon className="h-7 w-7" />
                  </a>
                </div>
              ) : null}
              <p className="text-center text-xs leading-relaxed text-muted">
                No payment online — we confirm by phone.
              </p>
            </div>
          ) : null}

          {!loggedIn ? (
          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            <div>
              <FieldLabel htmlFor="tb-date" required>
                Preferred start date
              </FieldLabel>
              <TextInput
                id="tb-date"
                type="date"
                min={minDate || undefined}
                value={tourDate}
                onChange={(e) => {
                  setTourDate(e.target.value);
                  setErrors((x) => ({ ...x, tourDate: undefined }));
                }}
                icon={<CalendarDays />}
                error={!!errors.tourDate}
              />
              <FieldError>{errors.tourDate}</FieldError>
            </div>

            <div>
              <FieldLabel required>Travelers</FieldLabel>
              <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-border bg-panel-elevated px-3 py-2 shadow-sm">
                <span className="flex items-center gap-2 text-sm text-muted">
                  <Users className="h-4 w-4 shrink-0" aria-hidden />
                  People
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Decrease travelers"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-panel text-foreground transition hover:bg-panel-elevated disabled:opacity-40"
                    disabled={peopleCount <= 1 || loading}
                    onClick={() => {
                      setPeopleCount((n) => Math.max(1, n - 1));
                      setErrors((x) => ({ ...x, people: undefined }));
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2rem] text-center text-base font-semibold text-foreground">
                    {peopleCount}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase travelers"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-panel text-foreground transition hover:bg-panel-elevated disabled:opacity-40"
                    disabled={loading}
                    onClick={() => {
                      setPeopleCount((n) => n + 1);
                      setErrors((x) => ({ ...x, people: undefined }));
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                Estimated total:{" "}
                <span className="text-brand-cta">
                  PKR {totalPrice.toLocaleString()}
                </span>
              </p>
              <FieldError>{errors.people}</FieldError>
            </div>

            <div>
              <FieldLabel htmlFor="tb-name" required>
                Full name
              </FieldLabel>
              <TextInput
                id="tb-name"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((x) => ({ ...x, name: undefined }));
                }}
                icon={<User />}
                error={!!errors.name}
              />
              <FieldError>{errors.name}</FieldError>
            </div>

            <div>
              <FieldLabel htmlFor="tb-phone" required>
                Phone (WhatsApp)
              </FieldLabel>
              <TextInput
                id="tb-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((x) => ({ ...x, phone: undefined }));
                }}
                icon={<Phone />}
                error={!!errors.phone}
              />
              <FieldError>{errors.phone}</FieldError>
            </div>

            <div>
              <FieldLabel htmlFor="tb-email">Email</FieldLabel>
              <TextInput
                id="tb-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail />}
              />
            <p className="mt-1 text-xs text-muted">
                Optional — we&apos;ll send a confirmation if provided.
              </p>
            </div>

            <div>
              <FieldLabel htmlFor="tb-notes">Notes</FieldLabel>
              <TextAreaField
                id="tb-notes"
                rows={3}
                placeholder="Dietary needs, hotel preferences, questions…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <FieldError>{errors.form}</FieldError>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Booking…" : "Book now"}
            </Button>

            {whatsappUrl ? (
              <div className="flex justify-center">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition hover:brightness-110"
                  aria-label="Chat on WhatsApp"
                >
                  <WhatsAppBrandIcon className="h-7 w-7" />
                </a>
              </div>
            ) : null}

            <p className="text-center text-xs leading-relaxed text-muted">
              No payment online — we confirm by phone. Guest checkout; no account
              required.
            </p>
          </form>
          ) : null}
        </div>
      </Card>

      <TourBookingSuccessModal
        open={successOpen}
        tourTitle={tourTitle}
        whatsappUrl={whatsappUrl}
        onViewBookings={goBookings}
        onClose={onSuccessModalClose}
      />

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-panel p-4 shadow-sm backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <Button
          type="button"
          variant="primary"
          className="w-full py-3.5 text-base font-semibold"
          onClick={scrollToBook}
        >
          Book now
        </Button>
      </div>
    </>
  );
}
