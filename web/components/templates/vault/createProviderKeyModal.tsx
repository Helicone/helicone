import { FormEvent, useState } from "react";
import ThemedModal from "../../shared/themed/themedModal";
import useNotification from "../../shared/notification/useNotification";
import { Result } from "../../../lib/result";
import { DecryptedProviderKey } from "../../../services/lib/keys";
import { clsx } from "../../shared/clsx";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface CreateProviderKeyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateProviderKeyModal = (props: CreateProviderKeyModalProps) => {
  const { open, setOpen, onSuccess } = props;

  const { setNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const keyName = event.currentTarget.elements.namedItem(
      "key-name"
    ) as HTMLInputElement;
    const providerKey = event.currentTarget.elements.namedItem(
      "provider-key"
    ) as HTMLInputElement;

    if (!keyName || keyName.value === "") {
      setNotification("Please enter in a key name", "error");
      return;
    }
    if (!providerKey || providerKey.value === "") {
      setNotification("Please enter in a provider key", "error");
      return;
    }

    fetch("/api/provider_keys/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        providerKey: providerKey.value,
        providerName: "openai",
        providerKeyName: keyName.value,
      }),
    })
      .then(
        (res) => res.json() as Promise<Result<DecryptedProviderKey, string>>
      )
      .then(({ data }) => {
        if (data !== null) {
          setNotification("Successfully created provider key", "success");
          setOpen(false);
          onSuccess();
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <form
        action="#"
        method="POST"
        onSubmit={handleSubmitHandler}
        className="flex flex-col space-y-8 w-[400px] text-gray-900 dark:text-gray-100"
      >
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Create Provider Key
        </h1>
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="api-key">Provider</label>
          <select
            disabled
            className="block w-full rounded-md border border-gray-500 bg-gray-100 dark:bg-gray-900 shadow-sm p-2 text-sm"
          >
            <option value="openai">OpenAI</option>
          </select>
        </div>
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="key-name">Key Name</label>
          <input
            type="text"
            name="key-name"
            id="key-name"
            className={clsx(
              "block w-full rounded-md border border-gray-500 bg-gray-100 dark:bg-gray-900 shadow-sm p-2 text-sm"
            )}
            required
            placeholder="Provider Key Name"
          />
        </div>
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="provider-key">Provider Key</label>
          <input
            type="text"
            name="provider-key"
            id="provider-key"
            className={clsx(
              "block w-full rounded-md border border-gray-500 bg-gray-100 dark:bg-gray-900 shadow-sm p-2 text-sm"
            )}
            required
            placeholder="sk-"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            type="button"
            className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isLoading && (
              <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
            )}
            Create Provider Key
          </button>
        </div>
      </form>
    </ThemedModal>
  );
};

export default CreateProviderKeyModal;
