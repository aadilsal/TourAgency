"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Star } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await submit({
        tourId: tourId as Id<"tours">,
        authorName: name,
        authorEmail: email.trim() || undefined,
        rating,
        title: title.trim() || undefined,
        travelDate: travelDate.trim() || undefined,
        body,
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
        <Button type="button" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Cancel" : "Write a review"}
        </Button>
      </div>

      {done ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Thanks! Your review has been submitted and will appear once approved.
        </div>
      ) : null}

      {open ? (
        <form
          onSubmit={onSubmit}
          className="mt-5 space-y-4 rounded-2xl border border-border bg-panel-elevated p-5"
        >
          {msg ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {msg}
            </div>
          ) : null}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Your rating
            </label>
            <div className="mt-1.5 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
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
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-havezic-primary/35"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-havezic-primary/35"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Title (optional)
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-havezic-primary/35"
                placeholder="Unforgettable trip"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Travelled (optional)
              </label>
              <input
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-havezic-primary/35"
                placeholder="e.g. May 2026"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Your review
            </label>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-havezic-primary/35"
              placeholder="Tell other travellers what you loved…"
            />
          </div>

          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit review"}
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
