import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
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
      <div className="flex flex-col space-y-4 w-[400px]">
        <h1 className="text-lg font-semibold text-gray-900">
          Your Helicone Key
        </h1>
        <p className="text-sm text-gray-500">
          This will be the <b>only</b> time you can see your API key. Please
          save it somewhere safe and accessible. If you lose your API key, you
          will need to generate a new one.
        </p>
        <div className="w-full space-y-1.5 text-sm">
          <div className="flex flex-row items-center w-full gap-4">
            <input
              type="text"
              name="proxy-key-name"
              id="proxy-key-name"
              className={clsx(
                "block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
              )}
              value={apiKey}
              disabled={true}
            />
            <button
              className="items-center rounded-md bg-black p-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => {
                navigator.clipboard.writeText(apiKey);
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
    </ThemedModal>
  );
};

export default AddHeliconeKeyModal;
