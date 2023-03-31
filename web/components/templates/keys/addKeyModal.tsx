import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useState } from "react";
import { hashAuth } from "../../../lib/hashClient";
import { middleTruncString, truncString } from "../../../lib/stringHelpers";

import { useAddKey } from "../../../services/hooks/keys";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";

interface AddKeyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AddKeyModal = (props: AddKeyModalProps) => {
  const { open, setOpen } = props;
  const [apiKey, setApiKey] = useState("");
  const [keyName, setKeyName] = useState("");
  const [step, setStep] = useState<"addKey" | "nameKey">("addKey");
  const [hashedKey, setHashedKey] = useState("");

  const { addKey, error } = useAddKey();
  const user = useUser();
  const { setNotification } = useNotification();

  const renderStep = () => {
    switch (step) {
      case "addKey":
        return (
          <form
            className="flex flex-col w-full gap-4"
            onSubmit={(e) => e.preventDefault}
          >
            <p className="text-gray-700 whitespace-pre-wrap text-sm">
              Your API keys are used to authenticate your requests to the
              OpenAI. We do <span className="font-bold">not</span> store your
              API key on our servers.
            </p>
            <Link
              href="https://docs.helicone.ai/getting-started/how-encryption-works"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex text-sm flex-row w-fit"
            >
              Learn More
            </Link>

            <div className="w-full">
              <label
                htmlFor="openAIKey"
                className="block text-sm font-medium text-black"
              >
                OpenAI Key
              </label>
              <div className="relative mt-1 flex items-center">
                <input
                  type="password"
                  name="openAIKey"
                  id="openAIKey"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    hashAuth(apiKey).then((res) => {
                      setHashedKey(res);
                    });
                  }}
                  placeholder="Enter in your OpenAI API key here"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                />
              </div>
            </div>
            {hashedKey !== "" && (
              <i className="w-full text-xs text-gray-500">
                <p>Only the irreversible hash is stored on our servers.</p>
                <p>Hash:</p>
                <div
                  className="flex flex-row hover:cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(hashedKey);
                    setNotification("Copied to clipboard", "success");
                  }}
                >
                  <div>{middleTruncString(hashedKey, 50)}</div>
                </div>
              </i>
            )}

            <div className="w-full flex flex-row justify-end">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (apiKey === "") {
                    setNotification("Please enter in an API key", "error");
                    return;
                  }
                  hashAuth(apiKey).then((res) => {
                    setHashedKey(res);
                    setStep("nameKey");
                  });
                }}
                type="submit"
                className="rounded-md bg-black px-3.5 py-1.5 text-base font-medium leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Next
              </button>
            </div>
          </form>
        );
      case "nameKey":
        return (
          <form
            className="flex flex-col w-full gap-4"
            onSubmit={(e) => e.preventDefault}
          >
            <p className="text-xs break-words">
              <span className="font-bold">Generated API key hash:</span>{" "}
              {hashedKey}
            </p>
            <div className="w-full">
              <label
                htmlFor="keyName"
                className="block text-sm font-medium text-black"
              >
                Key Name
              </label>
              <div className="relative mt-1 flex items-center">
                <input
                  type="text"
                  name="keyName"
                  id="keyName"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Enter in a name for this key"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="w-full flex flex-row justify-between">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setStep("addKey");
                }}
                type="button"
                className="rounded-md bg-gray-200 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Back
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (keyName === "") {
                    setNotification("Please enter in a key name", "error");
                    return;
                  }
                  addKey({
                    apiKeyHash: hashedKey,
                    keyName: keyName,
                    userId: user?.id || "",
                    apiKeyPreview: middleTruncString(apiKey, 8),
                  });

                  if (error) {
                    setNotification("Error adding key", "error");
                    return;
                  }

                  setNotification("Key successfully added", "success");
                  setOpen(false);
                }}
                type="submit"
                className="rounded-md bg-black px-3.5 py-1.5 text-base font-medium leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Add Hashed Key
              </button>
            </div>
          </form>
        );
      default:
        return <p>Something went wrong, please refresh the page</p>;
    }
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col gap-4 space-y-2 w-full max-w-[400px]">
        <p className="font-bold text-lg">Add API Key</p>

        {renderStep()}
      </div>
    </ThemedModal>
  );
};

export default AddKeyModal;
