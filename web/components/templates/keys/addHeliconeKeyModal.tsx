import {
  ClipboardDocumentListIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useState } from "react";
import { middleTruncString, truncString } from "../../../lib/stringHelpers";
import { hashAuth } from "../../../lib/supabaseClient";
import { useAddKey } from "../../../services/hooks/keys";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";

interface AddHeliconeKeyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  apiKey: string;
}

const AddHeliconeKeyModal = (props: AddHeliconeKeyModalProps) => {
  const { open, setOpen, apiKey } = props;
  const { setNotification } = useNotification();

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col gap-4 space-y-2 w-full max-w-6xl">
        <h3 className="text-lg font-medium leading-6 text-gray-700 ">
          <div className="flex flex-col gap-3">
            Your shiny new API Key:{" "}
            <div className="max-w-md text-sm">
              This will be the <b>only</b> time you can see your API key. If you
              lose your API key you will need to generate a new one.
            </div>
            <div className="flex flex-row items-center gap-3">
              <input
                className="border border-gray-300 rounded-md p-2 w-full"
                value={apiKey}
                disabled={true}
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  setNotification("Copied to clipboard!", "success");
                }}
              />
              <button
                className="bg-green-500 h-10 w-10 items-center flex flex-col justify-center rounded-md"
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  setNotification("Copied to clipboard!", "success");
                }}
              >
                <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex flex-row justify-end mt-5">
              <button
                className="bg-gray-400 text-white text-sm py-3 px-3 items-center flex flex-col justify-center rounded-md"
                onClick={() => {
                  setOpen(false);
                }}
              >
                close
              </button>
            </div>
          </div>
        </h3>
      </div>
    </ThemedModal>
  );
};

export default AddHeliconeKeyModal;
