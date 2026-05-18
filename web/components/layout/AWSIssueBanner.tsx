import { CheckCircle2 } from "lucide-react";

const AWSIssueBanner = () => {
  return (
    <div className="relative flex w-full items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-emerald-50 dark:bg-emerald-700">
      <CheckCircle2 size={16} className="shrink-0" />
      <p className="text-sm font-medium">
        Resolved: the AWS account issue is fixed. The proxy stayed up the whole
        time and no data was lost. The backlog is still processing.{" "}
        <a
          href="https://www.helicone.ai/blog/aws-account-incident"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-white"
        >
          What happened
        </a>
        .
      </p>
    </div>
  );
};

export default AWSIssueBanner;
