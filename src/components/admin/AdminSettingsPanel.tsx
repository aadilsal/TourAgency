"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldHint, FieldLabel, TextAreaField, TextInput } from "@/components/ui/FormField";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";

export function AdminSettingsPanel({ role: _role }: { role?: "admin" | "super_admin" }) {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const snap = useQuery(
    api.siteSettings.getAdminSiteSettings,
    canQuery ? { sessionToken } : "skip",
  );
  const upsert = useMutation(api.siteSettings.upsertAdminSiteSettings);
  const [officeAddress, setOfficeAddress] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [governmentLicenseNo, setGovernmentLicenseNo] = useState("");
  const [governmentLicenseNo2, setGovernmentLicenseNo2] = useState("");
  const [mapsEmbedUrl, setMapsEmbedUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!snap) return;
    setOfficeAddress(snap.officeAddress ?? "");
    setWhatsappPhone(snap.whatsappPhone ?? "");
    setContactEmail(snap.contactEmail ?? "");
    setWebsite((snap as { website?: string }).website ?? "");
    setGovernmentLicenseNo((snap as { governmentLicenseNo?: string }).governmentLicenseNo ?? "");
    setGovernmentLicenseNo2((snap as { governmentLicenseNo2?: string }).governmentLicenseNo2 ?? "");
    setMapsEmbedUrl(snap.mapsEmbedUrl ?? "");
  }, [snap]);

  if (!canQuery) {
    return (
      <p className="text-sm text-muted">
        {sessionToken === undefined ? "Loading…" : "You need an admin session."}
      </p>
    );
  }

  if (snap === undefined) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      {msg ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {msg}
        </div>
      ) : null}

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel>Office address</FieldLabel>
            <TextAreaField
              rows={3}
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>WhatsApp phone</FieldLabel>
            <TextInput
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Contact email</FieldLabel>
            <TextInput
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Website</FieldLabel>
            <TextInput value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Government license number (primary)</FieldLabel>
            <TextInput
              value={governmentLicenseNo}
              onChange={(e) => setGovernmentLicenseNo(e.target.value)}
              placeholder="e.g. DTS registration"
            />
          </div>
          <div>
            <FieldLabel>Government license number (secondary)</FieldLabel>
            <TextInput
              value={governmentLicenseNo2}
              onChange={(e) => setGovernmentLicenseNo2(e.target.value)}
              placeholder="e.g. second registration"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldHint>
              Shared across all admin and super admin accounts — shown on invoices and itinerary PDFs.
            </FieldHint>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Google Maps embed URL</FieldLabel>
            <TextInput
              value={mapsEmbedUrl}
              onChange={(e) => setMapsEmbedUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saving}
            onClick={() => {
              setSaving(true);
              setMsg(null);
              void (async () => {
                try {
                  await upsert({
                    sessionToken,
                    officeAddress,
                    whatsappPhone,
                    contactEmail,
                    website,
                    governmentLicenseNo,
                    governmentLicenseNo2,
                    mapsEmbedUrl,
                  });
                  setMsg("Saved.");
                } catch (e) {
                  setMsg(toUserFacingErrorMessage(e));
                } finally {
                  setSaving(false);
                }
              })();
            }}
          >
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
