import { cn } from "@/lib/cn";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  strong?: boolean;
};

export function GlassCard({
  children,
  className,
  hover = false,
  strong = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl text-foreground",
        strong ? "glass-panel-strong" : "glass-panel",
        hover &&
          "transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-card-hover",
        className,
      )}
    >
      {children}
    </div>
  );
}
