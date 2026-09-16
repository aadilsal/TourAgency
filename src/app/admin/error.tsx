"use client";

import { useEffect } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

/**
 * Admin route error boundary. Without this, any thrown Convex query (expired
 * session, deleted record, transient network error) blanked the whole admin
 * with Next's default crash screen and gave the admin no way to recover.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] route error", error);
  }, [error]);

  const message = toUserFacingErrorMessage(error);
  const lower = (error?.message ?? "").toLowerCase();
  const isAuth =
    lower.includes("not authenticated") ||
    lower.includes("unauthorized") ||
    lower.includes("admin access required");

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-foreground">
        {isAuth ? "Your admin session has ended" : "This admin page hit an error"}
      </h1>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {!isAuth && error?.message ? (
        <details className="mt-4 text-left text-xs text-slate-500">
          <summary className="cursor-pointer select-none">Technical details (send to support)</summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3">
            {error.message}
            {error.digest ? `\nDigest: ${error.digest}` : ""}
          </pre>
        </details>
      ) : null}
      {/*
        Recovery uses FULL page loads (plain <a> / location.reload), not client
        navigation: after a render crash the in-memory router/React state can be
        broken, which previously left every other admin page unable to open.
      */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {isAuth ? (
          <a href="/login?next=/admin" className={buttonClass("primary")}>
            Sign in again
          </a>
        ) : (
          <Button
            type="button"
            onClick={() => {
              reset();
              window.location.reload();
            }}
          >
            Reload page
          </Button>
        )}
        <a href="/admin" className={buttonClass("secondary")}>
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
