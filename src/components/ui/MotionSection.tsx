import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Lightweight scroll/entrance reveal.
 *
 * IMPORTANT: content is fully visible by default (SSR + no-JS + reduced-motion)
 * and only *enhanced* with a CSS entrance animation. It must never render at
 * opacity:0 waiting for JS — that previously blanked whole homepage sections.
 */
export function MotionSection({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("jt-reveal", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

export function FadeIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("jt-fade", className)}>{children}</div>;
}
