import { KeyIcon } from "@heroicons/react/24/outline";

import LoadingAnimation from "@/components/shared/loadingAnimation";
import ThemedTable from "../../../shared/themed/themedTable";
import { useKeys } from "../useKeys";

interface HeliconeKeyTableProps {
  onAddKey: () => void;
  onEdit: (keyId: string) => void;
  onDelete: (keyId: string) => void;
}

const keyPermissions = new Map([
  ["r", "Read"],
  ["w", "Write"],
  ["rw", "Read/Write"],
]);

const HeliconeKeyTable = ({
  onAddKey,
  onEdit,
  onDelete,
}: HeliconeKeyTableProps) => {
  const { keys } = useKeys();
  if (keys?.isLoading) {
    return <LoadingAnimation title={"Loading your keys..."} />;
  }

  if ((keys?.data?.data?.data?.length ?? 0) < 1) {
    return (
      <button
        onClick={onAddKey}
        className="relative mt-8 block w-full rounded-lg border-2 border-dashed border-gray-500 bg-gray-200 p-12 text-center hover:cursor-pointer hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <div className="w-full items-center justify-center align-middle">
          <KeyIcon className="mx-auto h-10 w-10 text-gray-900 dark:text-gray-100" />
        </div>
        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
          Click here to generate a Helicone key
        </span>
      </button>
    );
  }

  return (
    <>
      <ThemedTable
        columns={[
          { name: "Name", key: "key_name", hidden: false },
          { name: "Created", key: "created_at", hidden: false },
          { name: "Permissions", key: "permissions", hidden: false },
        ]}
        rows={keys?.data?.data?.data?.map((key) => ({
          ...key,
          id: key.id.toString(),
          key_name: (
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {key.api_key_name}
            </p>
          ),
          created_at: (
            <p className="text-gray-500">
              {new Date(key.created_at).toLocaleString()}
            </p>
          ),
          permissions: (
            <p className="text-gray-500">
              {keyPermissions.get(key.key_permissions ?? "rw") ?? "Read/Write"}
            </p>
          ),
        }))}
        editHandler={(key) => onEdit(key.id)}
        deleteHandler={(key) => onDelete(key.id)}
      />
    </>
  );
};

export default HeliconeKeyTable;
