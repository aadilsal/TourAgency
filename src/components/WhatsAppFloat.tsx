"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";
import { isMobileStickyCtaRoute, isTourDetailRoute } from "@/components/ui/floatingLayout";
import { cn } from "@/lib/cn";

export function WhatsAppFloat({ url }: { url: string | null }) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  if (!url) return null;

  // Below md the MobileStickyCta already offers WhatsApp — avoid a duplicate button.
  const hiddenOnMobile = isMobileStickyCtaRoute(pathname);

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/30 sm:right-6 md:bottom-8 md:right-8",
        "bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
        // Tour detail pages pin a booking bar to the bottom below lg: sit above it.
        isTourDetailRoute(pathname) && "max-lg:bottom-[calc(6.5rem+env(safe-area-inset-bottom))]",
        hiddenOnMobile && "max-md:hidden",
      )}
      aria-label="Chat on WhatsApp"
      whileHover={reduce ? undefined : { scale: 1.06 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      // Same `initial` on server and client (useReducedMotion is null during SSR),
      // otherwise hydration warns about mismatched inline styles.
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 20 }}
    >
      <WhatsAppBrandIcon className="h-8 w-8" />
    </motion.a>
  );
}
