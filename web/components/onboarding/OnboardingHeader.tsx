import { cn } from "@/lib/utils";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import {
  OnboardingStep,
  useOrgOnboarding,
} from "@/services/hooks/useOrgOnboarding";
import { ChevronRightIcon, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useOrg } from "../layout/org/organizationContext";
import LoadingAnimation from "../shared/loadingAnimation";

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
  BILLING: "/onboarding/billing",
  REQUEST: "/onboarding/request",
};

interface OnboardingHeaderProps {
  children?: React.ReactNode;
}

export const OnboardingHeader = ({ children }: OnboardingHeaderProps) => {
  const router = useRouter();
  const org = useOrg();
  const heliconeAuthClient = useHeliconeAuthClient();
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

  const steps: { label: string; step: OnboardingStep }[] = [
    { label: "Create organization", step: "ORGANIZATION" },
    { label: "Send a request", step: "REQUEST" },
  ];

  const currentStepIndex = steps.findIndex(
    (s) => s.step === onboardingState?.currentStep,
  );

  const handleStepClick = async (step: OnboardingStep, index: number) => {
    if (index < currentStepIndex) {
      await updateCurrentStep(step);
      router.push(STEP_ROUTES[step]);
    }
  };

  const handleSignOut = async () => {
    await heliconeAuthClient.refreshSession();
    await heliconeAuthClient.signOut();
    router.push("/");
  };

  const handleThemeChange = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (isLoading || !org?.currentOrg?.id || org?.currentOrg?.has_onboarded) {
    return (
      <div className="flex min-h-dvh w-full flex-col">
        <div className="flex flex-1 items-center justify-center">
          <LoadingAnimation />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[hsl(var(--background))]">
      <header className="flex h-14 w-full items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 overflow-x-auto pr-2 md:pr-0">
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
                    "flex-shrink-0 text-sm font-normal",
                    onboardingState?.currentStep === step.step
                      ? "text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted-foreground))]",
                    index < currentStepIndex &&
                      "hover:text-[hsl(var(--foreground))]",
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
                  <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-[hsl(var(--muted-foreground))]" />
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSignOut}
            className="flex flex-shrink-0 items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            aria-label="Sign Out"
          >
            <span className="hidden sm:inline">Sign Out</span>
            <LogOut className="h-3.5 w-3.5" />
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
      <main className="flex flex-1">{children}</main>
    </div>
  );
};
