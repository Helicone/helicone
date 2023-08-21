import { FormEvent, useEffect, useState } from "react";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import generateApiKey from "generate-api-key";
import { hashAuth } from "../../../lib/hashClient";
import { User, useSupabaseClient } from "@supabase/auth-helpers-react";
import { OrgContextValue } from "../../shared/layout/organizationContext";
import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

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
  const supabaseClient = useSupabaseClient();

  const handleSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const keyName = event.currentTarget.elements.namedItem(
      "key-name"
    ) as HTMLInputElement;

    if (!keyName || keyName.value === "") {
      setNotification("Please enter in a key name", "error");
      return;
    }

    const apiKey = `sk-helicone-${generateApiKey({
      method: "base32",
      dashes: true,
    }).toString()}`.toLowerCase();
    setReturnedKey(apiKey);
    hashAuth(apiKey).then((res) => {
      supabaseClient
        .from("helicone_api_keys")
        .insert({
          api_key_hash: res,
          user_id: user?.id!,
          api_key_name: keyName.value,
          organization_id: org?.currentOrg?.id!,
        })
        .then(() => {
          setNotification("Successfully created API key", "success");
          setIsLoading(false);
          onSuccess();
        });
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
          <h1 className="text-lg font-semibold text-gray-900">Create Key</h1>
          <div className="w-full space-y-1.5 text-sm">
            <label htmlFor="key-name">Key Name</label>
            <input
              type="text"
              name="key-name"
              id="key-name"
              className="block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
              required
              placeholder="Key Name"
            />
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
              Create Key
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col space-y-4 w-[400px]">
          <h1 className="text-lg font-semibold text-gray-900">
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
                className="block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                value={returnedKey}
              />
              <button
                className="items-center rounded-md bg-black p-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={() => {
                  navigator.clipboard.writeText(returnedKey);
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
  );
};

export default AddKeyModal;
