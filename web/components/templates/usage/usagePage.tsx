import {
  Bars4Icon,
  BuildingOffice2Icon,
  CalendarIcon,
  CreditCardIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { User, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Result } from "../../../lib/result";
import { useUserSettings } from "../../../services/hooks/userSettings";
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

const items = [
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
      console.log(x);
      return x.data;
    },
  },
  {
    title: "Enterprise",
    description: "Need a custom plan? Contact us to learn more.",
    icon: BuildingOffice2Icon,
    background: "bg-sky-500",
    getHref: async () => {
      const x = await fetch("/api/subscriptions/get_portal_link");
      return "https://calendly.com/d/x5d-9q9-v7x/helicone-discovery-call";
    },
  },
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

  const calculatePercentage = () => {
    if (isLoading || isRequestsLoading) {
      return 0;
    }
    const number = Number(count?.data || 0);
    if (number > 100_000) {
      return 100;
    }
    return Number(count?.data || 0) / 100_000;
  };

  const renderInfo = () => {
    if (!userSettings) {
      return (
        <div className="border-2 p-4 text-sm rounded-lg flex flex-col text-gray-600 border-gray-300 w-full gap-4">
          <p>Had an issue getting your user settings</p>
        </div>
      );
    } else if (userSettings.tier === "basic_flex") {
      return (
        <div className="border-2 p-4 text-sm rounded-lg flex flex-col text-gray-600 border-gray-300 w-full gap-4">
          <div className="flex flex-row gap-2 w-full h-4">
            <div className="relative h-full w-full flex-auto bg-gray-300 rounded-md">
              <div
                className="aboslute h-full bg-purple-500 rounded-md"
                style={{
                  width: `${calculatePercentage()}%`,
                }}
              ></div>
            </div>
            <div className="flex-1 w-full whitespace-nowrap">
              <p>
                {isLoading
                  ? "Loading..."
                  : Number(count?.data || 0) > 100_000
                  ? "100,000"
                  : count?.data}{" "}
                / 100,000
              </p>
            </div>
          </div>
          <div className="flex flex-row items-center text-gray-600 w-fit gap-4">
            <LightBulbIcon className="h-4 w-4 text-gray-600 hidden sm:inline" />
            Your first 100,000 requests are free every month. After that, you
            will be charged $1.00 per 10,000 requests.
          </div>
        </div>
      );
    } else {
      return (
        <div className="border-2 p-4 text-sm rounded-lg flex flex-col text-gray-600 border-gray-300 w-full gap-4">
          <div className="flex flex-row gap-2 w-full h-4">
            <div className="relative h-full w-full flex-auto bg-gray-300 rounded-md">
              <div
                className="aboslute h-full bg-purple-500 rounded-md"
                style={{
                  width: `${
                    Math.max(Number(count?.data) / userSettings.request_limit) *
                    100
                  }%`,
                }}
              ></div>
            </div>
            <div className="flex-1 w-full whitespace-nowrap">
              <p>
                {Number(count?.data).toLocaleString()} /{" "}
                {userSettings.request_limit.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex flex-row items-center text-gray-600 w-fit gap-4">
            <LightBulbIcon className="h-4 w-4 text-gray-600 hidden sm:inline" />
            We continue logging your requests after your limit is reached, but
            you will lose access to the dashboard until you upgrade.
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
          Below is a summary of your monthly usage and your plan. Contact us at
          help@helicone.ai if you have any questions.
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
        <div className="flex flex-wrap items-baseline justify-between gap-y-2 pt-8 min-w-[200px]">
          <dt className="text-sm font-medium leading-6 text-gray-700">
            Estimated Cost
          </dt>
          <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
            {isLoading
              ? "Loading..."
              : Number(count?.data || 0) > 100_000
              ? `$${Number(Number(count?.data || 0) - 100_000) / 10_000}`
              : "$0.00"}
          </dd>
        </div>
      </div>
      <ul
        role="list"
        className="mt-6 grid grid-cols-1 gap-8 border-t border-gray-200 py-6 sm:grid-cols-2"
      >
        {items.map((item, itemIdx) => (
          <li key={itemIdx} className="flow-root">
            <div className="relative -m-3 flex items-center space-x-4 rounded-xl p-3 focus-within:ring-2 focus-within:ring-sky-500 hover:bg-white">
              <div
                className={clsx(
                  item.background,
                  "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                )}
              >
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
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
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UsagePage;
