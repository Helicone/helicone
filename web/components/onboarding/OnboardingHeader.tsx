import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useEffect } from "react";
import { ChevronRightIcon, LogOut, Sun, Moon } from "lucide-react";
import { useRouter } from "next/router";
import { useOrg } from "../layout/org/organizationContext";
import {
  OnboardingStep,
  useOrgOnboarding,
} from "@/services/hooks/useOrgOnboarding";
import LoadingAnimation from "../shared/loadingAnimation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { signOut } from "../shared/utils/utils";
import { useTheme } from "next-themes";

const BreadcrumbSeparator = () => (
  <svg
    width="9"
    height="15"
    viewBox="0 0 9 15"
    fill="none"
    className="text-[hsl(var(--muted-foreground))]"
  >
    <path d="M1 0V15" stroke="currentColor" />
  </svg>
);

export const STEP_ROUTES: Record<OnboardingStep, string> = {
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
  const supabaseClient = useSupabaseClient();
  const { theme, setTheme } = useTheme();

  const { onboardingState, draftPlan, updateCurrentStep, isLoading } =
    useOrgOnboarding(org?.currentOrg?.id ?? "");

  useEffect(() => {
    if (
      (!isLoading && org?.currentOrg?.has_onboarded) ||
      (!isLoading && org?.currentOrg?.tier?.toLowerCase() === "demo")
    ) {
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

  const handleSignOut = () => {
    supabaseClient.auth.refreshSession();
    signOut(supabaseClient).then(() => {
      router.push("/");
    });
  };

  const handleThemeChange = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (isLoading || !org?.currentOrg?.id || org?.currentOrg?.has_onboarded) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <LoadingAnimation />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[hsl(var(--background))]">
      <header className="w-full h-14 px-4 sm:px-6 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] flex items-center justify-between">
        <div className="flex items-center gap-4 overflow-x-auto min-w-0 pr-2 md:pr-0">
          <div className="flex-shrink-0">
            <Image
              src="/static/helicone-icon.svg"
              alt="Helicone Logo"
              width={20}
              height={20}
            />
          </div>
          <BreadcrumbSeparator />

          <nav className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
            {steps.map((step, index) => (
              <React.Fragment key={step.label}>
                <span
                  className={cn(
                    "text-sm font-normal flex-shrink-0",
                    onboardingState?.currentStep === step.step
                      ? "text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted-foreground))]",
                    index < currentStepIndex &&
                      "hover:text-[hsl(var(--foreground))]"
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
                  <ChevronRightIcon className="w-4 h-4 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSignOut}
            className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center gap-1 flex-shrink-0"
            aria-label="Sign Out"
          >
            <span className="hidden sm:inline">Sign Out</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleThemeChange}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>
      {children}
    </div>
  );
};
