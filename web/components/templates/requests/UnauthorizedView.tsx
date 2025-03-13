import { HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

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
          "Upgrade your plan to view your rate limit analytics. Your rate limits are still functioning, but you will not be able to view the analytics until you upgrade.",
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
      <div className="flex flex-col w-full h-[80vh] justify-center items-center">
        <div className="flex flex-col w-2/5">
          <HomeIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
          <p className="text-xl text-black dark:text-white font-semibold mt-8">
            {title}
          </p>
          <p className="text-sm text-gray-500 max-w-sm mt-2">{description}</p>
          <div className="mt-4">
            <Link
              href="/settings/billing"
              className="w-min whitespace-nowrap items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
        : pageType === "ratelimit"
        ? "You have reached your monthly rate limit quota on the Pro plan."
        : "You have reached your monthly limit on the Pro plan.";

    return (
      <div className="flex flex-col w-full h-[80vh] justify-center items-center">
        <div className="flex flex-col w-full">
          <HomeIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
          <p className="text-xl text-black dark:text-white font-semibold mt-8">
            {proTitle}
          </p>
          <p className="text-sm text-gray-500 max-w-sm mt-2">
            Please get in touch with us to discuss increasing your limits.
          </p>
          <div className="mt-4">
            <Link
              href="https://cal.com/team/helicone/helicone-discovery"
              target="_blank"
              rel="noreferrer"
              className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
