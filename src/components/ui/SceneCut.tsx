import { cn } from "@/lib/cn";

export function SceneCut({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "subtle";
}) {
  return (
    <div className={cn("relative py-4 md:py-5", className)} aria-hidden>
      <div className="absolute inset-0">
        <div
          className={cn(
            "absolute left-1/2 top-1/2 h-[220px] w-[min(1000px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl",
            variant === "subtle"
              ? "bg-[radial-gradient(circle,rgba(246,176,30,0.10)_0%,transparent_60%)]"
              : "bg-[radial-gradient(circle,rgba(255,122,0,0.12)_0%,transparent_62%)]",
          )}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
}

