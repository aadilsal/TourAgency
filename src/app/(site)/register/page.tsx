"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useMemo, useTransition } from "react";
import { Mail, Lock, User, Phone } from "lucide-react";
import { AuthSplitShell } from "@/components/AuthSplitShell";
import { Button } from "@/components/ui/Button";
import {
  FieldLabel,
  TextInput,
  FieldHint,
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
  isValidPhone,
  type FieldErrorMap,
} from "@/lib/formValidation";

type RegisterField = "name" | "email" | "phone" | "password" | "confirm";
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap<RegisterField>>({});
  const [loading, setLoading] = useState(false);
  const [isNavPending, startTransition] = useTransition();
  const submittingRef = useRef(false);

  function clearFieldError(field: RegisterField) {
    setFieldErrors((x) => ({ ...x, [field]: undefined }));
  }

  const passwordOk = useMemo(
    () => analyzePassword(password).meetsMinimum,
    [password],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setErr(null);
    const next: FieldErrorMap<RegisterField> = {};
    if (!name.trim()) next.name = FORM_MESSAGES.nameRequired;
    if (!email.trim()) next.email = FORM_MESSAGES.emailRequired;
    else if (!isValidEmail(email)) next.email = FORM_MESSAGES.emailInvalid;
    if (phone.trim() && !isValidPhone(phone)) next.phone = FORM_MESSAGES.phoneInvalid;
    if (!password) next.password = "Please create a password.";
    else if (!passwordOk) {
      next.password =
        "Password must meet every item in the checklist (length, mixed case, number, symbol).";
    }
    if (!confirm) next.confirm = "Please repeat your password.";
    else if (password !== confirm) next.confirm = "Passwords do not match.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirstError([
        next.name && "reg-name",
        next.email && "reg-email",
        next.phone && "reg-phone",
        next.password && "reg-pass",
        next.confirm && "reg-confirm",
      ]);
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    let res: Response;
    try {
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
        }),
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
      <form onSubmit={onSubmit} noValidate className="space-y-4">
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
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            {...fieldErrorProps("reg-name", fieldErrors.name)}
          />
          <FieldError id={fieldErrorId("reg-name")}>{fieldErrors.name}</FieldError>
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
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            {...fieldErrorProps("reg-email", fieldErrors.email)}
          />
          <FieldError id={fieldErrorId("reg-email")}>{fieldErrors.email}</FieldError>
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
            onChange={(e) => {
              setPhone(e.target.value);
              clearFieldError("phone");
            }}
            {...fieldErrorProps("reg-phone", fieldErrors.phone)}
          />
          <FieldError id={fieldErrorId("reg-phone")}>{fieldErrors.phone}</FieldError>
          <FieldHint>Helps link past guest bookings to your account.</FieldHint>
        </div>
        <div>
          <FieldLabel htmlFor="reg-pass" required>
            Password
          </FieldLabel>
          <PasswordInput
            id="reg-pass"
            visible={showPw}
            onVisibleChange={setShowPw}
            required
            minLength={8}
            autoComplete="new-password"
            icon={<Lock />}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            {...fieldErrorProps("reg-pass", fieldErrors.password)}
          />
          <FieldError id={fieldErrorId("reg-pass")}>{fieldErrors.password}</FieldError>
          <PasswordStrengthMeter password={password} />
        </div>
        <div>
          <FieldLabel htmlFor="reg-confirm" required>
            Confirm password
          </FieldLabel>
          <PasswordInput
            id="reg-confirm"
            visible={showPw}
            onVisibleChange={setShowPw}
            required
            minLength={8}
            autoComplete="new-password"
            icon={<Lock />}
            placeholder="Repeat password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              clearFieldError("confirm");
            }}
            {...fieldErrorProps("reg-confirm", fieldErrors.confirm)}
          />
          <FieldError id={fieldErrorId("reg-confirm")}>{fieldErrors.confirm}</FieldError>
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
            ? "Creating…"
            : isNavPending
              ? "Redirecting…"
              : "Create account"}
        </Button>
      </form>
      {isNavPending ? (
        <NavigationBlockingOverlay label="Redirecting…" variant="dark" />
      ) : null}
      <p className="mt-4 text-center text-sm text-havezic-text">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-havezic-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthSplitShell>
  );
}
