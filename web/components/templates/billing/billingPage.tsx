import {
  ArrowTopRightOnSquareIcon,
  ChevronDoubleRightIcon,
  ChevronRightIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import {
  CheckIcon,
  InformationCircleIcon,
  KeyIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { hydrate } from "react-dom";
import { middleTruncString } from "../../../lib/stringHelpers";
import { hashAuth } from "../../../lib/supabaseClient";
import { useKeys } from "../../../lib/useKeys";
import { Database } from "../../../supabase/database.types";
import ThemedTable from "../../shared/themedTable";
import { loadStripe } from "@stripe/stripe-js";

import getStripe from "../../../utlis/getStripe";
import Subscriptions from "./subscriptions";
import { subscriptionChange } from "../../../lib/subscriptionChange";
import AuthLayout from "../../shared/layout/authLayout";
import { useRouter } from "next/router";
import { UserSettingsResponse } from "../../../pages/api/user_settings";
import Stripe from "stripe";
export type Tier = "free" | "pro" | "enterprise" | "pro-pending-cancel";
export async function fetchPostJSON(url: string, data?: {}) {
  try {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *client
      body: JSON.stringify(data || {}), // body data type must match "Content-Type" header
    });
    return await response.json(); // parses JSON response into native JavaScript objects
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
    throw err;
  }
}

interface BillingPageProps {}

const ProgressBar = ({ percent }: { percent: number }) => {
  return (
    <div className="bg-gray-300 h-4 rounded overflow-hidden">
      <div
        className="bg-blue-500 text-xs  h-full"
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );
};

const RequestProgress = ({ userLimit }: { userLimit: number }) => {
  const client = useSupabaseClient<Database>();
  const [requestsCount, setRequestsCount] = useState(0);

  useEffect(() => {
    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0);
    startOfThisMonth.setMinutes(0);
    startOfThisMonth.setSeconds(0);
    startOfThisMonth.setMilliseconds(0);

    client &&
      client
        .from("request_rbac")
        .select("*", { count: "exact" })
        .gte("created_at", startOfThisMonth.toISOString())
        .then((res) => {
          if (res.error !== null) {
            console.error(res.error);
          } else {
            setRequestsCount(res.count!);
          }
        });
  }, [client]);

  // This is a simple progress bar using tailwindcss
  return (
    <div>
      <ProgressBar
        percent={
          userLimit === 0
            ? 0
            : Math.round((requestsCount / userLimit) * 100 * 1000) / 1000
        }
      />
      <div className="text-xs text-gray-500">
        {requestsCount} / {userLimit} requests
      </div>
      <div className="text-xs text-gray-500">
        You have {userLimit - requestsCount} requests left this month.
      </div>
    </div>
  );
};
const CurrentSubscriptionStatus = ({
  subscription,
  tier,
}: {
  subscription?: Stripe.Subscription;
  tier: Tier;
}) => {
  if (tier === "free") {
    return (
      <div className="text-gray-500">
        You are currently on the free tier. You can upgrade to the pro tier to
        get more requests per month.
      </div>
    );
  } else if (tier === "pro") {
    return (
      <div className="text-gray-500">
        You are currently on the pro tier. You can upgrade to the enterprise
        tier to get more requests per month.
      </div>
    );
  } else if (tier === "pro-pending-cancel") {
    const endingDate = new Date(
      subscription?.current_period_end! * 1000
    ).toLocaleDateString();
    const daysLeft = Math.round(
      (subscription?.current_period_end! * 1000 - Date.now()) /
        1000 /
        60 /
        60 /
        24
    );
    return (
      <div className="text-gray-500">
        You pro account is still active until {endingDate} ({daysLeft} days
        left). You can upgrade to the enterprise tier to get more requests per
        month.
      </div>
    );
  } else if (tier === "enterprise") {
    return (
      <div className="text-gray-500">
        You are currently on the enterprise tier. You can downgrade to the pro
        tier to get less requests per month.
      </div>
    );
  } else {
    return <div></div>;
  }
};

const BillingPage = (props: BillingPageProps) => {
  const [userSettings, setUserSettings] = useState<UserSettingsResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user_settings")
      .then((res) => {
        if (res.status === 200) {
          return res.json() as Promise<UserSettingsResponse>;
        } else {
          setError("Failed to get request limit");
          return null;
        }
      })
      .then((data) => {
        console.log("LIMIT IS", data);
        setUserSettings(data);
      });
  }, []);

  const router = useRouter();
  if (userSettings === null) {
    return (
      <AuthLayout>
        <div className="animate-pulse w-full h-40 bg-white p-10 text-gray-500">
          {error === null ? (
            "Fetching your billing information..."
          ) : (
            <div className="text-red-500">{error}</div>
          )}
        </div>
      </AuthLayout>
    );
  }
  const currentTier = userSettings.user_settings.tier as Tier;

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-16 overflow-scroll">
        <div className="flex flex-col space-y-2">
          <div className="text-gray-500">
            Manage your billing and subscription
          </div>
        </div>
        <div className="flex flex-col space-y-2 ">
          <div className="text-xl font-bold">Request Limit</div>
          <div className="text-gray-500">
            You can make {userSettings.user_settings.request_limit ?? 0}{" "}
            requests per month
          </div>
          <RequestProgress
            userLimit={userSettings.user_settings.request_limit ?? 0}
          />
          <div className="border-2 p-5 rounded-md flex gap-5 items-center text-gray-500">
            <LightBulbIcon className="h-6 w-6 text-gray-500" />
            We continue logging your requests after your limit is reached, you
            will just lose access to the dashboard until you upgrade.
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="text-xl font-bold">Subscription</div>
          <CurrentSubscriptionStatus
            subscription={userSettings.subscription}
            tier={currentTier}
          />
          <Subscriptions
            activeSubscription={currentTier}
            onClick={(newTier) =>
              subscriptionChange(newTier, currentTier, router)
            }
          />
        </div>
      </div>
    </AuthLayout>
  );
};

export default BillingPage;
