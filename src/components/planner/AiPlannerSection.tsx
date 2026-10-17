"use client";

import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldLabel, TextAreaField, FieldError } from "@/components/ui/FormField";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

export function AiPlannerSection() {
  const sessionToken = useConvexSessionToken();
  const generate = useAction(api.ai.generateTrip);
  const [q, setQ] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setOut(null);
    try {
      const res = await generate({
        query: q,
        sessionToken: sessionToken ?? undefined,
      });
      setOut(res.output);
    } catch (er) {
      setErr(toUserFacingErrorMessage(er));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto mt-20 max-w-2xl">
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-2 text-brand-primary">
          <Sparkles className="h-5 w-5" aria-hidden />
          <h2 className="text-lg font-bold text-brand-ink">AI trip planner</h2>
        </div>
        <p className="mt-1 text-sm text-brand-muted">
          Describe your trip; we&apos;ll match our catalog (structured intent +
          live packages).
        </p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <FieldLabel htmlFor="ai-legacy-q" required>
              Your trip idea
            </FieldLabel>
            <TextAreaField
              id="ai-legacy-q"
              rows={4}
              placeholder="e.g. 6 days, moderate budget, family-friendly, want lakes and forts"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Planning…" : "Generate plan"}
          </Button>
        </form>
        {err ? (
          <div className="mt-3">
            <FieldError>{err}</FieldError>
          </div>
        ) : null}
        {out ? (
          <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-900 p-4 text-left text-xs text-slate-100">
            {out}
          </pre>
        ) : null}
      </Card>
    </section>
  );
}
