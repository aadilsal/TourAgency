"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";

type Props = {
  open: boolean;
  tourTitle: string;
  whatsappUrl: string | null;
  onViewBookings: () => void;
  onClose: () => void;
};

export function TourBookingSuccessModal({
  open,
  tourTitle,
  whatsappUrl,
  onViewBookings,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Booking request submitted"
      description={`${tourTitle} — you're all set.`}
      panelClassName="max-w-md"
    >
      <div className="space-y-5 text-sm text-brand-ink">
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3">
          <CheckCircle2
            className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600"
            aria-hidden
          />
          <div>
            <p className="font-semibold text-emerald-900">
              We&apos;ve received your booking request
            </p>
            <p className="mt-2 leading-relaxed text-emerald-900/80">
              Our team will contact you shortly to confirm dates, inclusions, and
              next steps. Watch your phone — we usually reply the same day.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="primary"
            className="flex-1 py-3"
            onClick={onViewBookings}
          >
            View my bookings
          </Button>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-full bg-[#25D366] text-white shadow-md transition hover:brightness-110 sm:self-auto"
              aria-label="Chat on WhatsApp"
            >
              <WhatsAppBrandIcon className="h-7 w-7" />
            </a>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
