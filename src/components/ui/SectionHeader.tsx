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
  const onDark = variant === "onDark";
  return (
    <div
      className={cn(
        align === "center" && "mx-auto max-w-2xl text-center",
        onDark && "text-foreground",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.28em]",
            "text-havezic-primary",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          // Havezic h2: 48px / 1.125 on desktop; scale down for mobile.
          "mt-3 whitespace-pre-line text-[32px] font-semibold leading-[1.18] tracking-tight text-foreground sm:text-[40px] sm:leading-[1.14] lg:text-[48px] lg:leading-[1.125]",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-muted md:text-lg",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
