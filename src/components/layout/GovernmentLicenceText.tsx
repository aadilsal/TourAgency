import { governmentLicenceParts } from "@/lib/governmentLicenses";
import { cn } from "@/lib/cn";

type Props = {
  primary?: string;
  secondary?: string;
  className?: string;
  /** Render as stacked lines (website) or one inline line (compact). */
  variant?: "stacked" | "inline";
};

export function GovernmentLicenceText({
  primary,
  secondary,
  className,
  variant = "stacked",
}: Props) {
  const parts = governmentLicenceParts(primary, secondary);
  if (parts.length === 0) return null;

  if (variant === "inline") {
    return <p className={className}>{parts.join(" · ")}</p>;
  }

  return (
    <div className={cn("space-y-1", className)}>
      {parts.map((line) => (
        <p key={line} className="text-sm text-muted">
          {line}
        </p>
      ))}
    </div>
  );
}
