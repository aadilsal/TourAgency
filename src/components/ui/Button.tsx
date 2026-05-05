import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export function buttonClass(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return cn(
    // 44px minimum touch target (h-11) for accessibility on mobile.
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    variant === "primary" &&
      "bg-havezic-primary text-white shadow-sm hover:bg-havezic-primary-hover focus-visible:outline-havezic-primary",
    variant === "secondary" &&
      "border border-border bg-white text-foreground shadow-sm hover:border-border-strong hover:bg-havezic-background-light focus-visible:outline-havezic-primary",
    variant === "ghost" &&
      "text-foreground hover:bg-black/5 focus-visible:outline-havezic-primary",
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonClass(variant, className)} {...props} />
  );
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  className?: string;
};

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
