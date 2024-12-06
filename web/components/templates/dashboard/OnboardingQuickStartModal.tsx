import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowLeftRightIcon, RouteIcon } from "lucide-react";
import { cloneElement, useState } from "react";
import IntegrationMethod from "../onboarding/steps/IntegrationMethod";
import Framework from "../onboarding/steps/Framework";
import EventListen from "../onboarding/steps/EventListen";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useOrg } from "@/components/layout/organizationContext";
import { Button } from "@/components/ui/button";

const steps = [
  "Choose integration method",
  "Select a framework",
  "Send an event",
];

export const INTEGRATION_METHODS = [
  {
    id: "async",
    icon: (
      <ArrowLeftRightIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
    ),
    title: "Async",
    description: "Flexible, not on the critical path.",
    features: [
      { good: true, description: "Zero latency impact" },
      { good: false, description: "Not all languages/frameworks supported" },
      { good: false, description: "Requires SDK" },
    ],
  },
  {
    id: "proxy",
    recommended: true,
    icon: <RouteIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />,
    title: "Proxy",
    description: "Simplest and fastest integration.",
    features: [
      { good: true, description: "Supports 300+ LLM models" },
      {
        good: true,
        description: "Built-in caching, rate limiting, & more",
      },
      { good: false, description: "~50 ms latency impact" },
    ],
  },
];

const OnboardingQuickStartModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIntegrationMethod, setSelectedIntegrationMethod] = useState<
    "async" | "proxy" | null
  >(null);

  const org = useOrg();
  const jawn = useJawnClient();

  const close = async () => {
    await jawn.POST("/v1/organization/onboard", {
      body: {},
      headers: {
        "Content-Type": "application/json",
      },
    });
    org?.refreshCurrentOrg();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => (open ? setOpen(true) : close())}
    >
      <DialogContent className="w-11/12 sm:max-w-3xl gap-8 rounded-md">
        <DialogHeader className="flex flex-col space-y-1.5">
          <DialogTitle>
            {currentStep === 3
              ? "Listening for events..."
              : `Hello ${org?.currentOrg?.name}!`}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Let's set up your first{" "}
            {currentStep === 2 ? (
              <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                {cloneElement(
                  INTEGRATION_METHODS.filter(
                    (m) => m.id === selectedIntegrationMethod
                  )[0].icon,
                  { className: "w-3 h-3" }
                )}
                {INTEGRATION_METHODS.filter(
                  (m) => m.id === selectedIntegrationMethod
                )[0].title.toLowerCase()}
              </span>
            ) : (
              ""
            )}{" "}
            integration with Helicone
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {steps.map((step, index) => (
            <div className="flex flex-col gap-2.5" key={step}>
              <div
                className={cn(
                  "w-full h-4 rounded-full",
                  index + 1 <= currentStep
                    ? "bg-gradient-to-r from-[#0CA5EA] to-blue-700"
                    : "bg-slate-100 dark:bg-slate-900"
                )}
              ></div>
              <p
                className={cn(
                  "text-[13px] font-medium",
                  index <= currentStep
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-400 dark:text-slate-600"
                )}
              >
                {`${index + 1}. ${step}`}
              </p>
            </div>
          ))}
        </div>
        {currentStep === 1 && (
          <IntegrationMethod
            setSelectedIntegrationMethod={setSelectedIntegrationMethod}
            setCurrentStep={setCurrentStep}
          />
        )}
        {currentStep === 2 && selectedIntegrationMethod && (
          <Framework
            selectedIntegrationMethod={selectedIntegrationMethod}
            setCurrentStep={setCurrentStep}
          />
        )}
        {currentStep === 3 && <EventListen setCurrentStep={setCurrentStep} />}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingQuickStartModal;
