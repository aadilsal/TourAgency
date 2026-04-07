"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useTransition } from "react";
import { Mail, Lock, User, Phone } from "lucide-react";
import { AuthSplitShell } from "@/components/AuthSplitShell";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput, FieldHint, FieldError } from "@/components/ui/FormField";
import { NavigationBlockingOverlay } from "@/components/ui/PageLoadingSpinner";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { analyzePassword } from "@/lib/passwordStrength";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNavPending, startTransition] = useTransition();

  const passwordOk = useMemo(
    () => analyzePassword(password).meetsMinimum,
    [password],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    if (!passwordOk) {
      setErr(
        "Password must meet every item in the checklist (length, mixed case, number, symbol).",
      );
      return;
    }
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        phone: phone || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(
        toUserFacingErrorMessage(
          (j as { error?: string }).error ?? "Registration failed",
        ),
      );
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("junket-auth-change"));
    }
    startTransition(() => {
      router.refresh();
      router.push("/dashboard");
    });
  }

  const busy = loading || isNavPending;

  return (
    <AuthSplitShell
      title="Create account"
      subtitle={
        <>
          Guest bookings with the same phone or email will link automatically.
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <FieldLabel htmlFor="reg-name" required>
            Name
          </FieldLabel>
          <TextInput
            id="reg-name"
            required
            autoComplete="name"
            icon={<User />}
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="reg-email" required>
            Email
          </FieldLabel>
          <TextInput
            id="reg-email"
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
          <FieldLabel htmlFor="reg-phone">Phone</FieldLabel>
          <TextInput
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            icon={<Phone />}
            placeholder="+92 300 1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <FieldHint>Helps link past guest bookings to your account.</FieldHint>
        </div>
        <div>
          <FieldLabel htmlFor="reg-pass" required>
            Password
          </FieldLabel>
          <TextInput
            id="reg-pass"
            type={showPw ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            icon={<Lock />}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordStrengthMeter password={password} />
        </div>
        <div>
          <FieldLabel htmlFor="reg-confirm" required>
            Confirm password
          </FieldLabel>
          <TextInput
            id="reg-confirm"
            type={showPw ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            icon={<Lock />}
            placeholder="Repeat password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={showPw}
            onChange={(e) => setShowPw(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show passwords
        </label>
        {err ? <FieldError>{err}</FieldError> : null}
        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          disabled={busy || !passwordOk}
        >
          {loading
            ? "Creating…"
            : isNavPending
              ? "Redirecting…"
              : "Create account"}
        </Button>
      </form>
      {isNavPending ? (
        <NavigationBlockingOverlay label="Redirecting…" variant="dark" />
      ) : null}
      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthSplitShell>
  );
}
