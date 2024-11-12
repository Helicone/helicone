import { CheckIcon } from "lucide-react";

import { ArrowUpRightIcon } from "lucide-react";
import { BookOpenIcon } from "lucide-react";

import { INTEGRATION_METHODS } from "../../dashboard/OnboardingQuickStartModal";
import { cn } from "@/lib/utils";

const IntegrationMethod = ({
  setSelectedIntegrationMethod,
  setCurrentStep,
}: {
  setSelectedIntegrationMethod: (method: "async" | "proxy") => void;
  setCurrentStep: (step: number) => void;
}) => {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-4">
        {INTEGRATION_METHODS.map((method) => (
          <IntegrationMethodCard
            key={method.id}
            onClick={() => {
              setSelectedIntegrationMethod(method.id as "async" | "proxy");
              setCurrentStep(2);
            }}
            {...method}
          />
        ))}
      </div>
      <a
        href="https://docs.helicone.ai/references/proxy-vs-async"
        target="_blank"
        rel="noreferrer"
      >
        <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-md p-4 flex justify-between items-center border border-slate-200 dark:border-slate-800">
          <div className="flex flex gap-2 items-center">
            <BookOpenIcon className="w-4 h-4 text-slate-500" />
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Read more about Proxy vs Async integration.
            </p>
          </div>
          <ArrowUpRightIcon className="w-4 h-4 text-slate-500" />
        </div>
      </a>
    </div>
  );
};

const IntegrationMethodCard = ({
  id,
  icon,
  title,
  description,
  features,
  recommended,
  onClick,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  features: {
    good: boolean;
    description: string;
  }[];
  recommended?: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
      key={id}
      onClick={onClick}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          {icon}
          {recommended && (
            <div className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold uppercase">
              RECOMMENDED
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 leading-4">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {features.map((feature) => (
            <div
              className="flex gap-2.5 items-center"
              key={feature.description}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                  feature.good
                    ? "bg-blue-500"
                    : "bg-slate-400 dark:bg-slate-600"
                )}
              >
                <CheckIcon className="w-2 h-2 text-white" />
              </div>
              <p className="text-sm text-slate-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntegrationMethod;
