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
          "mt-3 whitespace-pre-line text-3xl font-semibold tracking-tight text-foreground md:text-5xl",
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
