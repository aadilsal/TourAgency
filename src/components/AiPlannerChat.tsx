"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FORM_MESSAGES,
  focusFirstError,
  isValidEmail,
  isValidPhone,
  thankYouHref,
  type FieldErrorMap,
} from "@/lib/formValidation";

type LeadField = "name" | "phone" | "email" | "start" | "end" | "adults";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  FieldError,
  FieldLabel,
  FormAlert,
  TextInput,
  fieldErrorId,
  fieldErrorProps,
} from "@/components/ui/FormField";
import { cn } from "@/lib/cn";
import { PLANNER_WELCOME_MESSAGE } from "@/lib/planner-welcome";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { formatPlannerReply, type PlannerPlan } from "@/lib/planner-reply";
import { todayYmdLocal } from "@/lib/todayYmdLocal";

type Msg = { role: "user" | "assistant"; content: string };

type PlanPayload = PlannerPlan;

const WELCOME: Msg = {
  role: "assistant",
  content: PLANNER_WELCOME_MESSAGE,
};

function planFromResponse(res: {
  recommendedSlugs?: string[];
  itinerary?: Array<{ day: number; title: string; detail: string }>;
  proposesCustomPlan?: boolean;
  customPlanDraft?: string;
}): PlanPayload {
  return {
    recommendedSlugs: res.recommendedSlugs ?? [],
    itinerary: res.itinerary ?? [],
    proposesCustomPlan: Boolean(res.proposesCustomPlan),
    customPlanDraft: res.customPlanDraft ?? "",
  };
}

export function AiPlannerChat({
  compact,
  guestSessionId,
  variant = "default",
}: {
  compact?: boolean;
  guestSessionId?: string | null;
  variant?: "default" | "widget";
}) {
  const sessionToken = useConvexSessionToken();
  const minDate = todayYmdLocal();
  const plannerChat = useAction(api.ai.plannerChat);
  const submitCustom = useAction(api.ai.submitCustomPlanRequest);
  const ensureSession = useMutation(api.plannerChatSessions.ensureSession);
  const syncMessages = useMutation(api.plannerChatSessions.syncMessages);
  const user = useQuery(
    api.auth.getCurrentUser,
    sessionToken ? { sessionToken } : "skip",
  );

  const sessionQuery = useQuery(
    api.plannerChatSessions.getByGuestId,
    guestSessionId ? { guestSessionId } : "skip",
  );

  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const appliedRemoteAt = useRef<number | null>(null);
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPreferredStart, setCPreferredStart] = useState("");
  const [cPreferredEnd, setCPreferredEnd] = useState("");
  const [cAdults, setCAdults] = useState(2);
  const [cChildren, setCChildren] = useState(0);
  const [customSending, setCustomSending] = useState(false);
  const [customDone, setCustomDone] = useState(false);
  const [leadErrors, setLeadErrors] = useState<FieldErrorMap<LeadField>>({});
  const [customErr, setCustomErr] = useState<string | null>(null);
  const customSubmittingRef = useRef(false);
  const router = useRouter();
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

  useEffect(() => {
    appliedRemoteAt.current = null;
  }, [guestSessionId]);

  useEffect(() => {
    if (!guestSessionId) return;
    void ensureSession({
      guestSessionId,
      sessionToken: sessionToken ?? undefined,
    });
  }, [guestSessionId, sessionToken, ensureSession]);

  useEffect(() => {
    if (!guestSessionId) return;
    if (sessionQuery === undefined) return;
    if (sessionQuery === null) {
      setMessages([WELCOME]);
      setPlan(null);
      return;
    }
    if (appliedRemoteAt.current === sessionQuery.updatedAt) return;
    appliedRemoteAt.current = sessionQuery.updatedAt;
    setMessages(
      sessionQuery.messages.length > 0 ? sessionQuery.messages : [WELCOME],
    );
    if (sessionQuery.planSnapshot) {
      try {
        const p = JSON.parse(sessionQuery.planSnapshot) as PlanPayload;
        setPlan({
          recommendedSlugs: p.recommendedSlugs ?? [],
          itinerary: p.itinerary ?? [],
          proposesCustomPlan: Boolean(p.proposesCustomPlan),
          customPlanDraft: p.customPlanDraft ?? "",
        });
      } catch {
        setPlan(null);
      }
    } else {
      setPlan(null);
    }
  }, [guestSessionId, sessionQuery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, plan]);

  const persistThread = useCallback(
    async (thread: Msg[], nextPlan: PlanPayload | null) => {
      if (!guestSessionId) return;
      try {
        await ensureSession({
          guestSessionId,
          sessionToken: sessionToken ?? undefined,
        });
        await syncMessages({
          guestSessionId,
          messages: thread.slice(-80),
          planSnapshot:
            nextPlan &&
            (nextPlan.recommendedSlugs.length > 0 ||
              nextPlan.itinerary.length > 0 ||
              nextPlan.proposesCustomPlan)
              ? JSON.stringify(nextPlan)
              : undefined,
          sessionToken: sessionToken ?? undefined,
        });
      } catch {
        /* persistence is best-effort */
      }
    },
    [guestSessionId, sessionToken, ensureSession, syncMessages],
  );

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setErr(null);
    const thread = [...messages, { role: "user" as const, content: text }];
    setMessages(thread);
    setLoading(true);
    try {
      if (guestSessionId) {
        await ensureSession({
          guestSessionId,
          sessionToken: sessionToken ?? undefined,
        });
      }
      const res = await plannerChat({
        messages: thread.map((m) => ({ role: m.role, content: m.content })),
        sessionToken: sessionToken ?? undefined,
      });
      const nextPlan = planFromResponse(res);
      const assistantMsg: Msg = {
        role: "assistant",
        content: formatPlannerReply(res.reply, nextPlan),
      };
      const after = [...thread, assistantMsg];
      setMessages(after);
      setPlan(nextPlan);
      if (!res.proposesCustomPlan) {
        setCustomDone(false);
      }
      void persistThread(after, nextPlan);
    } catch (e) {
      setErr(toUserFacingErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function clearLeadError(field: LeadField) {
    setLeadErrors((x) => ({ ...x, [field]: undefined }));
  }

  function validateCustomLead() {
    const next: FieldErrorMap<LeadField> = {};
    if (!cName.trim()) next.name = FORM_MESSAGES.nameRequired;
    if (!cPhone.trim()) next.phone = FORM_MESSAGES.phoneRequired;
    else if (!isValidPhone(cPhone)) next.phone = FORM_MESSAGES.phoneInvalid;
    if (!cEmail.trim()) next.email = FORM_MESSAGES.emailRequired;
    else if (!isValidEmail(cEmail)) next.email = FORM_MESSAGES.emailInvalid;
    if (cPreferredStart && cPreferredStart < minDate) {
      next.start = "Past dates can't be selected.";
    }
    if (cPreferredEnd && cPreferredStart && cPreferredEnd < cPreferredStart) {
      next.end = "End date must be on or after the start date.";
    }
    if (cAdults < 1) next.adults = "Add at least one adult.";
    setLeadErrors(next);
    focusFirstError([
      next.name && "cp-name",
      next.phone && "cp-phone",
      next.email && "cp-email",
      next.start && "cp-start",
      next.end && "cp-end",
      next.adults && "cp-adults",
    ]);
    return Object.keys(next).length === 0;
  }

  async function onSubmitCustom(e?: React.FormEvent) {
    e?.preventDefault();
    if (!plan?.customPlanDraft.trim()) return;
    if (customSubmittingRef.current) return;
    setCustomErr(null);
    if (!validateCustomLead()) return;
    customSubmittingRef.current = true;
    setCustomSending(true);
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
        proposal: plan.customPlanDraft.slice(0, 12000),
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
    } catch (e) {
      setCustomErr(toUserFacingErrorMessage(e));
      customSubmittingRef.current = false;
      setCustomSending(false);
      return;
    }
    // Saved: keep the button pending while we redirect to the confirmation page.
    setCustomDone(true);
    router.push(thankYouHref("itinerary"));
  }

  const waitingRemote =
    Boolean(guestSessionId) && sessionQuery === undefined;

  if (waitingRemote) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/90 py-16 text-sm text-brand-muted",
          variant === "widget" ? "min-h-[200px]" : "min-h-[240px]",
        )}
      >
        Restoring your conversation…
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        compact ? "max-h-[min(32rem,55vh)]" : "min-h-[24rem]",
        variant === "widget" &&
          "max-h-[min(28rem,calc(100dvh-14rem))] md:max-h-[min(30rem,calc(100dvh-13rem))]",
      )}
    >
      <div
        className={cn(
          "flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-xl border border-slate-200/80 bg-slate-50/90 p-3 shadow-inner md:p-4",
          compact ? "min-h-[200px]" : "min-h-[320px]",
          variant === "widget" && "min-h-[180px]",
        )}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm md:max-w-[85%]",
                m.role === "user"
                  ? "bg-brand-primary text-white"
                  : "border border-slate-200 bg-white text-brand-ink",
              )}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading ? (
          <p className="text-center text-xs text-brand-muted">Thinking…</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {plan?.proposesCustomPlan && plan.customPlanDraft ? (
        <Card className="mt-4 space-y-4 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">
              Custom quote
            </p>
            <p className="mt-1 text-xs text-brand-muted">
              The full draft is already in the reply above. Add your details and
              send it to the team if you want us to price it.
            </p>
          </div>
          {customDone ? (
            <p className="text-sm font-semibold text-emerald-700" role="status">
              Request sent. We&apos;ll review and contact you soon.
            </p>
          ) : (
            <form
              noValidate
              onSubmit={(e) => void onSubmitCustom(e)}
              className="space-y-3"
            >
              <div>
                <FieldLabel htmlFor="cp-name" required>
                  Your name
                </FieldLabel>
                <TextInput
                  id="cp-name"
                  placeholder={sessionToken ? undefined : "e.g. Aadil"}
                  value={cName}
                  onChange={(e) => {
                    setCName(e.target.value);
                    clearLeadError("name");
                  }}
                  {...fieldErrorProps("cp-name", leadErrors.name)}
                />
                <FieldError id={fieldErrorId("cp-name")}>{leadErrors.name}</FieldError>
              </div>
              <div>
                <FieldLabel htmlFor="cp-phone" required>
                  Phone (WhatsApp preferred)
                </FieldLabel>
                <TextInput
                  id="cp-phone"
                  type="tel"
                  placeholder={sessionToken ? undefined : "e.g. +92 300 1234567"}
                  value={cPhone}
                  onChange={(e) => {
                    setCPhone(e.target.value);
                    clearLeadError("phone");
                  }}
                  {...fieldErrorProps("cp-phone", leadErrors.phone)}
                />
                <FieldError id={fieldErrorId("cp-phone")}>{leadErrors.phone}</FieldError>
              </div>
              <div>
                <FieldLabel htmlFor="cp-email" required>
                  Email
                </FieldLabel>
                <TextInput
                  id="cp-email"
                  type="email"
                  placeholder={sessionToken ? undefined : "e.g. name@email.com"}
                  value={cEmail}
                  onChange={(e) => {
                    setCEmail(e.target.value);
                    clearLeadError("email");
                  }}
                  {...fieldErrorProps("cp-email", leadErrors.email)}
                />
                <FieldError id={fieldErrorId("cp-email")}>{leadErrors.email}</FieldError>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel htmlFor="cp-start">Trip start</FieldLabel>
                  <TextInput
                    id="cp-start"
                    type="date"
                    min={minDate}
                    value={cPreferredStart}
                    onChange={(e) => {
                      setCPreferredStart(e.target.value);
                      clearLeadError("start");
                    }}
                    {...fieldErrorProps("cp-start", leadErrors.start)}
                  />
                  <FieldError id={fieldErrorId("cp-start")}>{leadErrors.start}</FieldError>
                </div>
                <div>
                  <FieldLabel htmlFor="cp-end">Trip end</FieldLabel>
                  <TextInput
                    id="cp-end"
                    type="date"
                    min={minDate}
                    value={cPreferredEnd}
                    onChange={(e) => {
                      setCPreferredEnd(e.target.value);
                      clearLeadError("end");
                    }}
                    {...fieldErrorProps("cp-end", leadErrors.end)}
                  />
                  <FieldError id={fieldErrorId("cp-end")}>{leadErrors.end}</FieldError>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel htmlFor="cp-adults">Adults</FieldLabel>
                  <TextInput
                    id="cp-adults"
                    type="number"
                    min={1}
                    value={cAdults}
                    onChange={(e) => {
                      setCAdults(Number.parseInt(e.target.value, 10) || 0);
                      clearLeadError("adults");
                    }}
                    {...fieldErrorProps("cp-adults", leadErrors.adults)}
                  />
                  <FieldError id={fieldErrorId("cp-adults")}>{leadErrors.adults}</FieldError>
                </div>
                <div>
                  <FieldLabel htmlFor="cp-ch">Children</FieldLabel>
                  <TextInput
                    id="cp-ch"
                    type="number"
                    min={0}
                    value={cChildren}
                    onChange={(e) =>
                      setCChildren(Number.parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
              </div>
              <FormAlert>{customErr}</FormAlert>
              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5"
                disabled={customSending}
                aria-busy={customSending}
              >
                {customSending ? "Sending…" : "Send to team for approval"}
              </Button>
            </form>
          )}
        </Card>
      ) : null}

      {err ? <FormAlert className="mt-2">{err}</FormAlert> : null}

      <div className="mt-3 flex gap-2">
        <textarea
          rows={compact ? 2 : 3}
          placeholder="Ask anything or describe your trip…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink focus:ring-2 focus:ring-brand-accent/30"
        />
        <Button
          type="button"
          variant="primary"
          className="self-end px-4 py-2"
          disabled={loading || !input.trim()}
          onClick={() => void send()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
