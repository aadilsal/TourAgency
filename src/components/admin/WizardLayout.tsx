"use client";

import { FormStepper } from "@/components/ui/FormStepper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function WizardLayout({
  title,
  steps,
  currentStep,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  backDisabled,
  savingState,
  children,
  rightActions,
}: {
  title: string;
  steps: string[];
  currentStep: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  backDisabled?: boolean;
  savingState?: "idle" | "saving" | "saved" | "error";
  rightActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
            {title}
          </p>
          <div className="mt-2 max-w-xl">
            <FormStepper steps={steps} current={currentStep} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savingState ? (
            <span className="text-xs font-semibold text-muted">
              {savingState === "saving"
                ? "Saving…"
                : savingState === "saved"
                  ? "Saved"
                  : savingState === "error"
                    ? "Save failed"
                    : ""}
            </span>
          ) : null}
          {rightActions}
        </div>
      </div>

      <Card className="p-5">{children}</Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={backDisabled}
          onClick={onBack}
        >
          Back
        </Button>
        <Button type="button" disabled={nextDisabled} onClick={onNext}>
          {nextLabel ?? "Next"}
        </Button>
      </div>
    </div>
  );
}

