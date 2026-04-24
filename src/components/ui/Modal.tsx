"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  panelClassName,
  fullscreenOnMobile,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
  fullscreenOnMobile?: boolean;
}) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Robust scroll lock (incl. iOS): freeze body at current scrollY.
    const scrollY = window.scrollY;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
    };
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      document.body.style.paddingRight = prev.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className={cn("fixed inset-0 z-[70]", className)}>
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center p-4",
              fullscreenOnMobile && "p-0 sm:p-4",
            )}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-describedby={description ? descId : undefined}
              className={cn(
                "pointer-events-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/20 bg-white/95 p-6 text-slate-900 shadow-glass backdrop-blur-glass-lg",
                // Many admin components use dark-theme tokens like text-foreground/text-muted.
                // Inside a white modal panel, force them to readable (black) shades.
                "[&_.text-foreground]:text-slate-900 [&_.text-muted]:text-slate-600 [&_.text-brand-ink]:text-slate-900 [&_.text-brand-muted]:text-slate-600",
                fullscreenOnMobile &&
                  "max-h-[92vh] p-4 sm:max-h-[90vh] sm:p-6",
                fullscreenOnMobile &&
                  "sm:rounded-2xl sm:border-white/20 sm:bg-white/95",
                fullscreenOnMobile &&
                  "rounded-none border-0 bg-white sm:rounded-2xl sm:border",
                panelClassName,
              )}
              initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {title ? (
                    <h2
                      id={titleId}
                      className="text-lg font-bold text-slate-900"
                    >
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p id={descId} className="mt-1 text-sm text-slate-600">
                      {description}
                    </p>
                  ) : null}
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-xl p-2 text-slate-900 transition-colors hover:bg-slate-100 hover:text-slate-950"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
