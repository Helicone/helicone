import { useLocalStorage } from "@/services/hooks/localStorage";
import React from "react";

interface StreamWarningProps {
  requestWithStreamUsage: boolean;
}

const StreamWarning: React.FC<StreamWarningProps> = ({
  requestWithStreamUsage,
}) => {
  const [isWarningHidden, setIsWarningHidden] = useLocalStorage(
    "isStreamWarningHiddenx",
    false
  );

  if (!requestWithStreamUsage || isWarningHidden) {
    return null;
  }

  return (
    <div className="alert alert-warning flex justify-between items-center mx-[50px]">
      <p className="text-yellow-800">
        We are unable to calculate your cost accurately because the
        &#39;stream_usage&#39; option is not included in your message. Please
        refer to{" "}
        <a
          href="https://docs.helicone.ai/use-cases/enable-stream-usage"
          className="text-blue-600 underline"
        >
          this documentation
        </a>{" "}
        for more information.
      </p>
      <button
        onClick={() => setIsWarningHidden(true)}
        className="text-yellow-800 hover:text-yellow-900"
      >
        <span className="sr-only">Close</span>
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

export default StreamWarning;
