"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { WIZARD_STEPS, TOTAL_STEPS } from "@/lib/constants";
import { ChevronLeft, ChevronRight, Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_GROUPS = [
  { label: "Context", range: [0, 5] as const },
  { label: "Design Assets", range: [6, 10] as const },
  { label: "Configuration", range: [11, 15] as const },
];

interface WizardShellProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
  canProceed?: boolean;
  validationMessage?: string | null;
  onSave?: () => void;
  completedSteps?: Set<number>;
}

export function WizardShell({
  currentStep,
  onStepChange,
  children,
  canProceed = true,
  validationMessage,
  onSave,
  completedSteps = new Set(),
}: WizardShellProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const directionRef = useRef(1);

  function goTo(step: number) {
    directionRef.current = step > currentStep ? 1 : -1;
    onStepChange(step);
  }

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="flex gap-8">
      {/* Left: Stepper Panel */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-20 self-start" aria-label="Wizard progress">
        <div>
          <div className="space-y-6">
            {STEP_GROUPS.map((group) => {
              const [start, end] = group.range;
              const steps = WIZARD_STEPS.slice(start, end + 1);

              return (
                <div key={group.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 pl-9">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {steps.map((step, i) => {
                      const stepIndex = start + i;
                      const isActive = stepIndex === currentStep;
                      const isCompleted = completedSteps.has(stepIndex);

                      return (
                        <button
                          key={step.key}
                          onClick={() => goTo(stepIndex)}
                          aria-label={`Go to step ${stepIndex + 1}: ${step.label}`}
                          aria-current={isActive ? 'step' : undefined}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-all duration-150 cursor-pointer",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium scale-[1.02]"
                              : isCompleted
                              ? "text-foreground hover:bg-muted"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {/* Step indicator circle */}
                          <span
                            className={cn(
                              "flex size-[30px] shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                              isActive
                                ? "bg-white/20 text-primary-foreground"
                                : isCompleted
                                ? "bg-accent/20 text-accent"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {isCompleted && !isActive ? (
                              <Check className="size-3.5" />
                            ) : (
                              stepIndex + 1
                            )}
                          </span>

                          {/* Label */}
                          <span className="truncate">
                            {step.label}
                            {step.required && (
                              <span className={cn("ml-0.5", isActive ? "text-white/70" : "text-destructive")}>*</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Mobile: Step indicator (shown when aside is hidden) */}
      <div className="md:hidden mb-4 w-full">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {currentStep + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{WIZARD_STEPS[currentStep]?.label}</p>
            <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {TOTAL_STEPS}</p>
          </div>
        </div>
        <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-accent transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Right: Step Content */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: directionRef.current * 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: directionRef.current * -16 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="min-h-[300px]">{children}</div>
          </motion.div>
        </AnimatePresence>

        {/* Validation message */}
        {!canProceed && validationMessage && (
          <p className="text-xs text-destructive mt-4">{validationMessage}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-4 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={isFirstStep}
            onClick={() => goTo(currentStep - 1)}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {isLastStep ? (
              <Button size="sm" onClick={onSave} disabled={!canProceed}>
                <Save className="size-4" />
                Save Prompt
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!canProceed}
                onClick={() => goTo(currentStep + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
