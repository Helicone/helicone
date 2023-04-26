interface WelcomeStepProps {
  setStep: (step: number) => void;
  steps: {
    id: number;
    label: string;
    name: string;
    status: boolean; // true = complete, false = incomplete
  }[];
}
export default function WelcomeSteps(props: WelcomeStepProps) {
  const { setStep, steps } = props;
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step) => (
          <li key={step.id} className="md:flex-1">
            {step.status ? (
              <button
                onClick={() => setStep(step.id)}
                className="group w-full flex flex-col border-l-4 border-sky-600 py-2 pl-4 hover:border-sky-800 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              >
                <span className="text-sm font-medium text-sky-600 group-hover:text-sky-800">
                  {step.label}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {step.name}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setStep(step.id)}
                className="group w-full flex flex-col border-l-4 border-gray-200 py-2 pl-4 hover:border-gray-300 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              >
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700">
                  {step.label}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {step.name}
                </span>
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
