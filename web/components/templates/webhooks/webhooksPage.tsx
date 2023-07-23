import { User, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "../../../supabase/database.types";
import { useQuery } from "@tanstack/react-query";
import useNotification from "../../shared/notification/useNotification";
import { useOrg } from "../../shared/layout/organizationContext";
import ThemedTable from "../../shared/themed/themedTable";
import { useState } from "react";
import { Result } from "../../../lib/result";

interface WebhooksPageProps {
  user: User;
}

const WebhooksPage = (props: WebhooksPageProps) => {
  const client = useSupabaseClient<Database>();
  const { setNotification } = useNotification();
  const org = useOrg();

  const { data: webhooks, refetch: refetchWebhooks } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async (query) => {
      return client
        .from("webhooks")
        .select("*")
        .eq("org_id", org?.currentOrg.id);
    },
    refetchOnWindowFocus: false,
  });
  const [selectedModel, setSelectedModel] = useState<{
    destination: string;
  }>();

  return (
    <div className="flex flex-col gap-10">
      <div className="">
        <ThemedTable
          columns={[
            { name: "Destination", key: "destination", hidden: false },
            { name: "Verified", key: "is_verified", hidden: false },
            { name: "Text Record", key: "txt_record", hidden: false },
            { name: "Created", key: "created_at", hidden: false },
          ]}
          rows={webhooks?.data?.map((webhook) => {
            return {
              created_at: new Date(webhook.created_at!).toLocaleString(),
              is_verified: webhook.is_verified ? "Verified" : "Pending",
              txt_record: webhook.txt_record,
              id: webhook.id,
              destination: webhook.destination,
            };
          })}
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
      </div>
      <div className="bg-white p-10 rounded-md">
        Add the following TXT records to your domain:
        <div className="flex flex-col gap-1">
          {webhooks?.data?.map((webhook) => {
            return (
              <div className="bg-gray-100 p-5 rounded-md" key={webhook.id}>
                helicone-verify.{new URL(webhook.destination).hostname}{" "}
                {webhook.txt_record}
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white p-10 rounded-md flex flex-row gap-10">
        <textarea
          className="w-full resize-none max-w-sm h-10 border rounded-md"
          placeholder="https://google.com"
          onChange={(e) => {
            setSelectedModel({
              ...selectedModel!,
              destination: e.target.value,
            });
          }}
          value={selectedModel?.destination}
        />

        <button
          className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            fetch("/api/webhooks/add", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                destination: selectedModel?.destination ?? "",
              }),
            })
              .then((res) => res.json() as Promise<Result<boolean, string>>)
              .then((res) => {
                if (res.error) {
                  setNotification(res.error, "error");
                } else {
                  setNotification("Webhook created!", "success");
                  refetchWebhooks();
                }
              });
          }}
        >
          Add Webhook
        </button>
      </div>
    </div>
  );
};

export default WebhooksPage;
