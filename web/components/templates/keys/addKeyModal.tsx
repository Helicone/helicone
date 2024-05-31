import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { User } from "@supabase/auth-helpers-react";
import generateApiKey from "generate-api-key";
import { FormEvent, useEffect, useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";
import { OrgContextValue } from "../../layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";

interface AddKeyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: User | null;
  org: OrgContextValue | null;
  onSuccess: () => void;
}

const AddKeyModal = (props: AddKeyModalProps) => {
  const { open, setOpen, user, org, onSuccess } = props;

  const [returnedKey, setReturnedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setNotification } = useNotification();

  const handleSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const keyName = event.currentTarget.elements.namedItem(
      "key-name"
    ) as HTMLInputElement;

    const keyPermissions = event.currentTarget.elements.namedItem(
      "key-read"
    ) as HTMLInputElement;

    if (!keyName || keyName.value === "") {
      setNotification("Please enter in a key name", "error");
      return;
    }

    const permission = keyPermissions.checked ? "rw" : "w";
    const apiKeyPrefix = permission === "rw" ? "sk" : "pk";

    const apiKey = `${apiKeyPrefix}-helicone${
      org?.currentOrg?.organization_type === "customer" ? "-cp" : ""
    }-${generateApiKey({
      method: "base32",
      dashes: true,
    }).toString()}`.toLowerCase();
    setReturnedKey(apiKey);

    const jawn = getJawnClient();
    const resp = jawn
      .POST("/v1/key/generateHash", {
        body: {
          apiKey,
          userId: user?.id!,
          keyName: keyName.value,
          permissions: permission,
        },
      })
      .then((res) => {
        if (res.response.ok) {
          setNotification("Successfully created API key", "success");
          setIsLoading(false);
          onSuccess();
        } else {
          setNotification("Failed to create API key", "error");
          setIsLoading(false);
        }
      });
  };

  useEffect(() => {
    if (!open) {
      setReturnedKey(null);
    }
  }, [open]);

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
              onClick={() => setOpen(false)}
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
