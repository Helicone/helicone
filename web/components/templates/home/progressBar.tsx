import { CheckIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar = (props: ProgressBarProps) => {
  const { currentStep, totalSteps } = props;

  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1).map(
    (step) => ({
      name: `Step ${step}`,
      status:
        currentStep === step
          ? "current"
          : currentStep > step
          ? "complete"
          : "incomplete",
    })
  );

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center w-full">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={clsx(
              stepIdx !== steps.length - 1 ? "pr-12 sm:pr-20" : "",
              "relative"
            )}
          >
            {step.status === "complete" ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-black" />
                </div>
                <div className="relative flex h-4 w-4 items-center justify-center rounded-full bg-black hover:bg-gray-800">
                  <CheckIcon
                    className="h-3 w-3 text-white"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            ) : step.status === "current" || step.status === "incomplete" ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-gray-400" />
                </div>
                <div
                  className="relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-black bg-white"
                  aria-current="step"
                >
                  {step.status === "current" && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-black"
                      aria-hidden="true"
                    />
                  )}

                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-gray-400" />
                </div>
                <div className="group relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-transparent group-hover:bg-gray-400"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default ProgressBar;
