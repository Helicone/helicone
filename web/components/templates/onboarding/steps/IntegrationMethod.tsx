import { ArrowLeftRightIcon, CheckIcon, RouteIcon } from "lucide-react";
import { ArrowUpRightIcon } from "lucide-react";
import { BookOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const INTEGRATION_METHODS = [
  {
    id: "async",
    icon: (
      <ArrowLeftRightIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
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
    icon: <RouteIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />,
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
        <div className="flex w-full items-center justify-between rounded-md p-2">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
              Read more about Proxy vs Async integration.
            </p>
            <ArrowUpRightIcon className="h-4 w-4 text-slate-500" />
          </div>
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
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
      key={id}
      onClick={onClick}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          {icon}
          {recommended && (
            <div className="rounded-md bg-blue-100 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
              RECOMMENDED
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium leading-4 text-slate-900 dark:text-slate-50">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {features.map((feature) => (
            <div
              className="flex items-center gap-2.5"
              key={feature.description}
            >
              <div
                className={cn(
                  "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full",
                  feature.good
                    ? "bg-blue-500"
                    : "bg-slate-400 dark:bg-slate-600",
                )}
              >
                <CheckIcon className="h-2 w-2 text-white" />
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
