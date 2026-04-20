"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

export function AdminContactPanel() {
  const settings = useQuery(api.siteSettings.getAdminSiteSettings, {});
  const leads = useQuery(api.leads.getLeads, {});
  const upsert = useMutation(api.siteSettings.upsertAdminSiteSettings);

  const [officeAddress, setOfficeAddress] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [mapsEmbedUrl, setMapsEmbedUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setOfficeAddress(settings.officeAddress ?? "");
    setWhatsappPhone(settings.whatsappPhone ?? "");
    setContactEmail(settings.contactEmail ?? "");
    setMapsEmbedUrl(settings.mapsEmbedUrl ?? "");
  }, [settings]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      await upsert({
        officeAddress,
        whatsappPhone,
        contactEmail,
        mapsEmbedUrl,
      });
      setMsg("Contact settings updated.");
    } catch (error) {
      setMsg(toUserFacingErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (settings === undefined || leads === undefined) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-panel p-5 shadow-sm backdrop-blur-xl">
        <h2 className="text-lg font-bold text-foreground">Public contact settings</h2>
        <p className="mt-1 text-sm text-muted">
          These values appear on the frontend contact and footer sections.
        </p>

        <form onSubmit={onSave} className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-muted">
            Office address
            <textarea
              rows={3}
              required
              className="mt-1 w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sun"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-muted">
              WhatsApp phone
              <input
                required
                className="mt-1 w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sun"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+92 300 1234567"
              />
            </label>
            <label className="block text-xs font-semibold text-muted">
              Public email
              <input
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sun"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="hello@example.com"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-muted">
            Google Maps embed URL
            <input
              className="mt-1 w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sun"
              value={mapsEmbedUrl}
              onChange={(e) => setMapsEmbedUrl(e.target.value)}
              placeholder="https://www.google.com/maps/embed?..."
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save contact settings"}
            </Button>
            {msg ? <p className="text-sm text-muted">{msg}</p> : null}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-panel shadow-sm backdrop-blur-xl">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">Contact messages</h2>
          <p className="mt-1 text-sm text-muted">
            Messages submitted from the contact page and other lead forms.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="border-b border-border bg-black/5 text-xs font-semibold uppercase tracking-wide text-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Received</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
                  <td className="px-4 py-3 text-muted">{lead.phone}</td>
                  <td className="px-4 py-3 text-muted">{lead.source}</td>
                  <td className="max-w-[420px] px-4 py-3 text-muted">
                    {lead.message?.trim() || "-"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(lead.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leads.length === 0 ? (
          <p className="p-5 text-sm text-muted">No contact messages yet.</p>
        ) : null}
      </section>
    </div>
  );
}
