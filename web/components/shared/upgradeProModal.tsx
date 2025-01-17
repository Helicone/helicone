// import { SparklesIcon } from "@heroicons/react/24/outline";
import { useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { useOrg } from "../layout/org/organizationContext";
import ThemedModal from "./themed/themedModal";
import getStripe from "../../utlis/getStripe";

import { clsx } from "./clsx";
import { useGetRequestCountClickhouse } from "../../services/hooks/requests";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "../templates/organization/orgConstants";
import { SparklesIcon } from "lucide-react";

interface UpgradeProModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const UpgradeProModal = (props: UpgradeProModalProps) => {
  const { open, setOpen } = props;
  const user = useUser();
  const orgContext = useOrg();

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const startOfMonthFormatted = formatISO(currentMonth, {
    representation: "date",
  });
  const endOfMonthFormatted = formatISO(endOfMonth(currentMonth), {
    representation: "date",
  });

  const { count, isLoading: isCountLoading } = useGetRequestCountClickhouse(
    startOfMonthFormatted,
    endOfMonthFormatted,
    orgContext?.currentOrg?.id
  );

  const currentIcon = ORGANIZATION_ICONS.find(
    (icon) => icon.name === orgContext?.currentOrg?.icon
  );

  const currentColor = ORGANIZATION_COLORS.find(
    (icon) => icon.name === orgContext?.currentOrg?.color
  );

  const getProgress = (count: number) => {
    const cappedCount = Math.min(count, 100000);
    const percentage = (cappedCount / 100000) * 100;
    return percentage;
  };

  async function handleGrowthCheckout() {
    const stripe = await getStripe();

    if (!stripe) {
      console.error("Stripe failed to initialize.");
      return;
    }

    const res = await fetch("/api/stripe/create_growth_subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orgId: orgContext?.currentOrg?.id,
        userEmail: user?.email,
      }),
    });

    const { sessionId } = await res.json();

    const result = await stripe.redirectToCheckout({ sessionId });

    if (result.error) {
      console.error(result.error.message);
    }
  }

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col w-[512px] space-y-8">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-row items-center gap-2">
            {currentIcon && (
              <currentIcon.icon
                className={clsx(`text-${currentColor?.name}-500`, "h-6 w-6")}
              />
            )}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {orgContext?.currentOrg?.name}
            </h1>
          </div>
          <div className="border-2 p-4 text-sm rounded-lg flex flex-col text-gray-600 border-gray-300 dark:text-gray-200 dark:border-gray-700 w-full gap-4">
            <div>
              <p className="text-gray-900 dark:text-gray-100">
                Your Free Plan Limit
              </p>
            </div>
            <div className="flex flex-row gap-2 w-full h-4 items-center">
              <div className="relative h-full w-full flex-auto bg-gray-300 rounded-md">
                <div
                  className="aboslute h-full bg-purple-500 rounded-md"
                  style={{
                    width: `${getProgress(count?.data || 0)}%`,
                  }}
                ></div>
              </div>
              <div className="flex-1 w-full whitespace-nowrap">
                <div className="flex flex-row gap-1.5 items-center text-gray-900 dark:text-gray-100">
                  <span>{`${Number(count?.data).toLocaleString()}`}</span>
                  <span className="text-gray-400 text-sm">/</span>
                  <span className="text-sm text-gray-400">{`${Number(
                    100_000
                  ).toLocaleString()}`}</span>
                </div>
              </div>
            </div>
          </div>
          {count && count?.data <= 50_000 ? (
            <h1 className="text-sm text-gray-700 dark:text-gray-300">
              Your organization is currently on the free plan and within our
              free plan limits. As your company grows, you may want to consider
              upgrading to the Growth plan to unlock more features, uncapped
              request logs, and priority support.
            </h1>
          ) : (
            <h1 className="text-sm text-gray-700 dark:text-gray-300">
              Your organization is approaching the free plan limit. We recommend
              fast-growing companies like yours to upgrade to the Growth plan to
              uncap your request log limit and unlock other premium features.
            </h1>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[
            "Unlimited request logs (pay as you go)",
            "Expanded access to prompt templates",
            "Expanded access to prompt experiments",
            "Priority support",
            "Lower rate limits on all features",
          ].map((item, i) => (
            <div key={i} className="text-sm flex flex-row items-center">
              <SparklesIcon className="h-4 w-4 mr-2 text-yellow-500" />
              <span className="dark:text-gray-100">{item}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-300 flex justify-end gap-2 pt-4">
          <button
            onClick={() => setOpen(false)}
            className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => handleGrowthCheckout()}
            className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Upgrade to Growth
          </button>
        </div>
      </div>
    </ThemedModal>
  );
};

export default UpgradeProModal;
