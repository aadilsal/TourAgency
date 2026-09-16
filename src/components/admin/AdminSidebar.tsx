"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { isAdminNavLinkActive, visibleAdminNav } from "@/components/admin/shared/adminNav";

export function AdminSidebar({
  showManageAdmins,
}: {
  showManageAdmins: boolean;
}) {
  const pathname = usePathname();
  const sections = useMemo(() => visibleAdminNav(showManageAdmins), [showManageAdmins]);

  return (
    <aside className="hidden w-60 shrink-0 md:block">
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-border bg-panel p-3 shadow-sm backdrop-blur-xl">
        <nav aria-label="Admin" className="flex flex-col gap-3">
          {sections.map((sec) => (
            <div key={sec.id}>
              {sec.id !== "overview" ? (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  {sec.label}
                </p>
              ) : null}
              <ul className="flex flex-col gap-0.5">
                {sec.links.map((l) => {
                  const active = isAdminNavLinkActive(pathname, l);
                  const Icon = l.icon;
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                          active
                            ? "bg-brand-sun/18 text-foreground ring-1 ring-brand-sun/25"
                            : "text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? "text-brand-sun" : "opacity-70",
                          )}
                          aria-hidden
                        />
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
