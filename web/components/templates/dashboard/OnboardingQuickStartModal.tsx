import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { cloneElement, useState } from "react";
import IntegrationMethod, {
  INTEGRATION_METHODS,
} from "../onboarding/steps/IntegrationMethod";
import Framework from "../onboarding/steps/Framework";
import EventListen from "../onboarding/steps/EventListen";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useOrg } from "@/components/layout/org/organizationContext";

const steps = [
  {
    title: "Choose integration method",
    description:
      "Select how you want to connect your AI application with Helicone",
  },
  {
    title: "Select a provider",
    description: "Pick your preferred LLM provider and language",
  },
  {
    title: "Send an event",
    description: "Test your integration by making a sample request",
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
            Let&apos;s set up your first{" "}
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
            <div className="flex flex-col gap-2.5" key={step.title}>
              <div
                className={cn(
                  "w-full h-4 rounded-full",
                  index + 1 <= currentStep
                    ? "bg-gradient-to-r from-[#0CA5EA] to-blue-700"
                    : "bg-slate-100 dark:bg-slate-900"
                )}
              ></div>
              <div className="space-y-1">
                <p
                  className={cn(
                    "text-[13px] font-medium",
                    index + 1 <= currentStep
                      ? "text-slate-900 dark:text-slate-100"
                      : "text-slate-400 dark:text-slate-600"
                  )}
                >
                  {`${index + 1}. ${step.title}`}
                </p>
                {index + 1 === currentStep && (
                  <p className="text-xs text-slate-500">{step.description}</p>
                )}
              </div>
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
