import {
  Bars4Icon,
  BuildingOffice2Icon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  CreditCardIcon,
  CubeIcon,
  LightBulbIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { User, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Result } from "../../../lib/result";
import { useUserSettings } from "../../../services/hooks/userSettings";
import { stripeServer } from "../../../utlis/stripeServer";
import { clsx } from "../../shared/clsx";
import { useOrg } from "../../shared/layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import UpgradeProModal from "../../shared/upgradeProModal";
import RenderOrgItem from "./renderOrgItem";

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
  const [open, setOpen] = useState(false);
  const { isLoading, userSettings } = useUserSettings(user.id);
  const { data: count, isLoading: isRequestsLoading } = useUsagePage();
  const orgContext = useOrg();
  const yourOrgs = orgContext?.allOrgs.filter((d) => d.owner === user?.id);

  const capitalizeHelper = (str: string) => {
    const words = str.split("_");
    const capitalizedWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    );
    return capitalizedWords.join(" ");
  };

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
        <div className="flex flex-col w-full border border-gray-500 border-dashed space-y-8 p-4 rounded-lg">
          <div className="flex flex-row gap-2 items-center">
            <LightBulbIcon className="h-4 w-4 text-gray-700 hidden sm:inline" />
            <p className="text-md text-gray-700">
              Below are all of the organizations you own that are under the{" "}
              <span className="text-gray-900 font-semibold">Pro</span> plan
            </p>
          </div>
          <ul className="">
            <li className="flex flex-row justify-between w-full border-b border-gray-300 pb-2">
              <p className="font-semibold text-gray-900 text-md">Org Name</p>
              <p className="text-gray-600 text-md">Requests this month</p>
            </li>
            {yourOrgs?.map((org, idx) => (
              <RenderOrgItem org={org} key={idx} />
            ))}
          </ul>
        </div>
      );
    }
  };

  return (
    <>
      <div className="mt-8 flex flex-col text-gray-900 max-w-2xl space-y-8">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-row space-x-0.5 items-center">
            <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
            <h1 className="text-4xl font-semibold tracking-wide">
              {monthMap[month]}
            </h1>
            <ChevronRightIcon className="h-6 w-6 text-gray-700" />
          </div>

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
          {userSettings?.tier === "free" && (
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
          )}
        </div>
        <ul
          role="list"
          className="mt-6 grid grid-cols-1 gap-8 border-t border-gray-200 py-6 sm:grid-cols-2"
        >
          {userSettings?.tier === "free" && (
            <li className="flow-root">
              <div className="relative -m-3 flex items-center space-x-4 rounded-xl p-3 focus-within:ring-2 focus-within:ring-sky-500 hover:bg-white">
                <div
                  className={clsx(
                    "bg-pink-500",
                    "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                  )}
                >
                  <CloudArrowUpIcon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    <button
                      onClick={() => setOpen(true)}
                      className="focus:outline-none"
                    >
                      <span className="absolute inset-0" aria-hidden="true" />
                      <span>Upgrade to Pro</span>
                      <span aria-hidden="true"> &rarr;</span>
                    </button>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Unlimited requests and essential tooling for a low price.
                  </p>
                </div>
              </div>
            </li>
          )}
          {userSettings?.tier !== "free" && (
            <li className="flow-root">
              <div className="relative -m-3 flex items-center space-x-4 rounded-xl p-3 focus-within:ring-2 focus-within:ring-sky-500 hover:bg-white">
                <div
                  className={clsx(
                    "bg-green-500",
                    "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                  )}
                >
                  <CreditCardIcon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    <button
                      className="focus:outline-none"
                      onClick={async () => {
                        const x = await fetch(
                          "/api/subscription/get_portal_link"
                        ).then((res) => res.json());
                        if (!x.data) {
                          setNotification("Error getting link", "error");
                          return;
                        }

                        window.open(x.data, "_blank");
                      }}
                    >
                      <span className="absolute inset-0" aria-hidden="true" />
                      <span>Manage Plan</span>
                      <span aria-hidden="true"> &rarr;</span>
                    </button>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Unlimited requests and essential tooling for a low price.
                  </p>
                </div>
              </div>
            </li>
          )}
          {userSettings?.tier !== "enterprise" && (
            <li className="flow-root">
              <div className="relative -m-3 flex items-center space-x-4 rounded-xl p-3 focus-within:ring-2 focus-within:ring-sky-500 hover:bg-white">
                <div
                  className={clsx(
                    "bg-purple-500",
                    "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                  )}
                >
                  <BuildingOffice2Icon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    <Link
                      className="focus:outline-none"
                      href={
                        "https://calendly.com/d/x5d-9q9-v7x/helicone-discovery-call"
                      }
                    >
                      <span className="absolute inset-0" aria-hidden="true" />
                      <span>Enterprise</span>
                      <span aria-hidden="true"> &rarr;</span>
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Need a custom plan? Contact us to learn more.
                  </p>
                </div>
              </div>
            </li>
          )}
        </ul>
      </div>
      <UpgradeProModal open={open} setOpen={setOpen} />
    </>
  );
};

export default UsagePage;
