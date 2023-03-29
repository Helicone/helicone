import { PlusIcon } from "@heroicons/react/20/solid";
import { KeyIcon } from "@heroicons/react/24/outline";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DEMO_EMAIL } from "../../../lib/constants";
import { middleTruncString } from "../../../lib/stringHelpers";
import { hashAuth } from "../../../lib/supabaseClient";
import { useDeleteKey, useGetKeys } from "../../../services/hooks/keys";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import LoadingAnimation from "../../shared/loadingAnimation";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import ThemedTable from "../../shared/themed/themedTable";
import AddKeyModal from "./addKeyModal";

interface KeyPageProps {}

export const HeliconeKeyPage = (props: KeyPageProps) => {
  const user = useUser();

  const supabaseClient = useSupabaseClient<Database>();
  const [selectedKey, setSelectedKey] =
    useState<Database["public"]["Tables"]["user_api_keys"]["Row"]>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const onDeleteHandler = (
    key: Database["public"]["Tables"]["user_api_keys"]["Row"]
  ) => {
    setSelectedKey(key);
    setDeleteOpen(true);
  };

  const { count, isLoading, keys, refetch } = useGetKeys();
  const { deleteKey, error } = useDeleteKey();

  const { setNotification } = useNotification();
  const apiKey = "hello";

  const renderKeyTable = () => {
    if (count < 1) {
      return (
        <div className="mt-10 relative block w-full rounded-lg border-2 border-dashed border-red-300 p-12 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <div className="w-full justify-center align-middle items-center">
            <KeyIcon className="h-10 w-10 mx-auto text-red-500" />
          </div>

          <span className="mt-2 block text-sm font-medium text-red-500">
            Add a key to get started using Helicone
          </span>
        </div>
      );
    } else {
      return (
        <ThemedTable
          columns={[
            { name: "Name", key: "key_name", hidden: false },
            { name: "Hash", key: "api_key_hash", hidden: true },
            { name: "Preview", key: "api_key_preview", hidden: true },
            { name: "Created", key: "created_at", hidden: false },
          ]}
          rows={keys.map((key) => {
            return {
              ...key,
              key_name: (
                <input
                  type="string"
                  defaultValue={key.key_name ?? "No Name"}
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
          deleteHandler={onDeleteHandler}
        />
      );
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 max-w-2xl space-y-8">
        <div className="bg-white border border-gray-100 sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Generate API Key
            </h3>
            <div className="mt-5 sm:flex sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="api-key" className="sr-only">
                  name
                </label>
                <input
                  type="text"
                  name="api-key"
                  id="api-key"
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-theme-primary-dark focus:ring-theme-primary-dark sm:text-sm p-2"
                  placeholder="API key name"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  const _name = (name ?? "") === "" ? "My Api Key" : name;
                  generateUserAPIKey({
                    name: _name,
                    userId: session?.user?.id ?? "",
                    onSuccess: (key) => {
                      console.log(key);
                      // copy api key to clipbaord
                      setApiKey(key);
                      onGenerateNewKey();
                    },
                    onError: (error) => console.log(error),
                  });
                }}
                className="mx-5 bg-theme-primary-dark text-dark-secondary my-2 md:my-0"
              >
                Generate Key
              </button>
            </div>
            {apiKey !== "" && (
              <div className="pt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-700 ">
                  <div className="flex flex-row gap-3">
                    Your shiny new API Key:{" "}
                    <div className="flex flex-col items-center">
                      <button
                        className="text-green-500 underline"
                        onClick={() => {
                          navigator.clipboard.writeText(apiKey);
                          setNotification("Copied to clipboard!", "success");
                        }}
                      >
                        {apiKey}
                      </button>
                      {/* {copied && "copied!"} */}
                    </div>
                  </div>
                </h3>

                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>
                    This is your API key - please copy this now somewhere safe.
                    You will <span className="text-red-500">NOT</span> be able
                    to see this again!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        {isLoading ? (
          <LoadingAnimation title={"Loading your keys..."} />
        ) : (
          <>
            {renderKeyTable()}
            <div className="w-full flex justify-end">
              <button
                onClick={() => setAddOpen(true)}
                className="items-center rounded-md bg-black px-3.5 py-1.5 text-base font-medium leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <PlusIcon className="h-5 w-5 inline mb-0.5" />
                Add Key
              </button>
            </div>
          </>
        )}
      </div>

      {addOpen && <AddKeyModal open={addOpen} setOpen={setAddOpen} />}

      {/* {deleteOpen && selectedKey !== undefined && (
        <ThemedModal open={deleteOpen} setOpen={setDeleteOpen}>
          <div className="flex flex-col gap-4 w-full">
            <p className="font-bold text-lg">Delete API Key</p>
            <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
              This API key will be deleted from your account. API requests
              already made with this key will still be stored on our servers. If
              you delete this key and re-add it later, the requests made with
              this key will become visible again.
            </p>
            <div className="w-full flex justify-end gap-4 mt-4">
              <button
                onClick={() => {
                  setDeleteOpen(false);
                }}
                className={clsx(
                  "relative inline-flex items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                )}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (user?.email === DEMO_EMAIL) {
                    setNotification("Demo key can not be deleted", "error");
                    return;
                  }

                  deleteKey(selectedKey.api_key_hash);

                  if (error) {
                    setNotification("Error deleting key", "error");
                    return;
                  }

                  setNotification("Key successfully deleted", "success");
                  setDeleteOpen(false);
                }}
                className={clsx(
                  "relative inline-flex items-center rounded-md hover:bg-red-700 bg-red-500 px-4 py-2 text-sm font-medium text-white"
                )}
              >
                Delete
              </button>
            </div>
          </div>
        </ThemedModal>
      )} */}
    </>
  );
};
