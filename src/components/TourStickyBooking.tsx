"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  TourMemberBooking,
  useMemberProfileForBooking,
} from "@/components/TourMemberBooking";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  FieldLabel,
  FieldError,
  FormAlert,
  TextInput,
  TextAreaField,
  fieldErrorId,
  fieldErrorProps,
} from "@/components/ui/FormField";
import {
  FORM_MESSAGES,
  focusFirstError,
  isValidEmail,
  isValidPhone,
  shortRef,
  thankYouHref,
} from "@/lib/formValidation";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";
import { todayYmdLocal } from "@/lib/todayYmdLocal";
import {
  buildTourCustomisationWhatsAppMessage,
  type TourCustomisationMessageInput,
} from "@/lib/tourCustomisationWhatsApp";
import { useOpenTourCustomisationWhatsApp } from "@/hooks/useOpenTourCustomisationWhatsApp";
import {
  PerHeadPriceList,
  useLiveTourPrices,
  type TourPriceFields,
} from "@/components/tours/TourLivePrice";
import {
  formatTourPrice,
  getPerHeadOptions,
  getTourUnitPrice,
  tourHasPrice,
} from "@/lib/tourPricing";

type FieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
  tourDate?: string;
  people?: string;
  form?: string;
};

export function TourStickyBooking({
  tourId,
  tourSlug,
  tourTitle,
  durationDays,
  location,
  whatsappUrl,
  initialPrices,
  currency = "USD",
}: {
  tourId: Id<"tours">;
  tourSlug: string;
  tourTitle: string;
  durationDays: number;
  location: string;
  whatsappUrl: string | null;
  /** Server-rendered prices; the live subscription takes over once it resolves. */
  initialPrices: TourPriceFields;
  currency?: "USD" | "PKR";
}) {
  // Prices are read live so an admin edit is reflected here — and in the
  // `unitPrice` recorded on the booking — without a page reload.
  const prices = useLiveTourPrices(tourSlug, initialPrices);
  const bookable = tourHasPrice(prices);
  const priceLabel = formatTourPrice(prices, currency);
  const perHeadOptions = getPerHeadOptions(prices, currency);

  const router = useRouter();
  const sessionToken = useConvexSessionToken();
  const memberProfile = useMemberProfileForBooking();
  const createGuest = useMutation(api.bookings.createGuestBooking);
  const openWhatsApp = useOpenTourCustomisationWhatsApp();

  const [minDate, setMinDate] = useState("");
  useEffect(() => {
    setMinDate(todayYmdLocal());
  }, []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tourDate, setTourDate] = useState("");
  const [peopleCount, setPeopleCount] = useState(2);
  // Bookings store a per-person `unitPrice` and derive the total from it, so
  // this follows the traveler count: a matching per-head rate when one is
  // published, otherwise the whole-tour total spread across the group.
  const unitPrice = getTourUnitPrice(prices, currency, peopleCount) || undefined;
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const submittingRef = useRef(false);

  const scrollToBook = useCallback(() => {
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const validate = useCallback((): boolean => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = FORM_MESSAGES.nameRequired;
    if (!phone.trim()) next.phone = "Phone is required so we can confirm your trip.";
    else if (!isValidPhone(phone)) next.phone = FORM_MESSAGES.phoneInvalid;
    if (email.trim() && !isValidEmail(email)) next.email = FORM_MESSAGES.emailInvalid;
    if (!tourDate) next.tourDate = "Choose your preferred start date.";
    if (peopleCount < 1) next.people = "Add at least one traveler.";
    if (minDate && tourDate && tourDate < minDate) {
      next.tourDate = "Past dates can't be selected.";
    }
    setErrors(next);
    focusFirstError([
      next.tourDate && "tb-date",
      next.name && "tb-name",
      next.phone && "tb-phone",
      next.email && "tb-email",
    ]);
    return Object.keys(next).length === 0;
  }, [name, phone, email, tourDate, peopleCount, minDate]);

  const finishCustomisation = useCallback(
    async (input: TourCustomisationMessageInput, ref?: string) => {
      const message = buildTourCustomisationWhatsAppMessage(input);
      // Best-effort: the request is already saved, so a blocked popup must not
      // stop the visitor from reaching the confirmation page.
      await openWhatsApp(message).catch(() => null);
      router.push(thankYouHref("booking", ref));
    },
    [openWhatsApp, router],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!validate()) return;
    submittingRef.current = true;
    setLoading(true);
    setErrors((prev) => ({ ...prev, form: undefined }));
    let bookingId: string;
    try {
      bookingId = await createGuest({
        tourId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        peopleCount,
        notes: notes.trim() || undefined,
        preferredStart: tourDate,
        currency,
        unitPrice: bookable ? unitPrice : undefined,
      });
    } catch (er) {
      setErrors({
        form: toUserFacingErrorMessage(er),
      });
      submittingRef.current = false;
      setLoading(false);
      return;
    }
    // Saved: keep the button in its pending state while we redirect.
    await finishCustomisation(
      {
        tourTitle,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        preferredStart: tourDate,
        peopleCount,
        notes: notes.trim() || undefined,
      },
      shortRef(bookingId),
    );
  }

  const loggedIn = typeof sessionToken === "string";
  const memberName = memberProfile?.name ?? "Member";
  const memberPhone = memberProfile?.phone;
  const memberEmail = memberProfile?.email;

  return (
    <>
      <Card className="overflow-hidden p-6 ring-1 ring-border">
        <div id="book" className="scroll-mt-28">
          <h2 className="text-lg font-bold text-foreground">
            {bookable ? "Book this tour" : "Customise your tour"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {durationDays} days · {location}
          </p>
          {bookable && priceLabel ? (
            <p className="mt-3 text-2xl font-extrabold text-foreground">
              {priceLabel}
              <span className="text-sm font-medium text-muted"> total tour</span>
            </p>
          ) : null}
          {perHeadOptions.length > 0 ? (
            <div className="mt-3 rounded-xl border border-border bg-panel-elevated p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Price per head
              </p>
              <PerHeadPriceList options={perHeadOptions} className="mt-1.5 space-y-1 text-sm" />
            </div>
          ) : null}
          <p className="mt-2 text-sm text-muted">
            {bookable
              ? "Pick your date and group size to request this tour at the listed price."
              : "Share your dates and group size — we'll tailor a quote."}
          </p>

          {loggedIn ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted">
                You&apos;re signed in — use the form below. Your request is tied
                to your account and appears on your dashboard.
              </p>
              <TourMemberBooking
                tourId={tourId}
                tourTitle={tourTitle}
                memberName={memberName}
                memberPhone={memberPhone}
                memberEmail={memberEmail}
                plain
                bookable={bookable}
                onCustomisationSubmitted={finishCustomisation}
              />
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
                No payment online — we&apos;ll follow up with a personalised quote.
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
                {...fieldErrorProps("tb-date", errors.tourDate)}
              />
              <FieldError id={fieldErrorId("tb-date")}>{errors.tourDate}</FieldError>
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
                {...fieldErrorProps("tb-name", errors.name)}
              />
              <FieldError id={fieldErrorId("tb-name")}>{errors.name}</FieldError>
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
                {...fieldErrorProps("tb-phone", errors.phone)}
              />
              <FieldError id={fieldErrorId("tb-phone")}>{errors.phone}</FieldError>
            </div>

            <div>
              <FieldLabel htmlFor="tb-email">Email</FieldLabel>
              <TextInput
                id="tb-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((x) => ({ ...x, email: undefined }));
                }}
                icon={<Mail />}
                {...fieldErrorProps("tb-email", errors.email)}
              />
              <FieldError id={fieldErrorId("tb-email")}>{errors.email}</FieldError>
            <p className="mt-1 text-xs text-muted">
                Optional — we&apos;ll email your request summary.
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

            <FormAlert>{errors.form}</FormAlert>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 text-base font-semibold"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? "Sending…" : bookable ? "Book now" : "Customise your tour"}
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
              No payment online — we&apos;ll follow up with a personalised quote.
              Guest checkout; no account required.
            </p>
          </form>
          ) : null}
        </div>
      </Card>

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
          {bookable ? (priceLabel ? `Book now · ${priceLabel}` : "Book now") : "Customise your tour"}
        </Button>
      </div>
    </>
  );
}
