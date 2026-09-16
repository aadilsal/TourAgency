"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRef, useState, useTransition } from "react";
import { Mail, Lock } from "lucide-react";
import { AuthSplitShell } from "@/components/AuthSplitShell";
import { Button } from "@/components/ui/Button";
import {
  FieldLabel,
  TextInput,
  FieldError,
  FormAlert,
  fieldErrorId,
  fieldErrorProps,
} from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import {
  FORM_MESSAGES,
  focusFirstError,
  isValidEmail,
  type FieldErrorMap,
} from "@/lib/formValidation";
import { NavigationBlockingOverlay } from "@/components/ui/PageLoadingSpinner";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

function LoginPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrorMap<"email" | "password">
  >({});
  const [loading, setLoading] = useState(false);
  const [isNavPending, startTransition] = useTransition();
  const submittingRef = useRef(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setErr(null);
    const errs: FieldErrorMap<"email" | "password"> = {};
    if (!email.trim()) errs.email = FORM_MESSAGES.emailRequired;
    else if (!isValidEmail(email)) errs.email = FORM_MESSAGES.emailInvalid;
    if (!password) errs.password = "Please enter your password.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstError([errs.email && "login-email", errs.password && "login-pass"]);
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    let res: Response;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch (error) {
      setErr(toUserFacingErrorMessage(error));
      submittingRef.current = false;
      setLoading(false);
      return;
    }
    setLoading(false);
    submittingRef.current = false;
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
          <Link href="/register" className="font-semibold text-havezic-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
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
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((x) => ({ ...x, email: undefined }));
            }}
            {...fieldErrorProps("login-email", fieldErrors.email)}
          />
          <FieldError id={fieldErrorId("login-email")}>{fieldErrors.email}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="login-pass" required>
            Password
          </FieldLabel>
          <PasswordInput
            id="login-pass"
            required
            autoComplete="current-password"
            icon={<Lock />}
            placeholder="Your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((x) => ({ ...x, password: undefined }));
            }}
            {...fieldErrorProps("login-pass", fieldErrors.password)}
          />
          <FieldError id={fieldErrorId("login-pass")}>{fieldErrors.password}</FieldError>
        </div>
        <FormAlert>{err}</FormAlert>
        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          disabled={busy}
          aria-busy={busy}
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
