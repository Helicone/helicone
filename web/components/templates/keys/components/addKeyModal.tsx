import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { FormEvent, useState } from "react";
import useNotification from "../../../shared/notification/useNotification";
import ThemedModal from "../../../shared/themed/themedModal";
import { useKeys } from "../useKeys";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface AddKeyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AddKeyModal = (props: AddKeyModalProps) => {
  const { open, setOpen } = props;

  const [returnedKey, setReturnedKey] = useState<string | null>(null);

  const { setNotification } = useNotification();

  const { addKey } = useKeys();
  const handleSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const keyName = event.currentTarget.elements.namedItem(
      "key-name",
    ) as HTMLInputElement;

    const keyPermissions = event.currentTarget.elements.namedItem(
      "key-read",
    ) as HTMLInputElement;

    const rateLimit = event.currentTarget.elements.namedItem(
      "rate-limit",
    ) as HTMLInputElement;

    if (!keyName || keyName.value === "") {
      setNotification("Please enter in a key name", "error");
      return;
    }

    const permission = keyPermissions.checked ? "rw" : "w";
    const enableRateLimit = rateLimit.checked;

    const { res, apiKey } = await addKey.mutateAsync({
      permission,
      keyName: keyName.value,
      isEu: window.location.hostname.includes("eu."),
      enableRateLimit,
    });
    if (res.response.ok) {
      setReturnedKey(apiKey);
    }
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      {returnedKey === null ? (
        <form
          action="#"
          method="POST"
          onSubmit={handleSubmitHandler}
          className="flex w-[400px] flex-col space-y-8"
        >
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Create Key
          </h1>
          <div className="w-full space-y-1.5 text-sm">
            <label htmlFor="key-name" className="text-gray-500">
              Key Name
            </label>
            <input
              type="text"
              name="key-name"
              id="key-name"
              className="block w-full rounded-md border border-gray-300 bg-gray-100 p-2 text-sm text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              required
              placeholder="Key Name"
            />
          </div>
          <div className="w-full space-y-1.5 text-sm">
            <label htmlFor="key-permissions" className="text-gray-500">
              Permissions
            </label>

            <ul className="flex items-center gap-4 text-sm font-semibold">
              <li>
                <label>
                  <input
                    type="checkbox"
                    name="key-read"
                    id="key-read"
                    value="r"
                    className="mr-1 rounded-sm"
                    defaultChecked={true}
                  />
                  Read
                </label>
              </li>
              <li>
                <label>
                  <input
                    type="checkbox"
                    name="key-write"
                    id="key-write"
                    value="w"
                    className="mr-1 rounded-sm"
                    disabled
                    defaultChecked={true}
                    style={{
                      // dark gray
                      backgroundColor: "gray",
                    }}
                  />
                  Write
                </label>
              </li>
            </ul>
          </div>

          <div className="w-full space-y-1.5 text-sm">
            <label htmlFor="rate-limit" className="text-gray-500">
              Rate Limiting
            </label>
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="rate-limit"
                  name="rate-limit"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <div className="flex items-center gap-1">
                  <label
                    htmlFor="rate-limit"
                    className="font-medium text-gray-700 dark:text-gray-300"
                  >
                    Enable UI rate limits
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 cursor-help text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          This will prefix the key with &quot;rl-&quot; and
                          apply rate limits configured in the dashboard.{" "}
                          <a
                            href="/docs/rate-limiting"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View documentation
                          </a>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  May affect request latency.{" "}
                  <a
                    href="/docs/rate-limiting#performance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Learn more
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              type="button"
              className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {addKey.isPending && (
                <ArrowPathIcon className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Create Key
            </button>
          </div>
        </form>
      ) : (
        <div className="flex w-[400px] flex-col space-y-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Your Helicone Key
          </h1>
          <p className="text-sm text-gray-500">
            Please copy this key and store it somewhere safe. You will not be
            able to see it again.
          </p>
          <div className="w-full space-y-1.5 text-sm">
            <div className="flex w-full flex-row items-center gap-4">
              <input
                type="text"
                name="proxy-key-name"
                id="proxy-key-name"
                disabled
                className="block w-full rounded-md border border-gray-300 bg-gray-100 p-2 text-sm text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={returnedKey}
              />
              <button
                className="flex items-center rounded-md bg-black p-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                onClick={() => {
                  navigator.clipboard.writeText(returnedKey);
                  setNotification("Copied to clipboard!", "success");
                }}
              >
                <ClipboardDocumentListIcon className="h-5 w-5 text-white dark:text-black" />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setOpen(false);
                setReturnedKey(null);
              }}
              type="button"
              className="flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </ThemedModal>
  );
};

export default AddKeyModal;
