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
      <div className="flex w-full flex-col gap-4">
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Delete Helicone Key
        </p>
        <p className="w-[400px] whitespace-pre-wrap text-sm text-gray-500">
          This Helicone key will be deleted from your account. You will no
          longer be able to use this for your API requests. Are you sure you
          want to delete this key permanently?
        </p>
        <div className="mt-4 flex w-full justify-end gap-4">
          <button
            onClick={() => setOpen(false)}
            className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              deleteKey.mutate(selectedKey ?? "");
              setOpen(false);
            }}
            className={clsx(
              "relative inline-flex items-center rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-700",
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
