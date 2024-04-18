import { CheckIcon } from "@heroicons/react/24/solid";
import { clsx } from "./clsx";
import { useState } from "react";

interface StepActionsProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  steps: {
    id: number; // index at 0
    name: string;
    description: string;
  }[];
}

export default function StepActions(props: StepActionsProps) {
  const { currentStep, setCurrentStep, steps } = props;
  return (
    <div className="border border-gray-300 rounded-lg bg-white">
      <nav className="w-full" aria-label="Progress">
        <ol
          role="list"
          className="overflow-hidden rounded-md lg:flex lg:rounded-none"
        >
          {steps.map((step, stepIdx) => (
            <li key={step.id} className="relative overflow-hidden lg:flex-1">
              <div
                className={clsx(
                  stepIdx === 0 ? "rounded-t-md border-b-0" : "",
                  stepIdx === steps.length - 1 ? "rounded-b-md border-t-0" : "",
                  "overflow-hidden border border-gray-200 lg:border-0"
                )}
              >
                {step.id < currentStep ? (
                  <button
                    onClick={() => {
                      setCurrentStep(step.id);
                    }}
                    className="group"
                  >
                    <span
                      className="absolute left-0 top-0 h-full w-1 bg-transparent group-hover:bg-gray-200 lg:bottom-0 lg:top-auto lg:h-1 lg:w-full"
                      aria-hidden="true"
                    />
                    <span
                      className={clsx(
                        stepIdx !== 0 ? "lg:pl-9" : "",
                        "flex items-start px-6 py-5 text-sm font-medium"
                      )}
                    >
                      <span className="flex-shrink-0">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600">
                          <CheckIcon
                            className="h-4 w-4 text-white"
                            aria-hidden="true"
                          />
                        </span>
                      </span>
                      <span className="ml-4 mt-0.5 flex min-w-0 flex-col text-left">
                        <span className="text-sm font-medium">{step.name}</span>
                        <span className="text-xs font-medium text-gray-500 mt-0.5">
                          {step.description}
                        </span>
                      </span>
                    </span>
                  </button>
                ) : step.id === currentStep ? (
                  <button
                    onClick={() => {
                      setCurrentStep(step.id);
                    }}
                    aria-current="step"
                  >
                    <span
                      className="absolute left-0 top-0 h-full w-1 bg-sky-600 lg:bottom-0 lg:top-auto lg:h-1 lg:w-full"
                      aria-hidden="true"
                    />
                    <span
                      className={clsx(
                        stepIdx !== 0 ? "lg:pl-9" : "",
                        "flex items-start px-6 py-5 text-sm font-medium"
                      )}
                    >
                      <span className="flex-shrink-0">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-sky-600">
                          <span className="text-sky-600">{step.id + 1}</span>
                        </span>
                      </span>
                      <span className="ml-4 mt-0.5 flex min-w-0 flex-col text-left">
                        <span className="text-sm font-medium text-sky-600">
                          {step.name}
                        </span>
                        <span className="text-xs font-medium text-gray-500 mt-0.5">
                          {step.description}
                        </span>
                      </span>
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setCurrentStep(step.id);
                    }}
                    className="group"
                  >
                    <span
                      className="absolute left-0 top-0 h-full w-1 bg-transparent group-hover:bg-gray-200 lg:bottom-0 lg:top-auto lg:h-1 lg:w-full"
                      aria-hidden="true"
                    />
                    <span
                      className={clsx(
                        stepIdx !== 0 ? "lg:pl-9" : "",
                        "flex items-start px-6 py-5 text-sm font-medium"
                      )}
                    >
                      <span className="flex-shrink-0">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300">
                          <span className="text-gray-500">{step.id + 1}</span>
                        </span>
                      </span>
                      <span className="ml-4 mt-0.5 flex min-w-0 flex-col text-left">
                        <span className="text-sm font-medium text-gray-500">
                          {step.name}
                        </span>
                        <span className="text-xs font-medium text-gray-500 mt-0.5">
                          {step.description}
                        </span>
                      </span>
                    </span>
                  </button>
                )}

                {stepIdx !== 0 ? (
                  <>
                    {/* Separator */}
                    <div
                      className="absolute inset-0 left-0 top-0 hidden w-3 lg:block"
                      aria-hidden="true"
                    >
                      <svg
                        className="h-full w-full text-gray-300"
                        viewBox="0 0 12 82"
                        fill="none"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M0.5 0V31L10.5 41L0.5 51V82"
                          stroke="currentcolor"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
