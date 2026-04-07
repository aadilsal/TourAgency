"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, MessageCircle, RotateCcw, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { usePlannerWidget } from "./PlannerWidgetContext";
import { cn } from "@/lib/cn";

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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <>
      <motion.button
        type="button"
        onClick={toggle}
        className={cn(
          "fixed z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-cta text-white shadow-lg shadow-black/25 md:h-[3.75rem] md:w-[3.75rem]",
          "bottom-28 right-5 md:bottom-32 md:right-8",
          isOpen && "pointer-events-none opacity-0",
        )}
        aria-label={isOpen ? "Close trip assistant" : "Open trip assistant"}
        aria-expanded={isOpen}
        whileHover={reduce ? undefined : { scale: 1.05 }}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: isOpen ? 0.9 : 1, opacity: isOpen ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
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
              "fixed z-[70] flex max-h-[min(560px,calc(100dvh-7.5rem))] w-[min(100vw-1.25rem,400px)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/20",
              "bottom-28 right-3 max-md:left-3 max-md:right-3 max-md:w-auto md:bottom-32 md:right-8",
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
                  <p className="truncate text-[10px] text-brand-muted md:text-xs">
                    Saved on this device · Ask follow-ups anytime
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => void onNewChat()}
                  className="rounded-lg p-2 text-brand-muted transition hover:bg-white hover:text-brand-primary"
                  title="New conversation"
                  aria-label="New conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg p-2 text-brand-muted transition hover:bg-white hover:text-brand-ink"
                  title="Close"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-3 md:p-4">
              <AiPlannerChat
                key={chatKey}
                compact
                variant="widget"
                guestSessionId={guestSessionId}
              />
            </div>

            <p className="border-t border-slate-100 bg-slate-50/80 px-3 py-2 text-center text-[10px] text-brand-muted">
              <MessageCircle className="mr-1 inline h-3 w-3 align-text-bottom" />
              Prefer WhatsApp? Use the green button below.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
