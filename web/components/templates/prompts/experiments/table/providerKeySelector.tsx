import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { RadioGroup } from "@headlessui/react";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import {
  ArrowPathIcon,
  InformationCircleIcon,
  KeyIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { Result } from "@/packages/common/result";
import { DecryptedProviderKey } from "../../../../../services/lib/keys";
import { clsx } from "../../../../shared/clsx";
import useNotification from "../../../../shared/notification/useNotification";
import ThemedModal from "../../../../shared/themed/themedModal";
import { SecretInput } from "../../../../shared/themed/themedTable";
import { Button } from "../../../../ui/button";
import { useVaultPage } from "../../../vault/useVaultPage";

interface ProviderKeySelectorProps {
  variant?: "portal" | "basic";
  setProviderKeyCallback?: (key: string) => void;
  orgId?: string; // the id of the org that we want to change provider keys for
  orgProviderKey?: string;
  showTitle?: boolean;
  setDecryptedKey?: (key: string) => void;
  defaultProviderKey?: string | null;
}

const ProviderKeySelector = (props: ProviderKeySelectorProps) => {
  const {
    setProviderKeyCallback,
    setDecryptedKey,
    orgProviderKey,
    variant = "portal",
    defaultProviderKey,
  } = props;

  const { providerKeys, refetchProviderKeys } = useVaultPage();
  const { setNotification } = useNotification();

  const [providerKey, setProviderKey] = useState(
    defaultProviderKey || orgProviderKey,
  );

  const [isProviderOpen, setIsProviderOpen] = useState(false);

  const [deleteProviderOpen, setDeleteProviderOpen] = useState(false);

  const [selectedProviderKey, setSelectedProviderKey] =
    useState<DecryptedProviderKey>();

  const [isLoading, setIsLoading] = useState(false);

  const changeProviderKeyHandler = useCallback(
    async (newProviderKey: string) => {
      if (setProviderKeyCallback) {
        setProviderKey(newProviderKey);
        setProviderKeyCallback(newProviderKey);
        return;
      }
    },
    [setProviderKeyCallback, setProviderKey],
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
        <div className="mx-auto w-full space-y-4">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-1">
              <Tooltip title="Provider Keys are used to authenticate your requests to the API. This key is securely stored using our vault technologies, with the state of the art encryption.">
                <label
                  htmlFor="alert-metric"
                  className="text-base font-semibold text-gray-900 dark:text-gray-100"
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
              className="dark:border-gay-700 flex h-full w-full flex-col items-center justify-center rounded-md border border-gray-300 p-6"
            >
              <KeyIcon className="h-4 w-4 text-black dark:text-white" />
              <p className="pt-2 text-xs font-semibold text-gray-500">
                Please create a provider key.{" "}
                <Tooltip title="Provider Keys are used to authenticate your requests to the API. This key is securely stored using our vault technologies, with the state of the art encryption.">
                  <span className="cursor-pointer underline">Learn more.</span>
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
                    className={({ active: _active, checked }) =>
                      clsx(
                        checked
                          ? "bg-sky-100 ring-sky-300 dark:bg-sky-900 dark:ring-sky-700"
                          : "bg-white ring-gray-300 dark:bg-black dark:ring-gray-700",
                        "relative flex cursor-pointer rounded-lg px-2 py-1 shadow-sm ring-1 focus:outline-none",
                      )
                    }
                  >
                    {({ active: _active2, checked }) => (
                      <>
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex items-center space-x-2 text-sm">
                              <div
                                className={clsx(
                                  "mr-2 flex h-4 w-4 items-center rounded-full border border-gray-300 dark:border-gray-700",
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
                                className={`inline pl-2 text-xs text-gray-500`}
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
                            <TrashIcon className="h-6 w-6 rounded-md p-1 text-red-500 hover:bg-red-100" />
                          </button>
                        </div>
                      </>
                    )}
                  </RadioGroup.Option>
                ))}
              </div>
            </RadioGroup>
          )}
          <Button
            variant={"secondary"}
            size={"sm"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsProviderOpen(true);
            }}
            className="w-full"
          >
            Add new key
          </Button>

          <div className="mt-4 flex justify-between">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsProviderOpen(true);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={(e) => {
                // e.stopPropagation();
                // e.preventDefault();
                // setIsProviderOpen(true);
              }}
            >
              Save preference
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isProviderOpen} onOpenChange={setIsProviderOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Provider Key</DialogTitle>
          </DialogHeader>
          <div className="flex w-full flex-col space-y-8 text-gray-900 dark:text-gray-100">
            <div className="w-full space-y-1.5 text-sm">
              <label htmlFor="api-key">Provider</label>
              <Select defaultValue="openai" disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">
                    {variant === "portal" ? "Custom" : "OpenAI"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full space-y-1.5 text-sm">
              <label htmlFor="provider-key" className="flex items-center gap-1">
                Provider Key
                <Tooltip
                  title={
                    "This is the secret key that you get from the provider. It is used to authenticate and make requests to the provider's API."
                  }
                >
                  <InformationCircleIcon
                    className={clsx("h-4 w-4 text-gray-500")}
                  />
                </Tooltip>
              </label>
              <div className="text-xs italic text-gray-500">
                This will be placed in the{" "}
                <code className="not-italic">authorization</code> header with
                the <code className="not-italic">Bearer</code> prefix.
              </div>
              <Input
                type="password"
                name="provider-key"
                id="provider-key"
                required
                placeholder="sk-"
              />
            </div>
            <div className="w-full space-y-1.5 text-sm">
              <label htmlFor="key-name">Key Name</label>
              <Input
                name="key-name"
                id="key-name"
                required
                placeholder="Provider Key Name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsProviderOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const providerKeyInput = document.getElementById(
                    "provider-key",
                  ) as HTMLInputElement;
                  const keyNameInput = document.getElementById(
                    "key-name",
                  ) as HTMLInputElement;

                  if (
                    (!keyNameInput || keyNameInput.value === "") &&
                    variant !== "portal"
                  ) {
                    setNotification("Please enter in a key name", "error");
                    return;
                  }
                  if (!providerKeyInput || providerKeyInput.value === "") {
                    setNotification("Please enter in a provider key", "error");
                    return;
                  }

                  setIsLoading(true);
                  fetch("/api/provider_keys/create", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      providerKey: providerKeyInput.value,
                      providerName: variant === "portal" ? "portal" : "openai",
                      providerKeyName: keyNameInput.value,
                    }),
                  })
                    .then(
                      (res) =>
                        res.json() as Promise<
                          Result<DecryptedProviderKey, string>
                        >,
                    )
                    .then(({ data }) => {
                      if (data !== null) {
                        setNotification(
                          "Successfully created provider key",
                          "success",
                        );
                        setIsProviderOpen(false);
                        refetchProviderKeys();
                      } else {
                        setNotification(
                          "Failed to create provider key, you are only allowed 1 provider key",
                          "error",
                        );
                      }
                    })
                    .catch((err) => {
                      setNotification(`Error: ${err}`, "error");
                    })
                    .finally(() => setIsLoading(false));
                }}
                disabled={isLoading}
              >
                {isLoading && (
                  <ArrowPathIcon className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                Create Provider Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ThemedModal open={deleteProviderOpen} setOpen={setDeleteProviderOpen}>
        <div
          className="flex w-full flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Delete Provider Key
          </p>
          <p className="w-[400px] whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            This Provider Key will be deleted from your account. All proxy keys
            that are mapped to this provider key will be deleted as well. Are
            you sure you want to delete this provider key?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteProviderOpen(false);
              }}
              type="button"
              className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (selectedProviderKey?.id) {
                  await deleteProviderKey(selectedProviderKey.id);
                }
              }}
              className="flex items-center rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-black"
            >
              Delete
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default ProviderKeySelector;
