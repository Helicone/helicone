import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import useOnboardingContext, {
  ONBOARDING_STEPS,
  ONBOARDING_STEP_LABELS,
} from "@/components/layout/onboardingContext";

const STEPS = [
  {
    title: "Request",
    description: "View your LLM requests and track key metrics",
  },
  {
    title: "Session",
    description: "See how your agents execute tasks step by step",
  },
  {
    title: "Prompts",
    description: "Review your prompts and past versions",
  },
  {
    title: "Experiments",
    description: "Test and evaluate outputs at scale",
  },
  {
    title: "Dashboard",
    description: "Monitor performance trends and system health",
  },
];

const OnboardingSteps = () => {
  const { currentStep } = useOnboardingContext();
  const currentStepNumber =
    ONBOARDING_STEPS[ONBOARDING_STEP_LABELS[currentStep]].popoverData
      .stepNumber;

  return (
    <div className="fixed bottom-8 right-8 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Tour Progress
        </h3>
        <span className="text-xs text-slate-500">{currentStepNumber}/5</span>
      </div>

      <div className="space-y-2">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStepNumber === stepNumber;
          const isDone = currentStepNumber > stepNumber;

          return (
            <div
              key={step.title}
              className={cn(
                "flex items-center gap-3 p-2 rounded",
                isActive && "bg-blue-50 dark:bg-blue-900/20"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium w-4",
                  isActive
                    ? "text-blue-500"
                    : isDone
                    ? "text-green-500"
                    : "text-slate-400"
                )}
              >
                {stepNumber}.
              </span>
              <div className="flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isActive
                      ? "text-blue-500"
                      : isDone
                      ? "text-green-500"
                      : "text-slate-500"
                  )}
                >
                  {step.title}
                </p>
                {isActive && (
                  <p className="text-xs text-slate-500 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingSteps;
