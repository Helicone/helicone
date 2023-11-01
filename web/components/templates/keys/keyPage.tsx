import { BuildingOfficeIcon, KeyIcon } from "@heroicons/react/24/outline";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import generateApiKey from "generate-api-key";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DEMO_EMAIL } from "../../../lib/constants";
import { hashAuth } from "../../../lib/hashClient";

import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import { useOrg } from "../../shared/layout/organizationContext";
import LoadingAnimation from "../../shared/loadingAnimation";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import ThemedTable from "../../shared/themed/themedTable";
import ThemedTabs from "../../shared/themed/themedTabs";
import AddHeliconeKeyModal from "./addHeliconeKeyModal";
import { useKeysPage } from "./useKeysPage";
import { middleTruncString } from "../../../lib/stringHelpers";
import AddKeyModal from "./addKeyModal";
import { getUSDate, getUSDateFromString } from "../../shared/utils/utils";

interface KeyPageProps {
  hideTabs?: boolean;
}

const KeyPage = (props: KeyPageProps) => {
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

  console.log("helicone keys", heliconeKeys);

  const { setNotification } = useNotification();

  const renderHeliconeKeyTable = () => {
    if ((heliconeKeys?.data?.length ?? 0) < 1) {
      return (
        <button
          onClick={() => {
            setAddKeyOpen(true);
          }}
          className="mt-8 relative block w-full rounded-lg border-2 border-dashed bg-gray-200 hover:bg-gray-300 hover:cursor-pointer border-gray-500 p-12 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <div className="w-full justify-center align-middle items-center">
            <KeyIcon className="h-10 w-10 mx-auto text-gray-900" />
          </div>

          <span className="mt-2 block text-sm font-medium text-gray-900">
            Click here to generate a Helicone key
          </span>
        </button>
      );
    } else {
      return (
        <ThemedTable
          columns={[
            { name: "Name", key: "key_name", hidden: false },
            { name: "Created", key: "created_at", hidden: false },
          ]}
          rows={heliconeKeys?.data?.map((key) => {
            return {
              ...key,
              key_name: (
                <p className="font-semibold text-gray-900">
                  {key.api_key_name}
                </p>
              ),
              created_at: (
                <p className="text-gray-500">
                  {getUSDateFromString(key.created_at)}
                </p>
              ),
            };
          })}
          editHandler={onEditHandler}
          deleteHandler={onDeleteHeliconeHandler}
        />
      );
    }
  };

  // every time the edit modal is opened/closed, reset the edit name
  useEffect(() => {
    setEditName(selectedHeliconeKey?.api_key_name ?? "");
  }, [editOpen, selectedHeliconeKey?.api_key_name]);

  return (
    <>
      <div className="flex flex-col gap-2 max-w-2xl space-y-12 mt-8">
        <div className="text-gray-900 space-y-8 text-sm flex flex-col">
          <div className="flex flex-row sm:items-center pb-2 mb-2 justify-between">
            <div className="flex flex-col justify-between space-y-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Helicone Keys for:{" "}
                <span className="underline">
                  {org?.currentOrg.name ?? "No Org Found"}
                </span>
              </h1>
              <p className="text-md text-gray-900">
                These keys can be used to read and write data to Helicone.
                Please do not share these keys and make sure you store them
                somewhere secure.
              </p>
            </div>
          </div>
          {isLoading ? (
            <LoadingAnimation title={"Loading your keys..."} />
          ) : (
            <div className="space-y-12 pt-2">{renderHeliconeKeyTable()}</div>
          )}
          <div>
            <button
              onClick={() => setAddKeyOpen(true)}
              className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Generate New Key
            </button>
          </div>
        </div>
      </div>

      <AddKeyModal
        open={addKeyOpen}
        setOpen={setAddKeyOpen}
        user={user}
        org={org}
        onSuccess={refetchHeliconeKeys}
      />

      <ThemedModal open={editOpen} setOpen={setEditOpen}>
        <div className="flex flex-col gap-4 w-[400px]">
          <p className="font-semibold text-lg">Edit Helicone Key</p>
          <div className="w-full space-y-1.5 text-sm">
            <label htmlFor="api-key">Key Name</label>
            <input
              type="text"
              name="api-key"
              id="api-key"
              value={editName}
              className={clsx(
                "block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
              )}
              placeholder={selectedHeliconeKey?.api_key_name}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setEditOpen(false);
              }}
              className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (user?.email === DEMO_EMAIL) {
                  setNotification("Demo key can not be deleted", "error");
                  return;
                }
                supabaseClient
                  .from("helicone_api_keys")
                  .update({
                    api_key_name: editName,
                  })
                  .eq("api_key_hash", selectedHeliconeKey?.api_key_hash)
                  .then((res) => {
                    setEditOpen(false);
                    setNotification("Key successfully updated", "success");
                    refetchHeliconeKeys();
                  });
              }}
              className="items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Update
            </button>
          </div>
        </div>
      </ThemedModal>
      <ThemedModal open={deleteHeliconeOpen} setOpen={setDeleteHeliconeOpen}>
        <div className="flex flex-col gap-4 w-full">
          <p className="font-semibold text-lg">Delete Helicone Key</p>
          <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
            This Helicone key will be deleted from your account. You will no
            longer be able to use this for the your API requests. Are you sure
            you want to delete this key permanently?
          </p>
          <div className="w-full flex justify-end gap-4 mt-4">
            <button
              onClick={() => {
                setDeleteHeliconeOpen(false);
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

                supabaseClient
                  .from("helicone_api_keys")
                  .update({
                    soft_delete: true,
                  })
                  .eq("api_key_hash", selectedHeliconeKey?.api_key_hash)
                  .then((res) => {
                    setDeleteHeliconeOpen(false);
                    setNotification("Key successfully deleted", "success");
                    refetchHeliconeKeys();
                  });
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
    </>
  );
};

export default KeyPage;
