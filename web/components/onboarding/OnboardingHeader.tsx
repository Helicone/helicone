import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useEffect } from "react";
import { ChevronRightIcon, Loader2 } from "lucide-react";
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

interface OnboardingHeaderProps {
  children?: React.ReactNode;
}

export const OnboardingHeader = ({ children }: OnboardingHeaderProps) => {
  const router = useRouter();
  const org = useOrg();

  const { onboardingState, draftPlan, updateCurrentStep, isLoading } =
    useOrgOnboarding(org?.currentOrg?.id ?? "");

  useEffect(() => {
    if (!isLoading && org?.currentOrg?.has_onboarded) {
      router.push("/dashboard");
      return;
    }
  }, [org?.currentOrg?.has_onboarded, isLoading, router]);

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

  if (isLoading || !org?.currentOrg?.id) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <header className="w-full h-14 px-4 sm:px-16 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/static/logo-clear.png"
              alt="Helicone Logo"
              className="rounded-xl"
              width={20}
              height={20}
            />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="w-full h-14 px-4 sm:px-16 bg-white border-b border-slate-200 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0">
            <Image
              src="/static/logo-clear.png"
              alt="Helicone Logo"
              className="rounded-xl"
              width={20}
              height={20}
            />
          </div>
          <BreadcrumbSeparator />

          <nav className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1">
            {steps.map((step, index) => (
              <React.Fragment key={step.label}>
                <span
                  className={cn(
                    "text-sm font-normal flex-shrink-0",
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
                  <ChevronRightIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </>
  );
};
