"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, MessageCircle, RotateCcw, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { usePlannerWidget } from "./PlannerWidgetContext";
import { usePathname } from "next/navigation";
import { isMobileStickyCtaRoute, isTourDetailRoute } from "@/components/ui/floatingLayout";
import { cn } from "@/lib/cn";
import { useBodyScrollLock } from "@/components/ui/useBodyScrollLock";
import { useFocusTrap } from "@/components/ui/useFocusTrap";

const AiPlannerChat = dynamic(
  () => import("@/components/AiPlannerChat").then((m) => m.AiPlannerChat),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center text-sm text-brand-muted">
        Loading assistant…
      </div>
    ),
  },
);

type Props = {
  guestSessionId: string;
};

export function PlannerChatWidget({ guestSessionId }: Props) {
  const reduce = useReducedMotion();
  const { isOpen, close, toggle } = usePlannerWidget();
  const pathname = usePathname();
  // Below md the MobileStickyCta's "Plan my trip" opens this widget, so the
  // round launcher would be a duplicate floating over content.
  const launcherHiddenOnMobile = isMobileStickyCtaRoute(pathname);
  const onTourDetail = isTourDetailRoute(pathname);
  const sessionToken = useConvexSessionToken();
  const clearSession = useMutation(api.plannerChatSessions.clearSession);
  const [chatKey, setChatKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const onNewChat = useCallback(async () => {
    try {
      await clearSession({
        guestSessionId,
        sessionToken: sessionToken ?? undefined,
      });
    } catch {
      /* still reset UI */
    }
    setChatKey((k) => k + 1);
  }, [clearSession, guestSessionId, sessionToken]);

  useBodyScrollLock(isOpen);
  useFocusTrap(panelRef, isOpen, close);

  return (
    <>
      <motion.button
        type="button"
        onClick={toggle}
        className={cn(
          "fixed z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-cta text-white shadow-lg shadow-black/25 md:h-[3.75rem] md:w-[3.75rem]",
          "bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-4 sm:right-6 md:bottom-32 md:right-8",
          onTourDetail && "max-lg:bottom-[calc(11rem+env(safe-area-inset-bottom))]",
          launcherHiddenOnMobile && "max-md:hidden",
          isOpen && "pointer-events-none opacity-0",
        )}
        aria-label={isOpen ? "Close trip assistant" : "Open trip assistant"}
        aria-expanded={isOpen}
        whileHover={reduce ? undefined : { scale: 1.05 }}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: isOpen ? 0.9 : 1, opacity: isOpen ? 0 : 1 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 24 }}
      >
        <Bot className="h-7 w-7 md:h-8 md:w-8" strokeWidth={2} aria-hidden />
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="planner-widget-title"
            className={cn(
              "fixed z-[70] flex flex-col overflow-hidden border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/20",
              // Mobile: near-full-height bottom sheet so the chat and keyboard fit.
              "inset-x-0 bottom-0 top-[max(3.5rem,env(safe-area-inset-top))] rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
              "md:inset-x-auto md:top-auto md:bottom-32 md:right-8 md:max-h-[min(560px,calc(100dvh-7.5rem))] md:w-[400px] md:rounded-2xl md:pb-0",
            )}
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/95 px-3 py-2.5 md:px-4">
              <div className="min-w-0 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="planner-widget-title"
                    className="truncate text-sm font-bold text-brand-ink md:text-base"
                  >
                    Trip assistant
                  </h2>
                  <p className="truncate text-xs text-brand-muted">
                    Saved on this device · Ask follow-ups anytime
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => void onNewChat()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-brand-muted transition hover:bg-white hover:text-brand-primary"
                  title="New conversation"
                  aria-label="New conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-brand-muted transition hover:bg-white hover:text-brand-ink"
                  title="Close"
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-3 md:p-4"
              data-lenis-prevent>
              <AiPlannerChat
                key={chatKey}
                compact
                variant="widget"
                guestSessionId={guestSessionId}
              />
            </div>

            <p className="border-t border-slate-100 bg-slate-50/80 px-3 py-2 text-center text-xs text-brand-muted">
              <MessageCircle className="mr-1 inline h-3 w-3 align-text-bottom" />
              Prefer WhatsApp? Tap the green WhatsApp button.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
