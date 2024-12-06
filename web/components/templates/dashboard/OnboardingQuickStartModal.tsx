import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowLeftRightIcon, RouteIcon } from "lucide-react";
import { cloneElement, useState } from "react";
import IntegrationMethod from "../onboarding/steps/IntegrationMethod";
import Framework from "../onboarding/steps/Framework";
import EventListen from "../onboarding/steps/EventListen";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useOrg } from "@/components/layout/organizationContext";

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
      { good: true, description: "Zero propagation delay" },
      { good: false, description: "Support varies based on your environment" },
      { good: false, description: "Requires bulky SDK" },
    ],
  },
  {
    id: "proxy",
    recommended: true,
    icon: <RouteIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />,
    title: "Proxy",
    description: "Simplest and fastest integration.",
    features: [
      { good: true, description: "Unified proxy that supports 300+ models" },
      {
        good: true,
        description:
          "Access to gateway features (caching, rate limiting, API key management, and more). ",
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
        <DialogHeader className="flex flex-row gap-3 items-center space-y-0">
          <DialogTitle>
            {currentStep === 3 ? "Listening for events..." : "Getting started"}
          </DialogTitle>
          {currentStep === 2 && (
            <div className="px-4 py-1 flex items-center gap-3 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
              {cloneElement(
                INTEGRATION_METHODS.filter(
                  (m) => m.id === selectedIntegrationMethod
                )[0].icon,
                { className: "w-4 h-4 text-slate-400 dark:text-slate-500" }
              )}
              <p className="text-[13px] text-slate-900 dark:text-slate-100 font-medium">
                {
                  INTEGRATION_METHODS.filter(
                    (m) => m.id === selectedIntegrationMethod
                  )[0].title
                }
              </p>
            </div>
          )}
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
                {step}
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
        {currentStep === 3 && <EventListen setOpen={setOpen} />}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingQuickStartModal;
