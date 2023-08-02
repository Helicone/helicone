import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import generateApiKey from "generate-api-key";
import { FormEvent, useEffect, useState } from "react";
import { Result } from "../../../lib/result";
import {
  DecryptedProviderKey,
  DecryptedProviderKeyMapping,
} from "../../../services/lib/keys";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";

interface CreateProxyKeyButtonProps {
  onSuccess: () => void;
  providerKeys: DecryptedProviderKey[];
}

const CreateProxyKeyButton = (props: CreateProxyKeyButtonProps) => {
  const { onSuccess, providerKeys } = props;
  const [open, setOpen] = useState(false);
  const [returnedKey, setReturnedKey] =
    useState<DecryptedProviderKeyMapping | null>(null);
  const { setNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  // returned key should be set to null when the modal is closed
  useEffect(() => {
    if (!open) {
      setReturnedKey(null);
    }
  }, [open]);

  const handleSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const proxyKeyName = event.currentTarget.elements.namedItem(
      "proxy-key-name"
    ) as HTMLInputElement;
    const providerKeyName = event.currentTarget.elements.namedItem(
      "provider-key-name"
    ) as HTMLInputElement;

    if (!proxyKeyName || proxyKeyName.value === "") {
      setNotification("Please enter in a key name", "error");
      return;
    }
    if (!providerKeyName || providerKeyName.value === "") {
      setNotification("Please enter in a provider key", "error");
      return;
    }

    fetch("/api/proxy_keys/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        heliconeProxyKeyName: proxyKeyName.value,
        providerKeyId: providerKeyName.value,
      }),
    })
      .then(
        (res) =>
          res.json() as Promise<Result<DecryptedProviderKeyMapping, string>>
      )
      .then(({ data }) => {
        if (data) {
          setNotification("Proxy Key Created", "success");
          setReturnedKey(data);
          onSuccess();
        }
      })
      .catch(() => {
        setNotification("Error Creating Proxy Key", "error");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
        }}
        className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        Create Proxy Key
      </button>
      <ThemedModal open={open} setOpen={setOpen}>
        {returnedKey === null ? (
          <form
            action="#"
            method="POST"
            onSubmit={handleSubmitHandler}
            className="flex flex-col space-y-8 w-[400px]"
          >
            <h1 className="text-lg font-semibold text-gray-900">
              Create Proxy Key
            </h1>
            <div className="w-full space-y-1.5 text-sm">
              <label htmlFor="proxy-key-name">Proxy Key Name</label>
              <input
                type="text"
                name="proxy-key-name"
                id="proxy-key-name"
                className={clsx(
                  "block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                )}
                required
                placeholder="Proxy Key Name"
              />
            </div>
            <div className="w-full space-y-1.5 text-sm">
              <label htmlFor="provider-key-name">Provider Key Name</label>
              <select
                id="provider-key-name"
                name="provider-key-name"
                className="block w-full rounded-md border border-gray-300  shadow-sm p-2 text-sm"
                required
              >
                {providerKeys.map((key) => (
                  <option key={key.id} value={key.id!}>
                    {key.provider_key_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                type="button"
                className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {isLoading && (
                  <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
                )}
                Create Proxy Key
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col space-y-4 w-[400px]">
            <h1 className="text-lg font-semibold text-gray-900">
              Your Proxy Key
            </h1>
            <p className="text-sm text-gray-500">
              Please copy this key and store it somewhere safe. You will not be
              able to see it again.
            </p>
            <div className="w-full space-y-1.5 text-sm">
              <div className="flex flex-row items-center w-full gap-4">
                <input
                  type="text"
                  name="proxy-key-name"
                  id="proxy-key-name"
                  disabled
                  className={clsx(
                    "block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                  )}
                  value={returnedKey.helicone_proxy_key}
                />
                <button
                  className="items-center rounded-md bg-black p-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      returnedKey.helicone_proxy_key
                    );
                    setNotification("Copied to clipboard!", "success");
                  }}
                >
                  <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setOpen(false)}
                type="button"
                className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </ThemedModal>
    </>
  );
};

export default CreateProxyKeyButton;
