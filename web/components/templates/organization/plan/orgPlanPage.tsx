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
import { User, useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  formatISO,
  isAfter,
} from "date-fns";
import { Database } from "../../../../supabase/database.types";
import useNotification from "../../../shared/notification/useNotification";
import { useEffect, useState } from "react";
import { useGetRequestCountClickhouse } from "../../../../services/hooks/requests";
import Link from "next/link";
import { clsx } from "../../../shared/clsx";
import UpgradeProModal from "../../../shared/upgradeProModal";
import { useRateLimitTracker } from "../../../../services/hooks/rateLimitTracker";
import RenderOrgPlan from "./renderOrgPlan";

interface OrgPlanPageProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
}

const OrgPlanPage = (props: OrgPlanPageProps) => {
  const { org } = props;
  const { setNotification } = useNotification();

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const startOfMonthFormatted = formatISO(currentMonth, {
    representation: "date",
  });
  const endOfMonthFormatted = formatISO(endOfMonth(currentMonth), {
    representation: "date",
  });
  const isNextMonthDisabled = isAfter(addMonths(currentMonth, 1), new Date());

  const [open, setOpen] = useState(false);

  const {
    count,
    isLoading: isCountLoading,
    refetch,
  } = useGetRequestCountClickhouse(
    startOfMonthFormatted,
    endOfMonthFormatted,
    org.id
  );

  useEffect(() => {
    refetch();
  }, [currentMonth, refetch]);
  const rateLimitTracker = useRateLimitTracker();

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

  const nextMonth = () => {
    setCurrentMonth((prevMonth) => startOfMonth(addMonths(prevMonth, 1)));
  };

  const prevMonth = () => {
    setCurrentMonth((prevMonth) => startOfMonth(subMonths(prevMonth, 1)));
  };

  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("default", { month: "long" });
  };

  const renderInfo = () => {
    if (org.tier === "free") {
      return (
        <div className="border-2 p-4 text-sm rounded-lg flex flex-col text-gray-500 border-gray-300 dark:border-gray-700 w-full gap-4">
          <div className="flex flex-row gap-2 w-full h-4">
            <div className="relative h-full w-full flex-auto bg-gray-300 dark:bg-gray-700 rounded-md">
              <div
                className="aboslute h-full bg-purple-500 rounded-md"
                style={{
                  width: `${getProgress(count?.data || 0)}%`,
                }}
              ></div>
            </div>
            <div className="flex-1 w-full whitespace-nowrap">
              <div className="flex flex-row gap-1.5 items-center text-black dark:text-gray-100">
                <span>{`${Number(count?.data).toLocaleString()}`}</span>
                <span className="text-gray-500 text-sm">/</span>
                <span className="text-sm text-gray-500">{`${Number(
                  100_000
                ).toLocaleString()}`}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-row items-center text-gray-500 w-fit gap-4">
            <LightBulbIcon className="h-6 w-6 text-gray-500 hidden sm:inline" />
            We continue logging your requests after your limit is reached, but
            you will lose access to the dashboard until you upgrade.
          </div>
        </div>
      );
    } else if (org !== undefined) {
      return (
        <RenderOrgPlan
          currentMonth={currentMonth}
          requestCount={Number(count?.data || 0)}
        />
      );
    }
  };

  return (
    <>
      <div className="mt-8 flex flex-col text-gray-900 max-w-2xl space-y-8">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-row space-x-4 items-center">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            <h1 className="text-4xl font-semibold tracking-wide text-black dark:text-white">
              {getMonthName(startOfMonthFormatted + 1)}
            </h1>
            {!isNextMonthDisabled && (
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <p className="text-md text-gray-900 dark:text-gray-100">
            Below is a summary of your monthly usage and your plan. Click{" "}
            <Link href="/pricing" className="text-blue-500 underline">
              here
            </Link>{" "}
            to view the different features of each plan.
          </p>
        </div>
        {isCountLoading ? (
          <div className="h-24 w-full bg-gray-300 dark:bg-gray-700 animate-pulse rounded-md"></div>
        ) : (
          renderInfo()
        )}

        <div className="flex flex-col sm:flex-row sm:space-x-4">
          <div className="flex flex-wrap items-baseline justify-between gap-y-2 pt-8 min-w-[200px]">
            <dt className="text-sm font-medium leading-6 text-gray-700 dark:text-gray-300">
              Your Plan
            </dt>
            <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900 dark:text-gray-100">
              {capitalizeHelper(org.tier || "")}
            </dd>
          </div>
          {org.tier === "free" && (
            <div className="flex flex-wrap items-baseline justify-between gap-y-2 pt-8 min-w-[200px]">
              <dt className="text-sm font-medium leading-6 text-gray-700 dark:text-gray-300">
                Requests
              </dt>
              <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900 dark:text-gray-100">
                {isCountLoading
                  ? "Loading..."
                  : Number(count?.data || 0).toLocaleString()}
              </dd>
            </div>
          )}
          {rateLimitTracker.request && (
            <div className="flex flex-wrap items-baseline justify-between gap-y-2 pt-8 min-w-[200px]">
              <dt className="text-sm font-medium leading-6 text-red-700 dark:text-red-300">
                Rate Limited
              </dt>

              <dd className="w-full flex-row gap-2 text-3xl font-medium leading-10 tracking-tight text-red-900 dark:text-red-100">
                {isCountLoading
                  ? "Loading..."
                  : Number(
                      Math.floor(rateLimitTracker.request.total_count / 10) * 10
                    )}
                +<span className="pl-1 text-sm font-light">times</span>
              </dd>
              <dd className="text-sm">
                Please contact us to increase your rate limit
              </dd>
            </div>
          )}
        </div>
        <ul
          role="list"
          className="mt-6 grid grid-cols-1 gap-8 border-t border-gray-200 dark:border-gray-800 py-6 sm:grid-cols-2"
        >
          {org.tier === "free" && (
            <li className="flow-root">
              <div className="relative -m-3 flex items-center space-x-4 rounded-xl p-3 focus-within:ring-2 focus-within:ring-sky-500 hover:bg-white dark:hover:bg-black">
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
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
          {org.tier !== "free" && (
            <li className="flow-root">
              <div className="relative -m-3 flex items-center space-x-4 rounded-xl p-3 focus-within:ring-2 focus-within:ring-sky-500 hover:bg-white dark:hover:bg-black">
                <div
                  className={clsx(
                    "bg-green-500",
                    "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                  )}
                >
                  <CreditCardIcon
                    className="h-6 w-6 text-white dark:text-black"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
          {org.tier !== "enterprise" && (
            <li className="flow-root">
              <div className="relative -m-3 flex items-center space-x-4 rounded-xl p-3 focus-within:ring-2 focus-within:ring-sky-500 hover:bg-white dark:hover:bg-black">
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
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
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

export default OrgPlanPage;
