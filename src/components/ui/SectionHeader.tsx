import { cn } from "@/lib/cn";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  /** Use on dark / atmospheric page background (outside light cards) */
  variant?: "default" | "onDark";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  variant = "default",
}: Props) {
  const dark = variant === "onDark";
  return (
    <div
      className={cn(
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-widest",
            dark ? "text-brand-accent" : "text-brand-accent",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl",
          dark ? "text-white" : "text-brand-ink",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-3 text-base leading-relaxed",
            dark ? "text-slate-300" : "text-brand-muted",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
