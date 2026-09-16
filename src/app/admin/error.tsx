"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
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
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {isAuth ? (
          <ButtonLink href="/login?next=/admin">Sign in again</ButtonLink>
        ) : (
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
        )}
        <ButtonLink href="/admin" variant="secondary">
          Back to dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
