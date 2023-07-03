import {
  Bars4Icon,
  BuildingOffice2Icon,
  CalendarIcon,
  CloudArrowUpIcon,
  CreditCardIcon,
  CubeIcon,
  LightBulbIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { User, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Result } from "../../../lib/result";
import { useUserSettings } from "../../../services/hooks/userSettings";
import { stripeServer } from "../../../utlis/stripeServer";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";

const monthMap = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface UsagePageProps {
  user: User;
}

const useUsagePage = () => {
  function getBeginningOfMonthISO(): string {
    const now = new Date();
    const beginningOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    return beginningOfMonth.toISOString();
  }

  const { data, isLoading } = useQuery({
    queryKey: ["usagePage"],
    queryFn: async (query) => {
      const data = fetch("/api/request/count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            left: {
              request: {
                created_at: {
                  gte: getBeginningOfMonthISO(),
                },
              },
            },
            operator: "and",
            right: "all",
          },
        }),
      }).then((res) => res.json() as Promise<Result<number, string>>);
      return data;
    },
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isLoading,
  };
};

const UsagePage = (props: UsagePageProps) => {
  const { user } = props;
  const { setNotification } = useNotification();

  const month = new Date().getMonth();

  const { isLoading, userSettings } = useUserSettings(user.id);

  const { data: count, isLoading: isRequestsLoading } = useUsagePage();

  const capitalizeHelper = (str: string) => {
    const words = str.split("_");
    const capitalizedWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    );
    return capitalizedWords.join(" ");
  };

  const items = [
    {
      title: "Upgrade to Pro",
      description: "Unlimited requests and essential tooling for a low price.",
      icon: CloudArrowUpIcon,
      background: "bg-pink-500",
      getHref: async () => {
        return `${process.env.NEXT_PUBLIC_HELICONE_PRO_LINK}?prefilled_email=${user.email}`;
      },
      display: userSettings?.tier === "free",
    },
    {
      title: "Manage Plan",
      description:
        "View your Stripe subscription and update your payment method.",
      icon: CreditCardIcon,
      background: "bg-green-500",
      getHref: async () => {
        const x = await fetch("/api/subscription/get_portal_link").then((res) =>
          res.json()
        );
        return x.data;
      },
      display: userSettings?.tier !== "free",
    },
    {
      title: "Enterprise",
      description: "Need a custom plan? Contact us to learn more.",
      icon: BuildingOffice2Icon,
      background: "bg-purple-500",
      getHref: async () => {
        return "https://calendly.com/d/x5d-9q9-v7x/helicone-discovery-call";
      },
      display: userSettings?.tier !== "enterprise",
    },
  ];

  const getProgress = (count: number) => {
    const cappedCount = Math.min(count, 100000);
    const percentage = (cappedCount / 100000) * 100;
    return percentage;
  };

  const renderInfo = () => {
    if (!userSettings) {
      return (
        <div className="border-2 p-4 text-sm rounded-lg flex flex-col text-gray-600 border-gray-300 w-full gap-4">
          <p>Had an issue getting your user settings</p>
        </div>
      );
    } else if (userSettings.tier === "free") {
      return (
        <div className="border-2 p-4 text-sm rounded-lg flex flex-col text-gray-600 border-gray-300 w-full gap-4">
          <div className="flex flex-row gap-2 w-full h-4">
            <div className="relative h-full w-full flex-auto bg-gray-300 rounded-md">
              <div
                className="aboslute h-full bg-purple-500 rounded-md"
                style={{
                  width: `${getProgress(count?.data || 0)}%`,
                }}
              ></div>
            </div>
            <div className="flex-1 w-full whitespace-nowrap">
              <p>
                {Number(count?.data || 0).toLocaleString()} /{" "}
                {userSettings.request_limit.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex flex-row items-center text-gray-600 w-fit gap-4">
            <LightBulbIcon className="h-6 w-6 text-gray-600 hidden sm:inline" />
            We continue logging your requests after your limit is reached, but
            you will lose access to the dashboard until you upgrade.
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col w-full border border-gray-300 border-dashed space-y-8 p-4 rounded-lg">
          <div className="flex flex-row gap-4 items-center">
            <LightBulbIcon className="h-5 w-5 text-gray-600 hidden sm:inline" />
            <p className="text-md text-gray-700">
              Get the most out of Helicone with the features below
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Unlimited Requests",
              "Bucket Caching",
              "User Management",
              "Rate Limiting",
              "GraphQL API",
              "Request Retries",
              "Unlimited Organizations",
            ].map((item, i) => (
              <div key={i} className="text-sm flex flex-row items-center">
                <SparklesIcon className="h-4 w-4 mr-2 text-yellow-500" />
                <span className="">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="mt-8 flex flex-col text-gray-900 max-w-2xl space-y-8">
      <div className="flex flex-col space-y-6">
        <h1 className="text-4xl font-semibold tracking-wide">
          {monthMap[month]}
        </h1>
        <p className="text-md">
          Below is a summary of your monthly usage and your plan. Click{" "}
          <Link href="/pricing" className="text-blue-500 underline">
            here
          </Link>{" "}
          to view the different features of each plan.
        </p>
      </div>
      {isLoading ? (
        <div className="h-24 w-full bg-gray-300 animate-pulse rounded-md"></div>
      ) : (
        renderInfo()
      )}

      <div className="flex flex-col sm:flex-row sm:space-x-4">
        <div className="flex flex-wrap items-baseline justify-between gap-y-2 pt-8 min-w-[200px]">
          <dt className="text-sm font-medium leading-6 text-gray-700">
            Your Plan
          </dt>
          <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
            {isLoading
              ? "Loading..."
              : capitalizeHelper(userSettings?.tier || "")}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-y-2 pt-8 min-w-[200px]">
          <dt className="text-sm font-medium leading-6 text-gray-700">
            Requests
          </dt>
          <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
            {isLoading
              ? "Loading..."
              : Number(count?.data || 0).toLocaleString()}
          </dd>
        </div>
      </div>
      {/* TODO: Add this in with stripe changes */}
      <ul
        role="list"
        className="mt-6 grid grid-cols-1 gap-8 border-t border-gray-200 py-6 sm:grid-cols-2"
      >
        {items
          .filter((item) => item.display)
          .map((item, itemIdx) => (
            <li key={itemIdx} className="flow-root">
              <div className="relative -m-3 flex items-center space-x-4 rounded-xl p-3 focus-within:ring-2 focus-within:ring-sky-500 hover:bg-white">
                <div
                  className={clsx(
                    item.background,
                    "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                  )}
                >
                  <item.icon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    <button
                      className="focus:outline-none"
                      onClick={() => {
                        item.getHref().then((href) => {
                          if (!href) {
                            setNotification("Error getting link", "error");
                            return;
                          }

                          window.open(href, "_blank");
                        });
                      }}
                    >
                      <span className="absolute inset-0" aria-hidden="true" />
                      <span>{item.title}</span>
                      <span aria-hidden="true"> &rarr;</span>
                    </button>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default UsagePage;
