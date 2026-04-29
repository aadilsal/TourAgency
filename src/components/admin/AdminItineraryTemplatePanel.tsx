"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextAreaField, TextInput } from "@/components/ui/FormField";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";

type PaymentTerm = { percent: number; title: string; description?: string };
type TermsBlock = { title: string; body: string };

export function AdminItineraryTemplatePanel() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const snap = useQuery(
    api.siteSettings.getAdminSiteSettings,
    canQuery ? { sessionToken } : "skip",
  );
  const upsert = useMutation(api.siteSettings.upsertAdminSiteSettings);

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [bankName, setBankName] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [instruction, setInstruction] = useState("");
  const [termsBlocks, setTermsBlocks] = useState<TermsBlock[]>([]);
  const [defaultIncluded, setDefaultIncluded] = useState("");
  const [defaultNotIncluded, setDefaultNotIncluded] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!snap) return;
    setPaymentTerms([...(snap.paymentTerms ?? [])]);
    const b = snap.bankDetails;
    setBankName(b?.bankName ?? "");
    setAccountTitle(b?.accountTitle ?? "");
    setAccountNumber(b?.accountNumber ?? "");
    setIban(b?.iban ?? "");
    setInstruction(b?.instruction ?? "");
    setTermsBlocks([...(snap.termsBlocks ?? [])]);
    setDefaultIncluded((snap.defaultIncluded ?? []).join("\n"));
    setDefaultNotIncluded((snap.defaultNotIncluded ?? []).join("\n"));
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

  function saveSection() {
    if (typeof sessionToken !== "string") return;
    setSaving(true);
    setMsg(null);
    void (async () => {
      try {
        await upsert({
          sessionToken,
          paymentTerms,
          bankDetails: {
            bankName: bankName.trim() || undefined,
            accountTitle: accountTitle.trim() || undefined,
            accountNumber: accountNumber.trim() || undefined,
            iban: iban.trim() || undefined,
            instruction: instruction.trim() || undefined,
          },
          termsBlocks,
          defaultIncluded: defaultIncluded
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          defaultNotIncluded: defaultNotIncluded
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        });
        setMsg("Saved.");
      } catch (e) {
        setMsg(toUserFacingErrorMessage(e));
      } finally {
        setSaving(false);
      }
    })();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-semibold">These details appear on every itinerary PDF.</p>
        <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
          Change them once here. Trip-specific content is edited in{" "}
          <Link href="/admin/itineraries/new" className="font-semibold underline">
            Create itinerary
          </Link>
          .
        </p>
        <p className="mt-2">
          Office address, WhatsApp, email, and license:{" "}
          <Link href="/admin/settings" className="font-semibold underline">
            Admin Settings
          </Link>
          .
        </p>
      </div>

      {msg ? (
        <div className="rounded-xl border border-border bg-panel-elevated p-3 text-sm">{msg}</div>
      ) : null}

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Payment terms</p>
        <div className="mt-4 space-y-4">
          {paymentTerms.map((t, idx) => (
            <div
              key={idx}
              className="grid gap-3 rounded-xl border border-border bg-panel p-3 sm:grid-cols-12"
            >
              <div className="sm:col-span-2">
                <FieldLabel>Percent</FieldLabel>
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  value={t.percent}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPaymentTerms((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, percent: Number.isFinite(v) ? v : 0 } : x,
                      ),
                    );
                  }}
                />
              </div>
              <div className="sm:col-span-3">
                <FieldLabel>Title</FieldLabel>
                <TextInput
                  value={t.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPaymentTerms((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                    );
                  }}
                />
              </div>
              <div className="sm:col-span-6">
                <FieldLabel>Description</FieldLabel>
                <TextInput
                  value={t.description ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPaymentTerms((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, description: v } : x)),
                    );
                  }}
                />
              </div>
              <div className="flex items-end sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-red-700"
                  onClick={() =>
                    setPaymentTerms((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setPaymentTerms((prev) => [
                ...prev,
                { percent: 0, title: "", description: "" },
              ])
            }
          >
            + Add payment row
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Bank transfer</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Bank name</FieldLabel>
            <TextInput value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Account title</FieldLabel>
            <TextInput value={accountTitle} onChange={(e) => setAccountTitle(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Account number</FieldLabel>
            <TextInput value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          </div>
          <div>
            <FieldLabel>IBAN</FieldLabel>
            <TextInput value={iban} onChange={(e) => setIban(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>After-payment instruction (e.g. WhatsApp screenshot)</FieldLabel>
            <TextAreaField
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Terms &amp; conditions blocks
        </p>
        <div className="mt-4 space-y-4">
          {termsBlocks.map((b, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-panel p-3">
              <FieldLabel>Title</FieldLabel>
              <TextInput
                value={b.title}
                onChange={(e) => {
                  const v = e.target.value;
                  setTermsBlocks((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                  );
                }}
              />
              <div className="mt-2">
                <FieldLabel>Body</FieldLabel>
                <TextAreaField
                  rows={4}
                  value={b.body}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTermsBlocks((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, body: v } : x)),
                    );
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 text-red-700"
                onClick={() => setTermsBlocks((prev) => prev.filter((_, i) => i !== idx))}
              >
                Remove block
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setTermsBlocks((prev) => [...prev, { title: "", body: "" }])
            }
          >
            + Add terms block
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Default Included / Not included (new itineraries)
        </p>
        <p className="mt-1 text-sm text-muted">One line per item. Used when starting a new itinerary.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Default included</FieldLabel>
            <TextAreaField
              rows={8}
              value={defaultIncluded}
              onChange={(e) => setDefaultIncluded(e.target.value)}
              placeholder="Transport on Prado&#10;Daily breakfast"
            />
          </div>
          <div>
            <FieldLabel>Default not included</FieldLabel>
            <TextAreaField
              rows={8}
              value={defaultNotIncluded}
              onChange={(e) => setDefaultNotIncluded(e.target.value)}
              placeholder="Lunch &amp; dinner&#10;Air tickets"
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={saving} onClick={saveSection}>
          {saving ? "Saving…" : "Save itinerary constants"}
        </Button>
      </div>
    </div>
  );
}
