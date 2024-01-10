import { RadioGroup } from "@headlessui/react";
import {
  CheckIcon,
  InformationCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { SecretInput } from "../../../../shared/themed/themedTable";
import { useVaultPage } from "../../../vault/useVaultPage";
import { clsx } from "../../../../shared/clsx";
import { useState } from "react";
import CreateProviderKeyModal from "../../../vault/createProviderKeyModal";
import { Tooltip } from "@mui/material";
import ThemedModal from "../../../../shared/themed/themedModal";
import { DecryptedProviderKey } from "../../../../../services/lib/keys";
import useNotification from "../../../../shared/notification/useNotification";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useOrg } from "../../../../shared/layout/organizationContext";

interface ProviderKeyListProps {
  setProviderKeyCallback?: (key: string) => void;
  orgId?: string; // the id of the org that we want to change provider keys for
  orgProviderKey?: string;
}

const ProviderKeyList = (props: ProviderKeyListProps) => {
  const { setProviderKeyCallback, orgId, orgProviderKey } = props;

  const { providerKeys, refetchProviderKeys } = useVaultPage();
  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient();

  const [providerKey, setProviderKey] = useState(orgProviderKey);

  const [isProviderOpen, setIsProviderOpen] = useState(false);

  const [deleteProviderOpen, setDeleteProviderOpen] = useState(false);

  const [selectedProviderKey, setSelectedProviderKey] =
    useState<DecryptedProviderKey>();

  const changeProviderKeyHandler = async (newProviderKey: string) => {
    if (setProviderKeyCallback) {
      setProviderKeyCallback(newProviderKey);
      return;
    }

    if (orgId) {
      // update the current orgs provider key if the orgId is set
      const { error } = await supabaseClient
        .from("organization")
        .update({ org_provider_key: newProviderKey })
        .eq("id", orgId);

      if (error) {
        setNotification("Error Updating Provider Key", "error");
      } else {
        setNotification("Provider Key Updated", "success");
        setProviderKey(newProviderKey);
      }
    }
  };

  const deleteProviderKey = async (id: string) => {
    fetch(`/api/provider_keys/${id}/delete`, { method: "DELETE" })
      .then(() => {
        refetchProviderKeys();

        setNotification("Provider Key Deleted", "success");
        setDeleteProviderOpen(false);
      })
      .catch(() => {
        setNotification("Error Deleting Provider Key", "error");
        setDeleteProviderOpen(false);
      });
  };

  return (
    <>
      <div className="w-full">
        <div className="mx-auto w-full space-y-4 mt-8">
          <div className="flex flex-row justify-between items-center">
            <div className="flex items-center space-x-2 py-2">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Provider Keys
              </h3>
              <Tooltip title="This key will be used to map to your customer's proxy keys, allowing you to control their spend via configurable rate limits.">
                <InformationCircleIcon className="h-4 w-4 inline text-gray-500" />
              </Tooltip>
            </div>

            <div className="flex flex-row space-x-4">
              <button
                onClick={() => {
                  setIsProviderOpen(true);
                }}
                className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Create New Key
              </button>
            </div>
          </div>
          <RadioGroup
            value={providerKey}
            onChange={(keyId: string) => {
              changeProviderKeyHandler(keyId);
            }}
          >
            <RadioGroup.Label className="sr-only">Server size</RadioGroup.Label>
            <div className="space-y-2">
              {providerKeys.map((key) => (
                <RadioGroup.Option
                  key={key.id}
                  value={key.id}
                  className={({ active, checked }) =>
                    clsx(
                      checked
                        ? "bg-sky-100 ring-sky-300 dark:bg-sky-900 dark:ring-sky-700"
                        : "bg-white ring-gray-300 dark:bg-black dark:ring-gray-700",
                      "ring-1 relative flex cursor-pointer rounded-lg p-4 shadow-sm focus:outline-none"
                    )
                  }
                >
                  {({ active, checked }) => (
                    <>
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm flex space-x-2 items-center">
                            <RadioGroup.Label
                              as="p"
                              className={`font-medium text-black dark:text-white`}
                            >
                              {key.provider_key_name}
                            </RadioGroup.Label>
                            <RadioGroup.Description
                              as="span"
                              className={`inline text-gray-500 text-xs pl-2`}
                            >
                              <SecretInput
                                value={key.provider_key || ""}
                                variant="secondary"
                              />
                            </RadioGroup.Description>
                          </div>
                        </div>

                        {checked ? (
                          <CheckIcon
                            className="h-5 w-5 text-sky-500"
                            aria-hidden="true"
                          />
                        ) : (
                          <button
                            onClick={(e) => {
                              setSelectedProviderKey(key);
                              setDeleteProviderOpen(true);
                            }}
                          >
                            <TrashIcon className="h-6 w-6 text-red-500 hover:bg-red-100 p-1 rounded-md" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>
        </div>
      </div>
      <CreateProviderKeyModal
        open={isProviderOpen}
        variant={"portal"}
        setOpen={setIsProviderOpen}
        onSuccess={() => refetchProviderKeys()}
      />
      <ThemedModal open={deleteProviderOpen} setOpen={setDeleteProviderOpen}>
        <div className="flex flex-col gap-4 w-full">
          <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            Delete Provider Key
          </p>
          <p className="text-gray-700 dark:text-gray-300 w-[400px] whitespace-pre-wrap text-sm">
            This Provider Key will be deleted from your account. All proxy keys
            that are mapped to this provider key will be deleted as well. Are
            you sure you want to delete this provider key?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteProviderOpen(false)}
              type="button"
              className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 text-gray-900 dark:hover:bg-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (selectedProviderKey?.id) {
                  await deleteProviderKey(selectedProviderKey.id!);
                }
              }}
              className="items-center rounded-md bg-red-500 px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Delete
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default ProviderKeyList;
