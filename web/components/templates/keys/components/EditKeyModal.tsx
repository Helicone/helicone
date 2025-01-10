import { useState, useEffect, useMemo } from "react";
import { clsx } from "../../../shared/clsx";
import ThemedModal from "../../../shared/themed/themedModal";
import { useKeys } from "../useKeys";

interface EditKeyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedKey?: string;
}

const EditKeyModal = ({ open, setOpen, selectedKey }: EditKeyModalProps) => {
  const [editName, setEditName] = useState<string>("");

  const { editKey, keys } = useKeys();
  useEffect(() => {
    setEditName(
      keys?.data?.data?.data?.find((key) => key.id.toString() === selectedKey)
        ?.api_key_name ?? ""
    );
  }, [keys?.data?.data?.data, open, selectedKey]);

  const selectKeyData = useMemo(() => {
    return keys?.data?.data?.data?.find(
      (key) => key.id.toString() === selectedKey
    );
  }, [keys?.data?.data?.data, selectedKey]);

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col gap-4 w-[400px]">
        <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
          Edit Helicone Key
        </p>
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="api-key" className="text-gray-500">
            Key Name
          </label>
          <input
            type="text"
            name="api-key"
            id="api-key"
            value={editName}
            className={clsx(
              "block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm p-2 text-sm"
            )}
            placeholder={selectKeyData?.api_key_name}
            onChange={(e) => setEditName(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={() => setOpen(false)}
            className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await editKey.mutateAsync({
                apiKeyId: selectedKey ?? "",
                apiKeyName: editName,
              });
              setOpen(false);
            }}
            className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Update
          </button>
        </div>
      </div>
    </ThemedModal>
  );
};

export default EditKeyModal;
