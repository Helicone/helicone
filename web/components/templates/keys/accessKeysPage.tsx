import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

import { useState } from "react";

import { Database } from "../../../supabase/database.types";
import { useOrg } from "../../layout/org/organizationContext";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import { useKeysPage } from "./useKeysPage";
import { useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";

interface KeyPageProps {
  hideTabs?: boolean;
}

const keyPermissions = new Map([
  ["r", "Read"],
  ["w", "Write"],
  ["rw", "Read/Write"],
]);

const AccessKeysPage = (props: KeyPageProps) => {
  const user = useUser();
  const org = useOrg();

  const supabaseClient = useSupabaseClient<Database>();
  const [editOpen, setEditOpen] = useState(false);
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [deleteHeliconeOpen, setDeleteHeliconeOpen] = useState(false);
  const [selectedHeliconeKey, setSelectedHeliconeKey] =
    useState<Database["public"]["Tables"]["helicone_api_keys"]["Row"]>();
  const [editName, setEditName] = useState<string>("");

  const onEditHandler = (
    key: Database["public"]["Tables"]["helicone_api_keys"]["Row"]
  ) => {
    setSelectedHeliconeKey(key);
    setEditOpen(true);
  };

  const onDeleteHeliconeHandler = (
    key: Database["public"]["Tables"]["helicone_api_keys"]["Row"]
  ) => {
    setSelectedHeliconeKey(key);
    setDeleteHeliconeOpen(true);
  };

  const { heliconeKeys, isLoading, refetchHeliconeKeys } = useKeysPage();

  const currentUsage = 17.5;

  const { setNotification } = useNotification();

  const myLimits = useQuery({
    queryKey: ["my-limits", org?.currentOrg?.id],
    queryFn: () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.GET("/v1/gov-organization/my-limits");
    },
  });

  const days =
    (myLimits.data?.data?.data?.governance_limits?.days as number) ?? 0;
  const totalUsage =
    (myLimits.data?.data?.data?.governance_limits?.limitUSD as number) ?? 0;
  const isUnlimited = totalUsage === 0;

  // every time the edit modal is opened/closed, reset the edit name

  return (
    <>
      <div className="flex flex-col gap-2 max-w-2xl space-y-12 mt-8">
        <div className="text-gray-900 dark:text-gray-100 space-y-8 text-sm flex flex-col">
          <div className="flex flex-row sm:items-center justify-between">
            <div className="space-y-4">
              <p className="text-md text-gray-900 dark:text-gray-100">
                Access keys allow you to generate API keys with specific usage
                limits. Monitor your usage below for the current 30-day period.
              </p>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">About Usage Limits</p>
                <p className="text-gray-600 dark:text-gray-400">
                  This shows your personal usage limit and spending. Note that
                  your API requests are also subject to your organization&apos;s
                  overall usage limits. If either your personal limit or the
                  organization&apos;s limit is reached, API requests will be
                  blocked until the respective limit resets.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Current Usage: $
                {currentUsage.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              {isUnlimited ? (
                <span>Unlimited</span>
              ) : (
                <span>
                  $
                  {totalUsage.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  limit
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className={clsx(
                  "h-2.5 rounded-full",
                  isUnlimited
                    ? "bg-green-500"
                    : currentUsage / totalUsage > 0.9
                    ? "bg-red-500"
                    : currentUsage / totalUsage > 0.7
                    ? "bg-yellow-500"
                    : "bg-green-500"
                )}
                style={{
                  width: `${Math.min(100, (currentUsage / totalUsage) * 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Usage resets every {days} days
            </p>
          </div>

          <div>
            <button
              onClick={() => setAddKeyOpen(true)}
              className="bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-300 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold text-white dark:text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Generate New Key
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccessKeysPage;
