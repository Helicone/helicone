import { RadioGroup } from "@headlessui/react";
import { CheckCircleIcon, PlusIcon } from "@heroicons/react/20/solid";
import { KeyIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useCallback, useState } from "react";
import { DecryptedProviderKey } from "../../../../../services/lib/keys";
import { clsx } from "../../../../shared/clsx";
import useNotification from "../../../../shared/notification/useNotification";
import ThemedModal from "../../../../shared/themed/themedModal";
import { SecretInput } from "../../../../shared/themed/themedTable";
import HcButton from "../../../../ui/hcButton";
import CreateProviderKeyModal from "../../../vault/createProviderKeyModal";
import { useVaultPage } from "../../../vault/useVaultPage";

interface ProviderKeyListProps {
  variant?: "portal" | "basic";
  setProviderKeyCallback?: (key: string) => void;
  orgId?: string; // the id of the org that we want to change provider keys for
  orgProviderKey?: string;
  showTitle?: boolean;
  setDecryptedKey?: (key: string) => void;
  defaultProviderKey?: string | null;
}

const ProviderKeyList = (props: ProviderKeyListProps) => {
  const {
    setProviderKeyCallback,
    setDecryptedKey,
    orgId,
    orgProviderKey,
    variant = "portal",
    defaultProviderKey,
    showTitle = true,
  } = props;

  const { providerKeys, refetchProviderKeys } = useVaultPage();
  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient();

  const [providerKey, setProviderKey] = useState(
    defaultProviderKey || orgProviderKey
  );

  const [isProviderOpen, setIsProviderOpen] = useState(false);

  const [deleteProviderOpen, setDeleteProviderOpen] = useState(false);

  const [selectedProviderKey, setSelectedProviderKey] =
    useState<DecryptedProviderKey>();

  const changeProviderKeyHandler = useCallback(
    async (newProviderKey: string) => {
      if (setProviderKeyCallback) {
        setProviderKey(newProviderKey);
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
    },
    [
      setProviderKeyCallback,
      orgId,
      supabaseClient,
      setNotification,
      setProviderKey,
    ]
  );

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
        <div className="mx-auto w-full space-y-2">
          {defaultProviderKey}
          {providerKey}
          <div className="flex flex-row justify-between items-center">
            <div className="flex items-center space-x-1">
              <Tooltip title="Provider Keys are used to authenticate your requests to the API. This key is securely stored using our vault technologies, with the state of the art encryption.">
                <label
                  htmlFor="alert-metric"
                  className="text-gray-900 dark:text-gray-100 text-xs font-semibold"
                >
                  Provider Keys
                </label>
              </Tooltip>
            </div>
          </div>

          {providerKeys.length === 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsProviderOpen(true);
              }}
              className="p-6 flex flex-col w-full h-full justify-center items-center border border-gray-300 dark:border-gay-700 rounded-md"
            >
              <KeyIcon className="h-4 w-4 text-black dark:text-white" />
              <p className="text-xs text-gray-500 font-semibold pt-2">
                Please create a provider key.{" "}
                <Tooltip title="Provider Keys are used to authenticate your requests to the API. This key is securely stored using our vault technologies, with the state of the art encryption.">
                  <span className="underline cursor-pointer">Learn more.</span>
                </Tooltip>
              </p>
            </button>
          ) : (
            <RadioGroup
              value={providerKey}
              onChange={(keyId: string) => {
                changeProviderKeyHandler(keyId);
              }}
            >
              <RadioGroup.Label className="sr-only">
                Server size
              </RadioGroup.Label>
              <div className="space-y-2">
                {providerKeys.map((key) => (
                  <RadioGroup.Option
                    key={key.id}
                    value={key.id}
                    onClick={() => {
                      if (setDecryptedKey) {
                        setDecryptedKey(key.provider_key || "");
                      }
                    }}
                    className={({ active, checked }) =>
                      clsx(
                        checked
                          ? "bg-sky-100 ring-sky-300 dark:bg-sky-900 dark:ring-sky-700"
                          : "bg-white ring-gray-300 dark:bg-black dark:ring-gray-700",
                        "ring-1 relative flex cursor-pointer rounded-lg py-1 px-2 shadow-sm focus:outline-none"
                      )
                    }
                  >
                    {({ active, checked }) => (
                      <>
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-sm flex space-x-2 items-center">
                              <div
                                className={clsx(
                                  "rounded-full border border-gray-300 dark:border-gray-700 h-4 w-4 mr-2 flex items-center"
                                )}
                              >
                                {checked && (
                                  <CheckCircleIcon className="h-5 w-5 text-sky-500" />
                                )}
                              </div>
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProviderKey(key);
                              setDeleteProviderOpen(true);
                            }}
                            type="button"
                          >
                            <TrashIcon className="h-6 w-6 text-red-500 hover:bg-red-100 p-1 rounded-md" />
                          </button>
                        </div>
                      </>
                    )}
                  </RadioGroup.Option>
                ))}
              </div>
            </RadioGroup>
          )}
          <HcButton
            variant={"secondary"}
            size={"xs"}
            title={"Add new key"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsProviderOpen(true);
            }}
            icon={PlusIcon}
          />
        </div>
      </div>
      <CreateProviderKeyModal
        open={isProviderOpen}
        variant={variant}
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
