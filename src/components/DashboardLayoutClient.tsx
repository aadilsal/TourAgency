"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCircle } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function DashboardLayoutClient({
  email,
  name,
  role,
  showAdminLink,
  children,
}: {
  email: string;
  name: string;
  role: string;
  showAdminLink: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const onBookings = pathname === "/dashboard/bookings" || pathname === "/dashboard";
  const onProfile = pathname === "/dashboard/profile";

  return (
    <main className="min-h-screen py-12 md:py-16">
      <PageContainer>
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
          <aside className="w-full shrink-0 lg:w-56">
            <Card className="overflow-hidden p-0 ring-1 ring-white/15 lg:sticky lg:top-28">
              <div className="border-b border-slate-100 bg-gradient-to-br from-brand-primary/10 to-transparent p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">
                  Account
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-brand-ink">
                  {name || email}
                </p>
                <p className="truncate text-xs text-brand-muted">{email}</p>
                <p className="mt-1 text-xs capitalize text-brand-muted">
                  {role.replace("_", " ")}
                </p>
              </div>
              <nav className="flex flex-col p-2 lg:flex-col">
                <Link
                  href="/dashboard/bookings"
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    onBookings
                      ? "bg-brand-primary text-white shadow-md"
                      : "text-brand-muted hover:bg-slate-100",
                  )}
                >
                  <LayoutDashboard className="h-4 w-4 opacity-80" />
                  Bookings
                </Link>
                <Link
                  href="/dashboard/profile"
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    onProfile
                      ? "bg-brand-primary text-white shadow-md"
                      : "text-brand-muted hover:bg-slate-100",
                  )}
                >
                  <UserCircle className="h-4 w-4 opacity-80" />
                  Profile
                </Link>
              </nav>
              {showAdminLink ? (
                <div className="border-t border-slate-100 p-3">
                  <Link
                    href="/admin"
                    className="block rounded-xl px-3 py-2 text-center text-sm font-semibold text-brand-accent hover:bg-slate-50"
                  >
                    Admin panel →
                  </Link>
                </div>
              ) : null}
            </Card>
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </PageContainer>
    </main>
  );
}
