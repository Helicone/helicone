import { User, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "../../../supabase/database.types";
import { useQuery } from "@tanstack/react-query";
import useNotification from "../../shared/notification/useNotification";
import { useOrg } from "../../layout/organizationContext";
import ThemedTable from "../../shared/themed/themedTable";
import { useState } from "react";
import { getUSDateFromString } from "../../shared/utils/utils";
import { PlusIcon } from "@heroicons/react/20/solid";
import ThemedModal from "../../shared/themed/themedModal";
import AddWebhookForm from "./addWebhookForm";
import LoadingAnimation from "../../shared/loadingAnimation";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";

interface WebhooksPageProps {
  user: User;
}

const WebhooksPage = (props: WebhooksPageProps) => {
  const client = useSupabaseClient<Database>();
  const { setNotification } = useNotification();
  const org = useOrg();
  const [viewWebhookOpen, setViewWebhookOpen] = useState(false);
  const [addWebhookOpen, setAddWebhookOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>();

  const {
    data: webhooks,
    refetch: refetchWebhooks,
    isLoading,
  } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async (query) => {
      return client
        .from("webhooks")
        .select("*")
        .eq("org_id", org?.currentOrg?.id ?? "");
    },
    refetchOnWindowFocus: false,
  });

  if (
    org?.currentOrg?.tier !== "enterprise" &&
    org?.currentOrg?.tier !== "pro-20240913"
  ) {
    return (
      <div className="flex flex-col space-y-8 items-center min-h-[calc(100vh-200px)]">
        <InfoBox variant="warning" className="mb-4 max-w-xl">
          Webhooks are currently in beta. And are only available for Pro plans.
          If you have any issues, please contact us at support@helicone.ai.
        </InfoBox>
        <FeatureUpgradeCard
          title="Unlock Webhooks"
          description="The Free plan does not include the BETA webhooks feature, but getting access is easy."
          infoBoxText="Add webhooks to easily subscribe to API requests that come into Helicone."
          documentationLink="https://docs.helicone.ai/features/sessions"
        />
      </div>
    );
  }

  return (
    <>
      <InfoBox variant="warning" className="mb-4 max-w-xl">
        Vault is currently in beta. If you have any issues, please contact us at
        support@helicone.ai.
      </InfoBox>
      <div className="flex flex-col space-y-8">
        <div className="flex flex-row w-full justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Hosted Endpoints
          </h1>
          <button
            onClick={() => setAddWebhookOpen(true)}
            className="bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-300 flex flex-row whitespace-nowrap rounded-md pl-3 pr-4 py-2 text-sm font-semibold text-white dark:text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Webhook
          </button>
        </div>
        {isLoading ? (
          <LoadingAnimation title={"Loading webhooks..."} />
        ) : (
          <ThemedTable
            columns={[
              { name: "Destination", key: "destination", hidden: false },
              { name: "Status", key: "is_verified", hidden: false },
              { name: "Text Record", key: "txt_record", hidden: true },
              { name: "Created", key: "created_at", hidden: true },
            ]}
            rows={webhooks?.data?.map((webhook) => {
              return {
                created_at: getUSDateFromString(webhook.created_at!),
                is_verified: webhook.is_verified ? (
                  <span
                    className={`inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20`}
                  >
                    Verified
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20`}
                  >
                    Unverified
                  </span>
                ),
                txt_record: webhook.txt_record,
                id: webhook.id,
                destination: webhook.destination,
              };
            })}
            viewHandler={(row) => {
              setSelectedWebhook(row);
              setViewWebhookOpen(true);
            }}
            deleteHandler={(row) => {
              client
                .from("webhooks")
                .delete()
                .eq("id", row?.id)
                .then((res) => {
                  if (res.error) {
                    setNotification(res.error.message, "error");
                  } else {
                    setNotification("Webhook deleted!", "success");
                    refetchWebhooks();
                  }
                });
            }}
          />
        )}
      </div>
      <ThemedDrawer open={viewWebhookOpen} setOpen={setViewWebhookOpen}>
        {selectedWebhook ? (
          <div className="flex flex-col space-y-4 py-4">
            <h1 className="text-lg font-semibold text-violet-700">Webhook</h1>
            <p className="text-2xl text-gray-900 font-semibold underline">
              {selectedWebhook.destination}
            </p>
            <ul className="divide-y divide-gray-200 text-sm">
              <li className="flex flex-row justify-between items-center py-2 gap-4">
                <p className="font-semibold text-gray-900 whitespace-nowrap">
                  Created
                </p>
                <p className="text-gray-700 truncate">
                  {selectedWebhook.created_at}
                </p>
              </li>
              <li className="flex flex-row justify-between items-center py-2 gap-4">
                <p className="font-semibold text-gray-900">Status</p>
                {selectedWebhook.is_verified ? (
                  <span
                    className={`inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20`}
                  >
                    Verified
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20`}
                  >
                    Unverified
                  </span>
                )}
              </li>
              <li className="flex flex-row justify-between items-center py-2 gap-4">
                <p className="font-semibold text-gray-900 whitespace-nowrap">
                  Text Record
                </p>
                <p className="text-gray-700 truncate">
                  {selectedWebhook.txt_record}
                </p>
              </li>
            </ul>
            <h1 className="text-lg font-semibold text-violet-700 pt-12">
              Verification Steps
            </h1>
            <p className="text-gray-700">
              Add the following TXT records to your domain:
            </p>
            <div className="bg-gray-100 p-6 rounded-lg break-words font-mono relative">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `helicone-verify.${
                      new URL(selectedWebhook.destination).hostname
                    } ${selectedWebhook.txt_record}`
                  );
                  setNotification("Copied to clipboard!", "success");
                }}
              >
                <ClipboardIcon className="h-5 w-5 text-gray-700 absolute right-4 top-4" />
              </button>
              <span>
                {`helicone-verify.${
                  new URL(selectedWebhook.destination).hostname
                } ${selectedWebhook.txt_record}`}
              </span>
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </ThemedDrawer>
      <ThemedModal open={addWebhookOpen} setOpen={setAddWebhookOpen}>
        <AddWebhookForm
          refetchWebhooks={refetchWebhooks}
          close={() => setAddWebhookOpen(false)}
        />
      </ThemedModal>
    </>
  );
};

export default WebhooksPage;
