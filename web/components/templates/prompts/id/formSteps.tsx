export default function FormSteps(props: {
  currentStep: number;
  setCurrentStep: (id: number) => void;
}) {
  const { currentStep, setCurrentStep } = props;
  const getStepStatus = (stepIdx: number) => {
    if (stepIdx === currentStep) {
      return "current";
    }
    if (stepIdx < currentStep) {
      return "complete";
    }
    return "upcoming";
  };

  const steps = [
    {
      id: "Step 1",
      name: "Configure Experiment",
      href: "#",
      status: getStepStatus(0),
    },
    {
      id: "Step 2",
      name: "Edit Prompt",
      href: "#",
      status: getStepStatus(1),
    },
    {
      id: "Step 3",
      name: "Confirm",
      href: "#",
      status: getStepStatus(2),
    },
  ];

  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step) => (
          <li key={step.name} className="md:flex-1">
            {step.status === "complete" ? (
              <button
                onClick={() => {
                  setCurrentStep(steps.indexOf(step));
                }}
                className="w-full group flex flex-col border-l-4 border-sky-500 py-2 pl-4 hover:border-sky-800 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              >
                <span className="text-sm font-medium text-sky-500 group-hover:text-sky-800">
                  {step.id}
                </span>
                <span className="text-sm font-medium">{step.name}</span>
              </button>
            ) : step.status === "current" ? (
              <button
                onClick={() => {
                  setCurrentStep(steps.indexOf(step));
                }}
                className="w-full flex flex-col border-l-4 border-sky-500 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                aria-current="step"
              >
                <span className="text-sm font-medium text-sky-500">
                  {step.id}
                </span>
                <span className="text-sm font-medium">{step.name}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentStep(steps.indexOf(step));
                }}
                className="w-full group flex flex-col border-l-4 border-gray-200 py-2 pl-4 hover:border-gray-300 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              >
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700">
                  {step.id}
                </span>
                <span className="text-sm font-medium">{step.name}</span>
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
