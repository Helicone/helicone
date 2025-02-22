import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useEffect } from "react";
import { ChevronRightIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useOrg } from "../layout/org/organizationContext";
import { OnboardingStep } from "@/store/onboardingStore";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";

const BreadcrumbSeparator = () => (
  <svg
    width="9"
    height="15"
    viewBox="0 0 9 15"
    fill="none"
    className="text-slate-200"
  >
    <path d="M1 0V15" stroke="currentColor" />
  </svg>
);

const STEP_ROUTES: Record<OnboardingStep, string> = {
  ORGANIZATION: "/onboarding",
  MEMBERS: "/onboarding",
  BILLING: "/onboarding/billing",
  INTEGRATION: "/onboarding/integrate",
  EVENT: "/onboarding/event",
};

export const OnboardingHeader = () => {
  const router = useRouter();
  const org = useOrg();

  const { onboardingState, draftPlan, updateCurrentStep } = useOrgOnboarding(
    org?.currentOrg?.id ?? ""
  );

  useEffect(() => {
    if (org?.currentOrg?.has_onboarded) {
      router.push("/dashboard");
    }
  }, [org?.currentOrg?.has_onboarded]);

  const billingStep: { label: string; step: OnboardingStep }[] =
    draftPlan !== "free" ? [{ label: "Add billing", step: "BILLING" }] : [];

  const isCreatingOrg =
    onboardingState?.currentStep === "ORGANIZATION" ||
    onboardingState?.currentStep === "MEMBERS";

  const steps: { label: string; step: OnboardingStep }[] = [
    {
      label: "Create an organization",
      step: isCreatingOrg
        ? (onboardingState?.currentStep as OnboardingStep)
        : "ORGANIZATION",
    },
    ...billingStep,
    { label: "Get integrated", step: "INTEGRATION" },
    { label: "Send an event", step: "EVENT" },
  ];

  const currentStepIndex = steps.findIndex(
    (s) => s.step === onboardingState?.currentStep
  );

  const handleStepClick = async (step: OnboardingStep, index: number) => {
    if (index < currentStepIndex) {
      await updateCurrentStep(step);
      router.push(STEP_ROUTES[step]);
    }
  };

  return (
    <header className="w-full h-14 px-4 sm:px-16 bg-white border-b border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Image
          src="/static/logo-clear.png"
          alt="Helicone Logo"
          className="rounded-xl"
          width={20}
          height={20}
        />
        <BreadcrumbSeparator />

        <nav className="flex items-center gap-1.5">
          {steps.map((step, index) => (
            <React.Fragment key={step.label}>
              <span
                className={cn(
                  "text-sm font-normal",
                  onboardingState?.currentStep === step.step
                    ? "text-slate-900"
                    : "text-slate-500",
                  index < currentStepIndex && "hover:text-slate-700"
                )}
                onClick={() => {
                  if (index < currentStepIndex) {
                    handleStepClick(step.step, index);
                  }
                }}
                style={{
                  cursor: index < currentStepIndex ? "pointer" : "default",
                }}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <ChevronRightIcon className="w-4 h-4 text-slate-500" />
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <ChevronRightIcon className="w-4 h-4 text-slate-500" />
    </header>
  );
};
