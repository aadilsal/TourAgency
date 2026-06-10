"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const BULLETS = [
  "Official invitation letters for Pakistan tourist visas",
  "Licensed tour operator — secure passport handling",
  "Submit details for one or multiple travelers",
  "Response within 24–48 hours",
];

type Props = {
  layout?: "modal" | "section";
  onCtaClick?: () => void;
};

export function VisaInvitationPromo({ layout = "section", onCtaClick }: Props) {
  const router = useRouter();
  const isModal = layout === "modal";

  function handleCta() {
    onCtaClick?.();
    router.push("/visa-invitation");
  }

  return (
    <div className={cn(isModal ? "space-y-5" : "space-y-6")}>
      <div
        className={cn(
          "flex items-start gap-4",
          !isModal && "md:items-center",
        )}
      >
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-2xl bg-havezic-primary/10 text-havezic-primary ring-1 ring-havezic-primary/20",
            isModal ? "h-12 w-12" : "h-14 w-14",
          )}
        >
          <FileText
            className={cn(isModal ? "h-6 w-6" : "h-7 w-7")}
            strokeWidth={1.6}
            aria-hidden
          />
        </span>
        <div>
          {!isModal ? (
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-havezic-primary">
              Visa support
            </p>
          ) : null}
          <h3
            className={cn(
              "font-semibold tracking-tight text-slate-900",
              isModal ? "text-lg" : "mt-1 text-2xl md:text-3xl",
            )}
          >
            Need a tourist visa invitation?
          </h3>
          <p
            className={cn(
              "mt-2 text-slate-600",
              isModal ? "text-sm" : "text-base leading-relaxed",
            )}
          >
            We prepare official invitation letters for international travelers
            visiting Pakistan. Complete our secure form with passport details for
            each traveler.
          </p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {BULLETS.map((text) => (
          <li
            key={text}
            className="flex items-start gap-2.5 text-sm text-slate-700"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-havezic-primary"
              aria-hidden
            />
            {text}
          </li>
        ))}
      </ul>

      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center",
          !isModal && "pt-2",
        )}
      >
        {isModal ? (
          <Button type="button" className="w-full sm:w-auto" onClick={handleCta}>
            Apply for visa invitation
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <ButtonLink href="/visa-invitation" className="w-full sm:w-auto">
            Apply for visa invitation
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        )}
        {!isModal ? (
          <Link
            href="/contact"
            className="text-center text-sm font-medium text-muted hover:text-havezic-primary sm:text-left"
          >
            Questions? Contact us
          </Link>
        ) : null}
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Your passport details are processed securely for invitation purposes only.
      </p>
    </div>
  );
}
