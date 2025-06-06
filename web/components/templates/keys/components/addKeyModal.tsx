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
      "key-name"
    ) as HTMLInputElement;

    const keyPermissions = event.currentTarget.elements.namedItem(
      "key-read"
    ) as HTMLInputElement;

    const rateLimit = event.currentTarget.elements.namedItem(
      "rate-limit"
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
          className="flex flex-col space-y-8 w-[400px]"
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
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm p-2 text-sm"
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
              <div className="flex items-center h-5">
                <input
                  id="rate-limit"
                  name="rate-limit"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                        <InfoIcon className="h-4 w-4 text-gray-500 cursor-help" />
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
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
              className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {addKey.isPending && (
                <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
              )}
              Create Key
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col space-y-4 w-[400px]">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Your Helicone Key
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
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm p-2 text-sm"
                value={returnedKey}
              />
              <button
                className="items-center rounded-md bg-black dark:bg-white p-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
              className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
