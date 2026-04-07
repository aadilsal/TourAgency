"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { User, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput, FieldError } from "@/components/ui/FormField";
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

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? "");
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sessionToken === null || sessionToken === undefined) return;
    setErr(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateProfile({
        sessionToken,
        name,
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
      <form onSubmit={onSubmit} className="space-y-5">
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
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
              required
              autoComplete="name"
            />
          </div>
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
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10"
              autoComplete="tel"
              placeholder="Optional"
            />
          </div>
        </div>

        {err ? <FieldError>{err}</FieldError> : null}
        {saved ? (
          <p className="text-sm font-medium text-emerald-600">Profile updated.</p>
        ) : null}

        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Saving…" : "Update profile"}
        </Button>
      </form>
    </Card>
  );
}
