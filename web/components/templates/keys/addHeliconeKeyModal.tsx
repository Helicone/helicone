import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
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
        <h3 className="text-lg leading-6 text-gray-700 ">
          <div className="flex flex-col space-y-4">
            <p className="font-semibold">Your top-secret API Key:</p>
            <div className="max-w-md text-sm">
              This will be the <b>only</b> time you can see your API key. Please
              save it somewhere safe and accessible. If you lose your API key,
              you will need to generate a new one.
            </div>
            <div className="flex flex-row items-center gap-3 text-sm">
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
                className="bg-sky-500 hover:bg-sky-400 text-white p-2 gap-2 items-center flex flex-row justify-center rounded-md"
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  setNotification("Copied to clipboard!", "success");
                }}
              >
                <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex flex-row justify-end pt-4">
              <button
                className="whitespace-nowrap rounded-md bg-sky-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </h3>
      </div>
    </ThemedModal>
  );
};

export default AddHeliconeKeyModal;
