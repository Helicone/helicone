"use client";

import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/router";

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

  if (!open) return null;

  const handleDemoClick = () => {
    const demoOrg = orgContext?.allOrgs.find((org) => org.tier === "demo");
    if (demoOrg && orgContext?.setCurrentOrg) {
      orgContext.setCurrentOrg(demoOrg.id);
      setOpen(false);
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
            your app. It'll take a few seconds!
          </p>
        </div>

        <div className="flex justify-end items-center gap-2">
          <Button variant="outline" onClick={handleDemoClick}>
            Try demo
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              router.push("/onboarding");
            }}
          >
            Get started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
