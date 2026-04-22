"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useState, useTransition } from "react";
import { Mail, Lock } from "lucide-react";
import { AuthSplitShell } from "@/components/AuthSplitShell";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput, FieldError } from "@/components/ui/FormField";
import { NavigationBlockingOverlay } from "@/components/ui/PageLoadingSpinner";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

function LoginPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNavPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(
        toUserFacingErrorMessage(
          (j as { error?: string }).error ?? "Login failed",
        ),
      );
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("junket-auth-change"));
    }
    startTransition(() => {
      router.refresh();
      router.push(next);
    });
  }

  const busy = loading || isNavPending;

  return (
    <AuthSplitShell
      title="Log in"
      subtitle={
        <>
          No account?{" "}
          <Link href="/register" className="font-semibold text-brand-accent hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <FieldLabel htmlFor="login-email" required>
            Email
          </FieldLabel>
          <TextInput
            id="login-email"
            type="email"
            required
            autoComplete="email"
            icon={<Mail />}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="login-pass" required>
            Password
          </FieldLabel>
          <TextInput
            id="login-pass"
            type="password"
            required
            autoComplete="current-password"
            icon={<Lock />}
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {err ? <FieldError>{err}</FieldError> : null}
        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          disabled={busy}
        >
          {loading
            ? "Signing in…"
            : isNavPending
              ? "Redirecting…"
              : "Sign in"}
        </Button>
      </form>
      {isNavPending ? (
        <NavigationBlockingOverlay label="Redirecting…" variant="dark" />
      ) : null}
    </AuthSplitShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
