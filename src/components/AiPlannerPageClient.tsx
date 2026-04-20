"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Loader2,
  MapPin,
  Calendar,
  Wallet,
  Download,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  FieldLabel,
  TextInput,
  TextAreaField,
  FieldHint,
  FieldError,
} from "@/components/ui/FormField";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { formatPlannerReply, type PlannerPlan } from "@/lib/planner-reply";

type ChatMsg = { role: "user" | "assistant"; content: string };

type PlanPayload = PlannerPlan;

function buildUserPrompt(
  budget: string,
  duration: string,
  departureCity: string,
  preferences: string,
) {
  const lines: string[] = [];
  lines.push(
    budget.trim()
      ? `Budget: approximately PKR ${budget.trim()} (interpret as total trip budget unless clearly per-person).`
      : "Budget: flexible — suggest good value options.",
  );
  lines.push(
    duration.trim()
      ? `Trip duration: ${duration.trim()} days.`
      : "Trip duration: not fixed — propose a realistic length.",
  );
  lines.push(
    departureCity.trim()
      ? `Departure / home city: ${departureCity.trim()}.`
      : "Departure city: not specified — assume typical gateway (e.g. Islamabad) where relevant.",
  );
  lines.push(`Preferences & travel style: ${preferences.trim()}`);
  return lines.join(" ");
}

function formatPlanForFile(
  reply: string,
  plan: PlanPayload,
  formSummary: string,
) {
  let out = `JunketTours — AI trip plan\n${"=".repeat(40)}\n\n`;
  out += `Your request:\n${formSummary}\n\n`;
  out += `Summary:\n${reply}\n\n`;
  if (plan.itinerary.length > 0) {
    out += `Day-by-day:\n`;
    plan.itinerary.forEach((d) => {
      out += `\nDay ${d.day}: ${d.title}\n${d.detail}\n`;
    });
    out += "\n";
  }
  if (plan.recommendedSlugs.length > 0) {
    out += `Recommended tour slugs: ${plan.recommendedSlugs.join(", ")}\n`;
  }
  if (plan.proposesCustomPlan && plan.customPlanDraft) {
    out += `\nCustom route draft:\n${plan.customPlanDraft}\n`;
  }
  out += `\nGenerated via junkettours.com/ai-planner\n`;
  return out;
}

function formatPlanForTeamRequest(
  reply: string,
  plan: PlanPayload,
  formSummary: string,
) {
  // Keep a compact but useful payload for ops.
  let out = formatPlanForFile(reply, plan, formSummary);
  if (out.length > 12000) out = out.slice(0, 11950) + "\n…(trimmed)\n";
  return out;
}

export function AiPlannerPageClient() {
  const sessionToken = useConvexSessionToken();
  const plannerChat = useAction(api.ai.plannerChat);
  const submitCustom = useAction(api.ai.submitCustomPlanRequest);
  const user = useQuery(
    api.auth.getCurrentUser,
    sessionToken ? { sessionToken } : "skip",
  );

  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [preferences, setPreferences] = useState("");

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [reply, setReply] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [refineInput, setRefineInput] = useState("");

  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPreferredStart, setCPreferredStart] = useState("");
  const [cPreferredEnd, setCPreferredEnd] = useState("");
  const [cAdults, setCAdults] = useState(2);
  const [cChildren, setCChildren] = useState(0);
  const [customSending, setCustomSending] = useState(false);
  const [customDone, setCustomDone] = useState(false);
  const didPrefill = useRef(false);

  useEffect(() => {
    if (didPrefill.current) return;
    if (sessionToken === undefined) return;
    if (sessionToken === null) return;
    if (!user) return;
    setCName((v) => (v.trim() ? v : user.name));
    setCPhone((v) => (v.trim() ? v : user.phone ?? ""));
    setCEmail((v) => (v.trim() ? v : user.email));
    didPrefill.current = true;
  }, [sessionToken, user]);

  const formSummary = useMemo(
    () => buildUserPrompt(budget, duration, departureCity, preferences),
    [budget, duration, departureCity, preferences],
  );

  const canGenerate =
    duration.trim().length > 0 && preferences.trim().length > 0;

  async function runPlanner(nextMessages: ChatMsg[]) {
    setLoading(true);
    setErr(null);
    try {
      const res = await plannerChat({
        messages: nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        sessionToken: sessionToken ?? undefined,
      });
      const nextPlan = {
        recommendedSlugs: res.recommendedSlugs ?? [],
        itinerary: res.itinerary ?? [],
        proposesCustomPlan: Boolean(res.proposesCustomPlan),
        customPlanDraft: res.customPlanDraft ?? "",
      };
      const assistantMsg: ChatMsg = {
        role: "assistant",
        content: formatPlannerReply(res.reply, nextPlan),
      };
      setMessages([...nextMessages, assistantMsg]);
      setReply(formatPlannerReply(res.reply, nextPlan));
      setPlan(nextPlan);
      if (!res.proposesCustomPlan) setCustomDone(false);
    } catch (e) {
      setErr(toUserFacingErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePlan() {
    if (!canGenerate) return;
    const userMsg: ChatMsg = { role: "user", content: formSummary };
    setRefineInput("");
    await runPlanner([userMsg]);
  }

  async function handleRefine() {
    const text = refineInput.trim();
    if (!text || loading || messages.length === 0) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setRefineInput("");
    await runPlanner(next);
  }

  function handleSavePlan() {
    if (!plan) return;
    const blob = new Blob(
      [formatPlanForFile(reply ?? "", plan, formSummary)],
      {
        type: "text/plain;charset=utf-8",
      },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `junkettours-plan-${new Date().toISOString().slice(0, 10)}.txt`;
    a.rel = "noopener";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onSubmitCustom() {
    if (!plan) return;
    if (!cName.trim() || !cPhone.trim() || !cEmail.trim()) {
      setErr("Please add your name, phone, and email so we can follow up.");
      return;
    }
    setCustomSending(true);
    setErr(null);
    try {
      const summary = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join(" | ")
        .slice(0, 1500);
      await submitCustom({
        name: cName.trim(),
        phone: cPhone.trim(),
        email: cEmail.trim(),
        summary,
        proposal: formatPlanForTeamRequest(reply ?? "", plan, formSummary),
        thread: messages.slice(-80).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        sessionToken: sessionToken ?? undefined,
        preferredStart: cPreferredStart.trim() || undefined,
        preferredEnd: cPreferredEnd.trim() || undefined,
        adults: cAdults > 0 ? cAdults : undefined,
        children: cChildren > 0 ? cChildren : undefined,
      });
      setCustomDone(true);
    } catch (e) {
      setErr(toUserFacingErrorMessage(e));
    } finally {
      setCustomSending(false);
    }
  }

  const hasAssistantMessage = messages.some((m) => m.role === "assistant");
  const showFullPageLoader = loading && !hasAssistantMessage;
  const showOutput = hasAssistantMessage;

  return (
    <div className="space-y-12 lg:space-y-16">
      {/* Input section */}
      <Card className="p-6 md:p-8 lg:p-10">
        <div className="flex items-center gap-2 text-brand-primary">
          <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
          <h2 className="text-lg font-bold text-brand-ink md:text-xl">
            Tell us about your trip
          </h2>
        </div>
        <p className="mt-2 text-sm text-brand-muted">
          We match you to real catalog tours and build a day-by-day outline. Add
          a follow-up after you generate to tweak the plan.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="ai-budget">Budget (PKR)</FieldLabel>
            <TextInput
              id="ai-budget"
              inputMode="numeric"
              placeholder="e.g. 150000"
              icon={<Wallet className="h-4 w-4" />}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
            <FieldHint>Approximate total or leave blank for flexible options.</FieldHint>
          </div>
          <div>
            <FieldLabel htmlFor="ai-duration" required>
              Duration (days)
            </FieldLabel>
            <TextInput
              id="ai-duration"
              inputMode="numeric"
              placeholder="e.g. 7"
              icon={<Calendar className="h-4 w-4" />}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="ai-city">Departure city</FieldLabel>
            <TextInput
              id="ai-city"
              placeholder="e.g. Islamabad, Lahore, Karachi"
              icon={<MapPin className="h-4 w-4" />}
              value={departureCity}
              onChange={(e) => setDepartureCity(e.target.value)}
            />
            <FieldHint>Helps with transport and timing on the ground.</FieldHint>
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="ai-prefs" required>
              Preferences
            </FieldLabel>
            <TextAreaField
              id="ai-prefs"
              rows={4}
              placeholder="e.g. Family with teens, easy hikes only, lakes and viewpoints, mid-range hotels, avoid long drives…"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
          </div>
        </div>

        {err && !showOutput ? <FieldError>{err}</FieldError> : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="primary"
            className="gap-2 px-8 py-3.5 text-base shadow-lg shadow-orange-500/20"
            disabled={loading || !canGenerate}
            onClick={() => void handleGeneratePlan()}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" aria-hidden />
                Generate plan
              </>
            )}
          </Button>
          {!canGenerate ? (
            <p className="text-xs text-amber-800/90">
              Add trip <strong>duration</strong> and <strong>preferences</strong>{" "}
              to continue.
            </p>
          ) : null}
        </div>
      </Card>

      {/* Loading animation */}
      <AnimatePresence>
        {showFullPageLoader && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/15 bg-white/5 px-6 py-14 backdrop-blur-sm">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-brand-accent/30 opacity-40" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/90 text-white shadow-lg shadow-brand-accent/25">
                  <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
                </div>
              </div>
              <p className="text-center font-medium text-slate-200">
                Crafting your northern Pakistan route…
              </p>
              <p className="max-w-md text-center text-sm text-slate-400">
                Matching live tours, building day-by-day notes, and checking
                what fits your budget and style.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-2xl bg-white/10"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output */}
      <AnimatePresence mode="wait">
        {showOutput ? (
          <motion.div
            key="output"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Updating your plan…
              </div>
            ) : null}
            <div className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
                Your plan
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2 py-3"
                  onClick={handleSavePlan}
                >
                  <Download className="h-4 w-4" />
                  Save plan
                </Button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-brand-accent/20 bg-gradient-to-br from-white/95 to-slate-50/95 p-6 shadow-glass">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-accent">
                  Overview
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-ink md:text-base">
                  {reply?.trim()
                    ? reply
                    : "Your day-by-day outline and matching tours are below."}
                </p>
              </Card>
            </motion.div>

            <Card className="border-amber-200/60 bg-amber-50/95 p-6">
              <p className="text-xs font-bold uppercase text-amber-900">
                Request a booking consultation
              </p>
              <p className="mt-2 text-sm text-amber-950/85">
                Share your details and we&apos;ll review this plan, confirm
                availability, and contact you with next steps.
              </p>
              {customDone ? (
                <p className="mt-4 text-sm font-semibold text-emerald-700">
                  Request sent — we&apos;ll contact you soon.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="lead-name" required>
                      Name
                    </FieldLabel>
                    <TextInput
                      id="lead-name"
                      placeholder={sessionToken ? undefined : "e.g. Aadil"}
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="lead-phone" required>
                      Phone (WhatsApp preferred)
                    </FieldLabel>
                    <TextInput
                      id="lead-phone"
                      type="tel"
                      placeholder={sessionToken ? undefined : "e.g. +92 300 1234567"}
                      value={cPhone}
                      onChange={(e) => setCPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="lead-email" required>
                      Email
                    </FieldLabel>
                    <TextInput
                      id="lead-email"
                      type="email"
                      placeholder={sessionToken ? undefined : "e.g. name@email.com"}
                      value={cEmail}
                      onChange={(e) => setCEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="lead-s">Trip start</FieldLabel>
                    <TextInput
                      id="lead-s"
                      type="date"
                      value={cPreferredStart}
                      onChange={(e) => setCPreferredStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="lead-e">Trip end</FieldLabel>
                    <TextInput
                      id="lead-e"
                      type="date"
                      value={cPreferredEnd}
                      onChange={(e) => setCPreferredEnd(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="lead-a">Adults</FieldLabel>
                    <TextInput
                      id="lead-a"
                      type="number"
                      min={1}
                      value={cAdults}
                      onChange={(e) =>
                        setCAdults(Number.parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="lead-c">Children</FieldLabel>
                    <TextInput
                      id="lead-c"
                      type="number"
                      min={0}
                      value={cChildren}
                      onChange={(e) =>
                        setCChildren(Number.parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full py-3"
                      disabled={customSending}
                      onClick={() => void onSubmitCustom()}
                    >
                      {customSending ? "Sending…" : "Send to our team"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Refine + lead capture hint */}
            <Card className="p-6">
              <h3 className="font-semibold text-brand-ink">Refine this plan</h3>
              <p className="mt-1 text-sm text-brand-muted">
                Ask for changes — e.g. shorter drives, different region, or
                budget tweak.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <TextAreaField
                  rows={2}
                  className="min-h-[52px] flex-1"
                  placeholder="e.g. Can we swap day 3 for more rest in Hunza?"
                  value={refineInput}
                  onChange={(e) => setRefineInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleRefine();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 sm:self-end"
                  disabled={loading || !refineInput.trim()}
                  onClick={() => void handleRefine()}
                >
                  Send
                </Button>
              </div>
            </Card>

            <p className="text-center text-sm text-slate-500">
              Prefer WhatsApp?{" "}
              <Link
                href="/"
                className="font-semibold text-brand-accent hover:underline"
              >
                Contact links on the homepage
              </Link>{" "}
              <MessageCircle className="inline h-4 w-4 align-text-bottom text-brand-accent" />
            </p>

            {err && showOutput ? (
              <div className="text-center">
                <FieldError>{err}</FieldError>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
