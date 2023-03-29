import { KeyIcon } from "@heroicons/react/24/outline";
import generateApiKey from "generate-api-key";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { hashAuth } from "../../../lib/supabaseClient";
import { useHeliconeKeys } from "../../../services/hooks/helicone-keys";
import { Database } from "../../../supabase/database.types";
import LoadingAnimation from "../../shared/loadingAnimation";
import ThemedTable from "../../shared/themed/themedTable";
import AddKeyModal from "./addKeyModal";
import Link from "next/link";

interface HeliconeKeyPageProps {}
const randomNames = [
  "Ada Lovelace",
  "Grace Hopper",
  "Marie Curie",
  "Stephen Hawking",
  "Alan Turing",
  "Nikola Tesla",
  "Isaac Newton",
  "Rosalind Franklin",
  "Albert Einstein",
  "Linus Torvalds",
];

export const HeliconeKeyPage = (props: HeliconeKeyPageProps) => {
  const user = useUser();
  const { keys, error, isLoading, refetch } = useHeliconeKeys();

  const supabaseClient = useSupabaseClient<Database>();
  const [addOpen, setAddOpen] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [name, setName] = useState(
    randomNames[Math.floor(Math.random() * randomNames.length)]
  );

  const renderKeyTable = () => {
    if ((keys?.data?.length ?? 0) < 1) {
      return (
        <div className="mt-10 relative block w-full rounded-lg border-2 border-dashed border-red-300 p-12 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <div className="w-full justify-center align-middle items-center">
            <KeyIcon className="h-10 w-10 mx-auto text-red-500" />
          </div>

          <span className="mt-2 block text-sm font-medium text-red-500">
            Add a key to get started using Helicone{"'"}s API Key
          </span>
        </div>
      );
    } else {
      return (
        <ThemedTable
          columns={[
            { name: "Name", key: "key_name", hidden: false },
            { name: "Created", key: "created_at", hidden: false },
          ]}
          rows={keys?.data?.map((key) => {
            return {
              ...key,
              key_name: (
                <input
                  type="string"
                  defaultValue={key.api_key_name ?? "No Name"}
                  className="max-w-sm border-none outline-none"
                  onChange={(e) => {
                    supabaseClient
                      .from("user_api_keys")
                      .update({
                        key_name: e.target.value,
                      })
                      .eq("api_key_hash", key.api_key_hash)
                      .then((res) => {
                        console.log(res);
                      });
                  }}
                />
              ),
            };
          })}
          deleteHandler={(key) => {
            supabaseClient
              .from("helicone_api_keys")
              .delete()
              .eq("api_key_hash", key.api_key_hash)
              .then((res) => {
                console.log(res);
                refetch();
              });
          }}
        />
      );
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 max-w-2xl space-y-8">
        <div className="flex flex-col gap-3">
          <div>
            <div>
              These keys are used for the
              <a href="https://docs.helicone.ai/api/welcome">
                {" "}
                <b>Helicone API</b>
              </a>
              .
            </div>
            <div>
              Currently, the API is in <b>beta</b> and is subject to change.
            </div>
            <div>
              For updates and the latest news on the API, join our{" "}
              <a href="https://discord.gg/2TkeWdXNPQ">
                <b>Discord</b>
              </a>
              .
            </div>
          </div>

          <Link href="/api/graphql">
            <button className="text-xs w-full mx-auto bg-indigo-700 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Visit GraphQL playground
            </button>
          </Link>
        </div>
        <div className="bg-white border border-gray-100 sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Generate API Key
            </h3>
            <div className="mt-5 sm:flex sm:items-center gap-5">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="api-key" className="sr-only">
                  name
                </label>
                <input
                  type="text"
                  name="api-key"
                  id="api-key"
                  value={name}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-theme-primary-dark focus:ring-theme-primary-dark sm:text-sm p-2"
                  placeholder="API key name"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  const apiKey = `sk-${generateApiKey({
                    method: "base32",
                    dashes: true,
                  }).toString()}`.toLowerCase();
                  setApiKey(apiKey);
                  setAddOpen(true);
                  hashAuth(apiKey).then((res) => {
                    supabaseClient
                      .from("helicone_api_keys")
                      .insert({
                        api_key_hash: res,
                        user_id: user?.id!,
                        api_key_name: name,
                      })
                      .then((res) => refetch());
                  });
                }}
                className="items-center rounded-md bg-black px-3.5 py-1.5 text-base font-medium leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Generate Key
              </button>
            </div>
          </div>
        </div>
        {isLoading ? (
          <LoadingAnimation title={"Loading your keys..."} />
        ) : (
          <>{renderKeyTable()}</>
        )}
      </div>

      {<AddKeyModal open={addOpen} setOpen={setAddOpen} apiKey={apiKey} />}
    </>
  );
};
