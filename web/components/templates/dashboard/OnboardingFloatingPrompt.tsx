"use client";

import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/router";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { STEP_ROUTES } from "@/components/onboarding/OnboardingHeader";

interface OnboardingFloatingPromptProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function OnboardingFloatingPrompt({
  open,
  setOpen,
}: OnboardingFloatingPromptProps) {
  const router = useRouter();
  const orgContext = useOrg();
  const { onboardingState } = useOrgOnboarding(
    orgContext?.currentOrg?.id || ""
  );

  if (!open) return null;

  const handleDemoClick = () => {
    const demoOrg = orgContext?.allOrgs.find((org) => org.tier === "demo");
    if (demoOrg && orgContext?.setCurrentOrg) {
      orgContext.setCurrentOrg(demoOrg.id);
      setOpen(false);
    }
  };

  const handleGetStarted = () => {
    setOpen(false);
    const currentStep = onboardingState?.currentStep || "ORGANIZATION";
    if (currentStep === "EVENT") {
      router.push("/onboarding/integrate");
    } else {
      router.push(STEP_ROUTES[currentStep]);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-[400px] p-6 border border-slate-200 bg-white dark:bg-black dark:border-slate-800 rounded-lg shadow-lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold leading-7 text-foreground">
            Hey! Ready to integrate?
          </h2>
          <p className="text-sm text-muted-foreground leading-5">
            Integrate your LLM app to start logging, evaluating and improving
            your app. It&apos;ll take a few seconds!
          </p>
        </div>

        <div className="flex justify-end items-center gap-2">
          <Button variant="outline" onClick={handleDemoClick}>
            Try demo
          </Button>
          <Button variant="action" onClick={handleGetStarted}>
            Get started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
