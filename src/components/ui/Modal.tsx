"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef } from "react";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { cn } from "@/lib/cn";
import { useBodyScrollLock } from "@/components/ui/useBodyScrollLock";
import { useFocusTrap } from "@/components/ui/useFocusTrap";

/**
 * Open dialogs, innermost last. Escape must close only the top-most dialog —
 * otherwise a confirm/picker modal opened from an editor modal would close
 * (and discard) both at once.
 */
const openStack: string[] = [];

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  panelClassName,
  fullscreenOnMobile,
  confirmClose,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
  fullscreenOnMobile?: boolean;
  /**
   * Pass `true` (or a custom message) while the dialog holds unsaved edits.
   * Escape, backdrop clicks and the X button then ask before discarding.
   */
  confirmClose?: boolean | string;
}) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const descId = useId();
  const stackId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef(confirmClose);
  confirmRef.current = confirmClose;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const requestClose = useCallback(() => {
    const c = confirmRef.current;
    if (c) {
      const msg = typeof c === "string" ? c : "Discard your unsaved changes?";
      if (!window.confirm(msg)) return;
    }
    onCloseRef.current();
  }, []);

  useUnsavedChangesGuard(open && Boolean(confirmClose));

  useBodyScrollLock(open);

  // Keeps Tab inside the dialog, focuses its first control on open and
  // returns focus to the trigger on close. Escape is handled below.
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    openStack.push(stackId);
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (openStack[openStack.length - 1] !== stackId) return;
      e.preventDefault();
      requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const i = openStack.lastIndexOf(stackId);
      if (i !== -1) openStack.splice(i, 1);
    };
  }, [open, requestClose, stackId]);

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
            onClick={requestClose}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center p-4",
              fullscreenOnMobile && "p-0 sm:p-4",
            )}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-describedby={description ? descId : undefined}
              tabIndex={-1}
              className={cn(
                // Flex column: the header stays put and only the body scrolls,
                // so the close button is always reachable on long forms.
                "pointer-events-auto flex max-h-[90vh] max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/95 text-slate-900 shadow-glass backdrop-blur-glass-lg focus:outline-none",
                // Many admin components use dark-theme tokens like text-foreground/text-muted.
                // Inside a white modal panel, force them to readable (black) shades.
                "[&_.text-foreground]:text-slate-900 [&_.text-muted]:text-slate-600 [&_.text-brand-ink]:text-slate-900 [&_.text-brand-muted]:text-slate-600",
                fullscreenOnMobile && "max-h-[100dvh] sm:max-h-[90dvh]",
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
              <div
                className={cn(
                  "flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-6",
                  fullscreenOnMobile && "px-4 pt-4 sm:px-6 sm:pt-6",
                )}
              >
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
                  type="button"
                  onClick={requestClose}
                  aria-label="Close"
                  className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-900 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* data-lenis-prevent: the public site's smooth scroller must never
                  swallow wheel/touch events meant for the dialog body. */}
              <div
                data-lenis-prevent
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6",
                  fullscreenOnMobile &&
                    "px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6",
                )}
              >
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
