"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Phone, Mail, CalendarRange, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormStepper } from "@/components/ui/FormStepper";
import {
  FieldLabel,
  FieldHint,
  TextInput,
  TextAreaField,
} from "@/components/ui/FormField";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

const STEPS = ["Contact", "Trip", "Confirm"] as const;

export function BookingModal({
  tourId,
  tourTitle,
  open,
  onClose,
  initialPeople = 2,
}: {
  tourId: Id<"tours">;
  tourTitle: string;
  open: boolean;
  onClose: () => void;
  initialPeople?: number;
}) {
  const router = useRouter();
  const createGuest = useMutation(api.bookings.createGuestBooking);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [preferredStart, setPreferredStart] = useState("");
  const [preferredEnd, setPreferredEnd] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "err">(
    "idle",
  );
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setStatus("idle");
    setErr("");
    setAdults(Math.max(1, initialPeople));
    setChildren(0);
  }, [open, initialPeople]);

  useEffect(() => {
    setErr("");
  }, [step]);

  const peopleCount = Math.max(0, adults) + Math.max(0, children);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErr("");
    try {
      await createGuest({
        tourId,
        name,
        phone,
        email: email.trim() || undefined,
        peopleCount,
        notes: notes.trim() || undefined,
        preferredStart: preferredStart.trim() || undefined,
        preferredEnd: preferredEnd.trim() || undefined,
        departureCity: departureCity.trim() || undefined,
        adults: adults > 0 ? adults : undefined,
        children: children > 0 ? children : undefined,
        specialNeeds: specialNeeds.trim() || undefined,
      });
      setStatus("done");
    } catch (er) {
      setStatus("err");
      setErr(toUserFacingErrorMessage(er));
    }
  }

  function validateStep1(): boolean {
    if (!name.trim() || !phone.trim()) {
      setErr("Please enter your name and phone.");
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    if (peopleCount < 1) {
      setErr("Add at least one traveler (adults + children).");
      return false;
    }
    if (adults < 1) {
      setErr("Include at least one adult traveler.");
      return false;
    }
    return true;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={status === "done" ? "Thank you" : "Book tour"}
      description={status === "done" ? undefined : tourTitle}
      panelClassName="max-w-lg"
    >
      {status === "done" ? (
        <div className="space-y-3 text-sm text-brand-ink">
          <p className="font-semibold text-brand-accent">Request received.</p>
          <p className="text-brand-muted">
            Our team will confirm availability by phone. You can also create an
            account later to track bookings in your dashboard.
          </p>
          <Button
            type="button"
            variant="primary"
            className="w-full py-3"
            onClick={() => {
              onClose();
              router.push(
                "/login?next=" + encodeURIComponent("/dashboard/bookings"),
              );
            }}
          >
            View my bookings
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <FormStepper steps={[...STEPS]} current={step} />
          </div>
          <form onSubmit={step === 3 ? onSubmit : (e) => e.preventDefault()}>
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <FieldLabel htmlFor="bm-name" required>
                    Full name
                  </FieldLabel>
                  <TextInput
                    id="bm-name"
                    required
                    autoComplete="name"
                    icon={<User />}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="bm-phone" required>
                    Phone (WhatsApp preferred)
                  </FieldLabel>
                  <TextInput
                    id="bm-phone"
                    required
                    type="tel"
                    autoComplete="tel"
                    icon={<Phone />}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="bm-email">Email</FieldLabel>
                  <TextInput
                    id="bm-email"
                    type="email"
                    autoComplete="email"
                    icon={<Mail />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <FieldHint>
                    Strongly recommended for confirmations and receipts.
                  </FieldHint>
                </div>
                {err ? (
                  <p className="text-sm text-red-600" role="alert">
                    {err}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="primary"
                  className="w-full py-3"
                  onClick={() => {
                    if (!validateStep1()) return;
                    setStep(2);
                  }}
                >
                  Continue
                </Button>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel htmlFor="bm-adults" required>
                      Adults
                    </FieldLabel>
                    <TextInput
                      id="bm-adults"
                      type="number"
                      min={1}
                      icon={<Users />}
                      value={adults}
                      onChange={(e) =>
                        setAdults(Number.parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="bm-children">Children</FieldLabel>
                    <TextInput
                      id="bm-children"
                      type="number"
                      min={0}
                      value={children}
                      onChange={(e) =>
                        setChildren(Number.parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Total party: <strong>{peopleCount}</strong> travelers
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="bm-start">Preferred start</FieldLabel>
                    <TextInput
                      id="bm-start"
                      type="date"
                      icon={<CalendarRange />}
                      value={preferredStart}
                      onChange={(e) => setPreferredStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="bm-end">Preferred end</FieldLabel>
                    <TextInput
                      id="bm-end"
                      type="date"
                      value={preferredEnd}
                      onChange={(e) => setPreferredEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="bm-city">Departure city</FieldLabel>
                  <TextInput
                    id="bm-city"
                    placeholder="e.g. Islamabad, Lahore, Karachi"
                    icon={<MapPin />}
                    value={departureCity}
                    onChange={(e) => setDepartureCity(e.target.value)}
                  />
                  <FieldHint>Helps us plan transport and timing.</FieldHint>
                </div>
                <div>
                  <FieldLabel htmlFor="bm-special">
                    Dietary, mobility, altitude concerns
                  </FieldLabel>
                  <TextAreaField
                    id="bm-special"
                    rows={2}
                    placeholder="Optional — helps us prepare a safe, comfortable trip."
                    value={specialNeeds}
                    onChange={(e) => setSpecialNeeds(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="bm-notes">Other notes</FieldLabel>
                  <TextAreaField
                    id="bm-notes"
                    rows={2}
                    placeholder="Hotels, flight times, special requests…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                {err ? (
                  <p className="text-sm text-red-600" role="alert">
                    {err}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 py-3"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1 py-3"
                    onClick={() => {
                      if (!validateStep2()) return;
                      setStep(3);
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-brand-ink">
                  <p>
                    <span className="text-brand-muted">Name:</span> {name}
                  </p>
                  <p className="mt-1">
                    <span className="text-brand-muted">Phone:</span> {phone}
                  </p>
                  {email ? (
                    <p className="mt-1">
                      <span className="text-brand-muted">Email:</span> {email}
                    </p>
                  ) : null}
                  <p className="mt-1">
                    <span className="text-brand-muted">Party:</span> {adults}{" "}
                    adults
                    {children > 0 ? `, ${children} children` : ""} (
                    {peopleCount} total)
                  </p>
                  {(preferredStart || preferredEnd) && (
                    <p className="mt-1">
                      <span className="text-brand-muted">Dates:</span>{" "}
                      {preferredStart || "—"} → {preferredEnd || "—"}
                    </p>
                  )}
                  {departureCity ? (
                    <p className="mt-1">
                      <span className="text-brand-muted">From:</span>{" "}
                      {departureCity}
                    </p>
                  ) : null}
                  {specialNeeds ? (
                    <p className="mt-1">
                      <span className="text-brand-muted">Needs:</span>{" "}
                      {specialNeeds}
                    </p>
                  ) : null}
                  {notes ? (
                    <p className="mt-1">
                      <span className="text-brand-muted">Notes:</span> {notes}
                    </p>
                  ) : null}
                </div>
                {err ? (
                  <p className="text-sm text-red-600" role="alert">
                    {err}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 py-3"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 py-3"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "Sending…" : "Confirm booking"}
                  </Button>
                </div>
              </div>
            ) : null}
          </form>
        </>
      )}
    </Modal>
  );
}
