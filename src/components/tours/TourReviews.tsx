"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Star } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import {
  FieldError,
  FormAlert,
  fieldErrorId,
  nativeFieldErrorProps,
} from "@/components/ui/FormField";
import {
  FORM_MESSAGES,
  focusFirstError,
  isValidEmail,
  type FieldErrorMap,
} from "@/lib/formValidation";

type ReviewField = "name" | "email" | "body";

function reviewInputClass(hasError: boolean) {
  return cn(
    "mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2",
    hasError
      ? "border-red-500 focus:ring-red-200"
      : "border-border focus:ring-havezic-primary/35",
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

function formatDate(ms: number) {
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}

export function TourReviews({ tourId }: { tourId: string }) {
  const sessionToken = useConvexSessionToken();
  const data = useQuery(api.tourReviews.listApprovedForTour, {
    tourId: tourId as Id<"tours">,
  });
  const submit = useMutation(api.tourReviews.submitReview);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap<ReviewField>>({});
  const submittingRef = useRef(false);

  function clearFieldError(field: ReviewField) {
    setFieldErrors((x) => ({ ...x, [field]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setMsg(null);
    const next: FieldErrorMap<ReviewField> = {};
    if (name.trim().length < 2) next.name = FORM_MESSAGES.nameRequired;
    if (email.trim() && !isValidEmail(email)) next.email = FORM_MESSAGES.emailInvalid;
    if (!body.trim()) next.body = "Please write your review.";
    else if (body.trim().length < 10) {
      next.body = "Please write a little more (at least 10 characters).";
    }
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirstError([
        next.name && "review-name",
        next.email && "review-email",
        next.body && "review-body",
      ]);
      return;
    }
    submittingRef.current = true;
    setBusy(true);
    try {
      await submit({
        tourId: tourId as Id<"tours">,
        authorName: name.trim(),
        authorEmail: email.trim() || undefined,
        rating,
        title: title.trim() || undefined,
        travelDate: travelDate.trim() || undefined,
        body: body.trim(),
        sessionToken: typeof sessionToken === "string" ? sessionToken : undefined,
      });
      setDone(true);
      setOpen(false);
      setName("");
      setEmail("");
      setTitle("");
      setTravelDate("");
      setBody("");
      setRating(5);
    } catch (err) {
      setMsg(toUserFacingErrorMessage(err));
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  const reviews = data?.reviews ?? [];
  const count = data?.count ?? 0;
  const average = data?.average ?? 0;

  return (
    <section
      id="reviews"
      className="mt-10 scroll-mt-28 rounded-2xl border border-border bg-panel p-6 shadow-sm md:mt-12 md:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Reviews</h2>
          {count > 0 ? (
            <div className="mt-1.5 flex items-center gap-2">
              <Stars value={average} />
              <span className="text-sm font-semibold text-foreground">{average.toFixed(1)}</span>
              <span className="text-sm text-muted">
                · {count} review{count === 1 ? "" : "s"}
              </span>
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-muted">
              No reviews yet — be the first to share your experience.
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v);
            setDone(false);
          }}
        >
          {open ? "Cancel" : "Write a review"}
        </Button>
      </div>

      {count > 0 ? (
        <div className="mt-5 grid gap-6 rounded-2xl border border-border bg-panel-elevated p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="text-center sm:pr-6">
            <p className="text-4xl font-extrabold text-foreground">{average.toFixed(1)}</p>
            <Stars value={average} className="mt-1 justify-center" />
            <p className="mt-1 text-xs text-muted">
              {count} review{count === 1 ? "" : "s"}
            </p>
          </div>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const c = reviews.filter((r) => Math.round(r.rating) === star).length;
              const pct = count ? (c / count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-12 shrink-0 text-muted">{star} star</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <span
                      className="block h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right text-muted">{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {done ? (
        <div
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          Thanks! Your review has been submitted and will appear once approved.
        </div>
      ) : null}

      {open ? (
        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-5 space-y-4 rounded-2xl border border-border bg-panel-elevated p-5"
        >
          <div>
            <p
              id="review-rating-label"
              className="text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Your rating
            </p>
            <div
              className="mt-1.5 flex items-center gap-1"
              role="group"
              aria-labelledby="review-rating-label"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  aria-pressed={rating === n}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition",
                      n <= (hover || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="review-name"
                className="text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Name <span className="text-brand-cta">*</span>
              </label>
              <input
                id="review-name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError("name");
                }}
                className={reviewInputClass(Boolean(fieldErrors.name))}
                placeholder="Your name"
                {...nativeFieldErrorProps("review-name", fieldErrors.name)}
              />
              <FieldError id={fieldErrorId("review-name")}>{fieldErrors.name}</FieldError>
            </div>
            <div>
              <label
                htmlFor="review-email"
                className="text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Email (optional)
              </label>
              <input
                id="review-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                className={reviewInputClass(Boolean(fieldErrors.email))}
                placeholder="you@example.com"
                {...nativeFieldErrorProps("review-email", fieldErrors.email)}
              />
              <FieldError id={fieldErrorId("review-email")}>{fieldErrors.email}</FieldError>
            </div>
            <div>
              <label
                htmlFor="review-title"
                className="text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Title (optional)
              </label>
              <input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-havezic-primary/35"
                placeholder="Unforgettable trip"
              />
            </div>
            <div>
              <label
                htmlFor="review-travel-date"
                className="text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Travelled (optional)
              </label>
              <input
                id="review-travel-date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-havezic-primary/35"
                placeholder="e.g. May 2026"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="review-body"
              className="text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Your review <span className="text-brand-cta">*</span>
            </label>
            <textarea
              id="review-body"
              required
              rows={4}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                clearFieldError("body");
              }}
              className={reviewInputClass(Boolean(fieldErrors.body))}
              placeholder="Tell other travellers what you loved…"
              {...nativeFieldErrorProps("review-body", fieldErrors.body)}
            />
            <FieldError id={fieldErrorId("review-body")}>{fieldErrors.body}</FieldError>
          </div>

          <FormAlert>{msg}</FormAlert>

          <Button type="submit" disabled={busy} aria-busy={busy}>
            {busy ? "Sending…" : "Submit review"}
          </Button>
        </form>
      ) : null}

      {reviews.length > 0 ? (
        <ul className="mt-6 space-y-5">
          {reviews.map((r) => (
            <li key={r._id} className="border-t border-border pt-5 first:border-0 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{r.authorName}</p>
                  <p className="text-xs text-muted">
                    {r.travelDate ? `Travelled ${r.travelDate}` : formatDate(r.createdAt)}
                  </p>
                </div>
                <Stars value={r.rating} />
              </div>
              {r.title ? (
                <p className="mt-2 font-semibold text-foreground">{r.title}</p>
              ) : null}
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {r.body}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
