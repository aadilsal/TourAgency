import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { PageContainer } from "@/components/ui/PageContainer";

type Props = {
  email: string;
  role: string;
};

export function AdminTopBar({ email, role }: Props) {
  const roleLabel = role.replace("_", " ");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-panel shadow-sm backdrop-blur-xl">
      <PageContainer className="flex flex-wrap items-center justify-between gap-3 py-3.5 md:py-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight text-foreground hover:text-brand-sun"
          >
            JunketTours
          </Link>
          <span
            className="hidden h-5 w-px shrink-0 bg-border sm:block"
            aria-hidden
          />
          <span className="rounded-lg bg-brand-sun/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-sun ring-1 ring-brand-sun/30 sm:text-xs">
            Admin
          </span>
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-2 sm:gap-3">
          <span
            className="max-w-[140px] truncate text-xs text-muted sm:max-w-[220px] sm:text-sm"
            title={email}
          >
            {email}
          </span>
          <span className="rounded-full bg-brand-forest/12 px-2 py-0.5 text-[10px] font-bold capitalize text-brand-forest ring-1 ring-brand-forest/25 sm:text-xs">
            {roleLabel}
          </span>
          <Link
            href="/"
            className="text-xs font-semibold text-brand-cta underline-offset-2 hover:underline sm:text-sm"
          >
            View site
          </Link>
          <LogoutButton />
        </div>
      </PageContainer>
    </header>
  );
}
