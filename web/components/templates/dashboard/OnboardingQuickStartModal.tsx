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
  },
  {
    title: "Select a provider",
  },
  {
    title: "Send an event",
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
          <DialogDescription className="text-sm text-slate-500 flex items-center gap-1 flex-wrap break-words">
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
                  "w-full h-4 rounded-full transition-all relative overflow-hidden bg-slate-100 dark:bg-slate-900"
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 h-full top-0 left-0 bg-gradient-to-r transition-all duration-300",
                    index === 0
                      ? "from-[#0CA5EA] to-[#1479E1]"
                      : index === 1
                      ? "from-[#157AE2] to-[#1C50D9]"
                      : "from-[#1767DD] to-blue-700",
                    index + 1 <= currentStep ? "w-full" : "w-0"
                  )}
                ></div>
              </div>
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
        {currentStep === 3 && (
          <EventListen setCurrentStep={setCurrentStep} close={close} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingQuickStartModal;
