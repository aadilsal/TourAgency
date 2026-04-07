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
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-brand-ink">Public contact settings</h2>
        <p className="mt-1 text-sm text-brand-muted">
          These values appear on the frontend contact and footer sections.
        </p>

        <form onSubmit={onSave} className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-slate-600">
            Office address
            <textarea
              rows={3}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              WhatsApp phone
              <input
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+92 300 1234567"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Public email
              <input
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="hello@example.com"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-slate-600">
            Google Maps embed URL
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={mapsEmbedUrl}
              onChange={(e) => setMapsEmbedUrl(e.target.value)}
              placeholder="https://www.google.com/maps/embed?..."
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save contact settings"}
            </Button>
            {msg ? <p className="text-sm text-brand-muted">{msg}</p> : null}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-brand-ink">Contact messages</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Messages submitted from the contact page and other lead forms.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                <tr key={lead._id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-ink">{lead.name}</td>
                  <td className="px-4 py-3 text-slate-700">{lead.phone}</td>
                  <td className="px-4 py-3 text-slate-700">{lead.source}</td>
                  <td className="max-w-[420px] px-4 py-3 text-slate-600">
                    {lead.message?.trim() || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(lead.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leads.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No contact messages yet.</p>
        ) : null}
      </section>
    </div>
  );
}
