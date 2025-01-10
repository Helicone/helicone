import { clsx } from "../../../shared/clsx";
import ThemedModal from "../../../shared/themed/themedModal";
import { useKeys } from "../useKeys";

interface DeleteKeyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedKey?: string;
}

const DeleteKeyModal = ({
  open,
  setOpen,
  selectedKey,
}: DeleteKeyModalProps) => {
  const { deleteKey } = useKeys();

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col gap-4 w-full">
        <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
          Delete Helicone Key
        </p>
        <p className="text-gray-500 w-[400px] whitespace-pre-wrap text-sm">
          This Helicone key will be deleted from your account. You will no
          longer be able to use this for your API requests. Are you sure you
          want to delete this key permanently?
        </p>
        <div className="w-full flex justify-end gap-4 mt-4">
          <button
            onClick={() => setOpen(false)}
            className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              deleteKey.mutate(selectedKey ?? "");
              setOpen(false);
            }}
            className={clsx(
              "relative inline-flex items-center rounded-md hover:bg-red-700 bg-red-500 px-4 py-2 text-sm font-medium text-white"
            )}
          >
            Delete
          </button>
        </div>
      </div>
    </ThemedModal>
  );
};

export default DeleteKeyModal;
