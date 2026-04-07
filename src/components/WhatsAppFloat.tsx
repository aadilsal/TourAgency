"use client";

import { motion, useReducedMotion } from "framer-motion";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";

export function WhatsAppFloat({ url }: { url: string | null }) {
  const reduce = useReducedMotion();
  if (!url) return null;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/30 md:bottom-8 md:right-8"
      aria-label="Chat on WhatsApp"
      whileHover={reduce ? undefined : { scale: 1.06 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      initial={reduce ? false : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <WhatsAppBrandIcon className="h-8 w-8" />
    </motion.a>
  );
}
