import { Separator } from "@/components/ui/separator";
import useOnboardingContext, {
  ONBOARDING_STEP_LABELS,
  ONBOARDING_STEPS,
} from "../onboardingContext";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

const steps = [
  {
    title: "Request",
    description: (
      <>
        Here is where your request and response data lives. <br />
        <br />
        Find important metrics here like{" "}
        <span className="text-blue-500 font-medium">total tokens consumed</span>
        , <span className="text-blue-500 font-medium">cost</span>, and{" "}
        <span className="text-blue-500 font-medium">latency</span> for that
        request.
      </>
    ),
  },
  {
    title: "Session",
    description: (
      <>
        Sessions helps you visualize your agentic workflow. This is especially
        useful to pinpoint{" "}
        <span className="text-blue-500 font-medium">
          exactly where the failure happened
        </span>
        .
      </>
    ),
  },
  {
    title: "Prompts",
    description:
      "See your latest prompt in production, all past versions and production inputs.",
  },
  {
    title: "Experiments",
    description:
      "A playground where you can improve prompts, test and evaluate the output at scale.",
  },
  {
    title: "Dashboard",
    description:
      "The dashboard shows performance trends, metrics and any anomalies to make sure of your system health. ",
  },
];

const OnboardingNavItems = () => {
  const { currentStep } = useOnboardingContext();
  return (
    <>
      <p className="text-[12px] font-medium text-slate-500 mt-3 mb-4 mx-1">
        Get to know Helicone in 5 steps
      </p>
      <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-md p-1">
        {steps.map((step, index) => (
          <OnboardingNavItem key={index} number={index + 1} {...step} />
        ))}
      </div>
    </>
  );
};

const OnboardingNavItem = ({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string | React.ReactNode;
}) => {
  const { currentStep } = useOnboardingContext();

  const isActive =
    ONBOARDING_STEPS[ONBOARDING_STEP_LABELS[currentStep]].popoverData
      .stepNumber === number;

  const isDone =
    number <
    ONBOARDING_STEPS[ONBOARDING_STEP_LABELS[currentStep]].popoverData
      .stepNumber;

  return (
    <div className="flex flex-col gap-2" key={number}>
      <div
        className={cn(
          "flex flex-col p-2 gap-3",
          isActive && "bg-slate-100 dark:bg-slate-800 rounded"
        )}
      >
        <div className="flex gap-2 items-center">
          <div
            className={cn(
              "w-4 h-4 rounded-full text-white dark:text-slate-900 font-bold text-[9px] flex items-center justify-center",
              isActive
                ? "bg-blue-500"
                : isDone
                ? "bg-green-500"
                : "bg-slate-400 dark:bg-slate-600"
            )}
          >
            {isDone ? <CheckIcon className="h-2 w-2" /> : number}
          </div>
          <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
            {title}
          </p>
        </div>
        {isActive ? (
          <p className="text-[12px] text-slate-500">{description}</p>
        ) : null}
      </div>
      {number !== steps.length && <Separator className="w-full mb-2" />}
    </div>
  );
};

export default OnboardingNavItems;
