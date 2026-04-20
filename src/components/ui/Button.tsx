import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export function buttonClass(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    variant === "primary" &&
      "bg-brand-cta text-white shadow-sm hover:bg-[#e66e00] focus-visible:outline-brand-sun",
    variant === "secondary" &&
      "border border-border bg-panel text-foreground shadow-sm hover:border-border-strong hover:bg-panel-elevated focus-visible:outline-brand-sun",
    variant === "ghost" &&
      "text-foreground hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-brand-sun",
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
