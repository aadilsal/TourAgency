import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/30 bg-white/90 shadow-glass backdrop-blur-glass",
        hover && "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover",
        className,
      )}
    >
      {children}
    </div>
  );
}
