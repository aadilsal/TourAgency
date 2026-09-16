"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { User, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FieldLabel,
  TextInput,
  FieldError,
  FormAlert,
  fieldErrorId,
  fieldErrorProps,
} from "@/components/ui/FormField";
import {
  FORM_MESSAGES,
  focusFirstError,
  isValidPhone,
  type FieldErrorMap,
} from "@/lib/formValidation";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

export function DashboardProfile() {
  const router = useRouter();
  const sessionToken = useConvexSessionToken();
  const user = useQuery(
    api.auth.getCurrentUser,
    sessionToken ? { sessionToken } : "skip",
  );
  const updateProfile = useMutation(api.auth.updateProfile);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap<"name" | "phone">>({});
  const prefilledFor = useRef<string | null>(null);

  // Prefill once per account so a reactive refresh never overwrites what the
  // visitor is typing (or has typed before a failed save).
  useEffect(() => {
    if (!user) return;
    if (prefilledFor.current === user._id) return;
    prefilledFor.current = user._id;
    setName(user.name);
    setPhone(user.phone ?? "");
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sessionToken === null || sessionToken === undefined) return;
    if (saving) return;
    setErr(null);
    setSaved(false);
    const next: FieldErrorMap<"name" | "phone"> = {};
    if (!name.trim()) next.name = FORM_MESSAGES.nameRequired;
    if (phone.trim() && !isValidPhone(phone)) next.phone = FORM_MESSAGES.phoneInvalid;
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirstError([next.name && "dash-name", next.phone && "dash-phone"]);
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        sessionToken,
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      setSaved(true);
      router.refresh();
    } catch (e) {
      setErr(toUserFacingErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (sessionToken === undefined) {
    return <p className="mt-6 text-sm text-slate-400">Loading…</p>;
  }
  if (sessionToken === null) {
    return (
      <p className="mt-6 text-sm text-slate-400">
        Sign in to manage your profile.
      </p>
    );
  }
  if (user === undefined) {
    return <p className="mt-6 text-sm text-slate-400">Loading…</p>;
  }
  if (user === null) {
    return (
      <p className="mt-6 text-sm text-slate-400">Session expired. Sign in again.</p>
    );
  }

  return (
    <Card className="mt-6 p-6">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <FieldLabel htmlFor="dash-email">Email</FieldLabel>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-brand-muted">
            <Mail className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            <span className="truncate">{user.email}</span>
          </div>
          <p className="mt-1 text-xs text-brand-muted">
            Email sign-in address; contact support to change it.
          </p>
        </div>

        <div>
          <FieldLabel htmlFor="dash-name" required>
            Name
          </FieldLabel>
          <div className="relative mt-1">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted"
              aria-hidden
            />
            <TextInput
              id="dash-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
                setFieldErrors((x) => ({ ...x, name: undefined }));
              }}
              className="pl-10"
              required
              autoComplete="name"
              {...fieldErrorProps("dash-name", fieldErrors.name)}
            />
          </div>
          <FieldError id={fieldErrorId("dash-name")}>{fieldErrors.name}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor="dash-phone">Phone</FieldLabel>
          <div className="relative mt-1">
            <Phone
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted"
              aria-hidden
            />
            <TextInput
              id="dash-phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSaved(false);
                setFieldErrors((x) => ({ ...x, phone: undefined }));
              }}
              className="pl-10"
              autoComplete="tel"
              placeholder="Optional"
              {...fieldErrorProps("dash-phone", fieldErrors.phone)}
            />
          </div>
          <FieldError id={fieldErrorId("dash-phone")}>{fieldErrors.phone}</FieldError>
        </div>

        <FormAlert>{err}</FormAlert>
        {saved ? (
          <p className="text-sm font-medium text-emerald-600" role="status">
            Profile updated.
          </p>
        ) : null}

        <Button type="submit" disabled={saving} aria-busy={saving}>
          {saving ? "Saving…" : "Update profile"}
        </Button>
      </form>
    </Card>
  );
}
