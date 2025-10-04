import { HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import React from "react";

interface UnauthorizedViewProps {
  currentTier: string;
  pageType?: "requests" | "cache" | "ratelimit";
}

const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({
  currentTier,
  pageType = "requests",
}) => {
  const getMessage = () => {
    if (pageType === "cache") {
      return {
        title: "You have reached your monthly limit.",
        description:
          "Upgrade your plan to view your cache data. Your cache is still functioning, but you will not be able to view the analytics until you upgrade.",
      };
    } else if (pageType === "ratelimit") {
      return {
        title: "You have reached your monthly limit.",
        description:
          "Upgrade your plan to view your rate limit data. Rate limits are still being enforced, but you will not be able to view it until you upgrade.",
      };
    } else {
      return {
        title: "You have reached your monthly limit.",
        description:
          "Upgrade your plan to view your request page. Your requests are still being processed, but you will not be able to view them until you upgrade.",
      };
    }
  };

  const { title, description } = getMessage();

  if (currentTier === "free") {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center">
        <div className="flex w-2/5 flex-col">
          <HomeIcon className="h-12 w-12 rounded-lg border border-gray-300 bg-white p-2 text-black dark:border-gray-700 dark:bg-black dark:text-white" />
          <p className="mt-8 text-xl font-semibold text-black dark:text-white">
            {title}
          </p>
          <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
          <div className="mt-4">
            <Link
              href="/settings/billing"
              className="flex w-min items-center gap-2 whitespace-nowrap rounded-lg bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Upgrade - Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (currentTier === "pro") {
    const proTitle =
      pageType === "cache"
        ? "You have reached your monthly cache limit on the Pro plan."
        : "You have reached your monthly limit on the Pro plan.";

    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center">
        <div className="flex w-full flex-col">
          <HomeIcon className="h-12 w-12 rounded-lg border border-gray-300 bg-white p-2 text-black dark:border-gray-700 dark:bg-black dark:text-white" />
          <p className="mt-8 text-xl font-semibold text-black dark:text-white">
            {proTitle}
          </p>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Please get in touch with us to discuss increasing your limits.
          </p>
          <div className="mt-4">
            <Link
              href="https://cal.com/team/helicone/helicone-discovery"
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-2 rounded-lg bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default UnauthorizedView;
