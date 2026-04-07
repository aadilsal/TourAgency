"use client";

import { useState } from "react";
import { BookingModal } from "./BookingModal";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";

export function TourBookSection({
  tourId,
  tourTitle,
}: {
  tourId: Id<"tours">;
  tourTitle: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      id="book"
      className="mt-12 scroll-mt-24 rounded-2xl border border-white/20 bg-white/90 p-6 shadow-glass backdrop-blur-glass"
    >
      <h2 className="text-lg font-semibold text-brand-ink">Book this tour</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Guest checkout — no account required. We&apos;ll confirm by phone.
      </p>
      <Button
        type="button"
        variant="primary"
        className="mt-4 py-3"
        onClick={() => setOpen(true)}
      >
        Book now
      </Button>
      <BookingModal
        tourId={tourId}
        tourTitle={tourTitle}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
