"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useContext } from "react";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";
import { StickyBottomBar } from "@/components/ui/StickyBottomBar";
import { PlannerWidgetContext } from "@/components/planner/PlannerWidgetContext";
import { isMobileStickyCtaRoute } from "@/components/ui/floatingLayout";
import { cn } from "@/lib/cn";

type Props = {
  whatsappUrl: string | null;
};

const actionBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-havezic-primary active:scale-[0.98]";

export function MobileStickyCta({ whatsappUrl }: Props) {
  const pathname = usePathname();
  // Read the context directly (not usePlannerWidget) so the CTA degrades to a
  // plain link if it is ever rendered outside PlannerWidgetProvider.
  const planner = useContext(PlannerWidgetContext);

  if (!isMobileStickyCtaRoute(pathname)) return null;

  const primaryClass = cn(
    actionBase,
    "flex-1 bg-havezic-primary text-white shadow-sm hover:bg-havezic-primary-hover",
  );

  return (
    <StickyBottomBar label="Quick actions" hidden={planner?.isOpen ?? false}>
      <div className="mx-auto flex max-w-md items-center gap-3">
        {planner ? (
          <button type="button" onClick={planner.open} className={primaryClass}>
            <Sparkles className="h-5 w-5" aria-hidden />
            Plan my trip
          </button>
        ) : (
          <Link href="/ai-planner" className={primaryClass}>
            <Sparkles className="h-5 w-5" aria-hidden />
            Plan my trip
          </Link>
        )}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(actionBase, "shrink-0 bg-[#25D366] text-white shadow-sm hover:brightness-105")}
            aria-label="Chat with us on WhatsApp (opens in a new tab)"
          >
            <WhatsAppBrandIcon className="h-5 w-5" />
            WhatsApp
          </a>
        ) : null}
      </div>
    </StickyBottomBar>
  );
}
