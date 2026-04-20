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
        "rounded-2xl border border-border bg-panel text-foreground shadow-glass backdrop-blur-glass",
        hover &&
          "transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong",
        className,
      )}
    >
      {children}
    </div>
  );
}
