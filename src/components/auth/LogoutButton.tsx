"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function LogoutButton({ className }: { className?: string }) {
  const [loggingOut, setLoggingOut] = useState(false);

  const busy = loggingOut;

  return (
      <button
        type="button"
        className={cn(
          "text-sm font-medium text-brand-muted hover:text-brand-ink disabled:opacity-50",
          className,
        )}
        disabled={busy}
        onClick={async () => {
          setLoggingOut(true);
          try {
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "same-origin",
            });
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("junket-auth-change"));
              window.location.assign("/");
            }
          } finally {
            setLoggingOut(false);
          }
        }}
      >
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
  );
}
