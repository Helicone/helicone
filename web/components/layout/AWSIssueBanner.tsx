import { AlertTriangle } from "lucide-react";

const AWSIssueBanner = () => {
  return (
    <div className="relative flex w-full items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-amber-950 dark:bg-amber-600 dark:text-amber-50">
      <AlertTriangle size={16} className="shrink-0" />
      <p className="text-sm font-medium">
        We&apos;re currently experiencing an issue with our AWS account and are
        actively working to resolve it. Thanks for your patience.
      </p>
    </div>
  );
};

export default AWSIssueBanner;
