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
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
            {title}
          </p>
          <div className="mt-2 w-full max-w-3xl">
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

      <Card className="p-4 sm:p-5">{children}</Card>

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={backDisabled}
            onClick={onBack}
            className="min-w-[7.5rem]"
          >
            Back
          </Button>
          <Button
            type="button"
            disabled={nextDisabled}
            onClick={onNext}
            className="min-w-[7.5rem]"
          >
            {nextLabel ?? "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

