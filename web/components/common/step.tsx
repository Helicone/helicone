import { ReactNode } from "react";

interface StepProps {
  stepNumber: number;
  label: string;
  children?: ReactNode;
}

const Step = (props: StepProps) => {
  const { stepNumber, label, children } = props;

  return (
    <div className="flex flex-col w-80">
      <p className="font-mono text-sm">
        Step {stepNumber}: {label}
      </p>
      <div className="flex flex-col border border-slate-700 rounded-lg p-4 items-center mt-2">
        {children}
      </div>
    </div>
  );
};

export default Step;
