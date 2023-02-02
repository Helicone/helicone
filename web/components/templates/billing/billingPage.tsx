import {
  ArrowTopRightOnSquareIcon,
  ChevronDoubleRightIcon,
  ChevronRightIcon,
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
import LeftNavLayout from "../../shared/leftNavLayout";
import ThemedTable from "../../shared/themedTable";
import { loadStripe } from "@stripe/stripe-js";

import getStripe from "../../../utlis/getStripe";
import Subscriptions from "./subscriptions";
import { subscriptionChange } from "../../../lib/subscriptionChange";

type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

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

export async function fetchDeleteJSON(url: string, data?: {}) {
  try {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "DELETE", // *GET, POST, PUT, DELETE, etc.
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

  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    client &&
      client
        .from("request_rbac")
        .select("*", { count: "exact" })
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
    </div>
  );
};
type Tier = "free" | "pro" | "enterprise";
interface BillingInfo {
  tier: Tier;
  userLimit: number;
}

const BillingPage = (props: BillingPageProps) => {
  const user = useUser();

  const supabaseClient = useSupabaseClient<Database>();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const tier: Tier = (userSettings?.tier as Tier) ?? "free";
  useEffect(() => {
    fetch("/api/user_settings")
      .then((res) => {
        if (res.status === 200) {
          return res.json() as Promise<UserSettings>;
        } else {
          throw new Error("Failed to get request limit");
        }
      })
      .then((data) => {
        console.log("LIMIT IS", data);
        setUserSettings(data);
      });
  }, []);
  const handleSubmit = async () => {
    // Create a Checkout Session.
    const response = await fetchPostJSON("/api/checkout_sessions");

    if (response.statusCode === 500) {
      console.error(response.message);
      return;
    }

    // Redirect to Checkout.
    const stripe = await getStripe();
    const { error } = await stripe!.redirectToCheckout({
      // Make the id field from the Checkout Session creation API response
      // available to this file, so you can provide it as parameter here
      // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
      sessionId: response.id,
    });
    // If `redirectToCheckout` fails due to a browser or network
    // error, display the localized error message to your customer
    // using `error.message`.
    console.warn(error.message);
  };
  const handleDelete = async () => {
    const response = await fetchDeleteJSON("/api/subscription/5");
  };

  return (
    <LeftNavLayout>
      <div className="flex flex-col space-y-16 overflow-scroll">
        <div className="flex flex-col space-y-2">
          <div className="text-gray-500">
            Manage your billing and subscription
          </div>
        </div>
        <div className="flex flex-col space-y-2 ">
          <div className="text-xl font-bold">Request Limit</div>
          <div className="text-gray-500">
            You can make {userSettings?.request_limit ?? 0} requests per month
          </div>
          <RequestProgress userLimit={userSettings?.request_limit ?? 0} />
        </div>

        <div className="flex flex-col space-y-2">
          <div className="text-xl font-bold">Subscription</div>

          <Subscriptions
            activeSubscription={tier}
            onClick={(tier) => subscriptionChange(tier)}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <div className="text-xl font-bold">Billing History</div>
          <div className="text-gray-500">kljdf</div>
        </div>
      </div>
    </LeftNavLayout>
  );
};

export default BillingPage;
