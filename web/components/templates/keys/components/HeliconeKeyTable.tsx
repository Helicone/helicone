import { KeyIcon } from "@heroicons/react/24/outline";

import LoadingAnimation from "@/components/shared/loadingAnimation";
import ThemedTable from "../../../shared/themed/themedTable";
import { useKeys } from "../useKeys";
import "@/styles/settings-tables.css";

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
        className="relative m-4 block w-full border-2 border-dashed border-border bg-muted p-8 text-center hover:cursor-pointer hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <div className="w-full items-center justify-center align-middle">
          <KeyIcon className="mx-auto h-8 w-8 text-muted-foreground" />
        </div>
        <span className="mt-2 block text-xs font-medium">
          Click here to generate a Helicone key
        </span>
      </button>
    );
  }

  return (
    <div className="border-t border-border settings-table">
      <ThemedTable
        columns={[
          { name: "Name", key: "key_name", hidden: false },
          { name: "Created", key: "created_at", hidden: false },
          { name: "Permissions", key: "permissions", hidden: false },
        ]}
        rows={keys?.data?.data?.data?.map((key) => ({
          ...key,
          id: key.id.toString(),
          key_name: <p className="text-xs font-semibold">{key.api_key_name}</p>,
          created_at: (
            <p className="text-xs text-muted-foreground">
              {new Date(key.created_at).toLocaleString()}
            </p>
          ),
          permissions: (
            <p className="text-xs text-muted-foreground">
              {keyPermissions.get(key.key_permissions ?? "rw") ?? "Read/Write"}
            </p>
          ),
        }))}
        editHandler={(key) => onEdit(key.id)}
        deleteHandler={(key) => onDelete(key.id)}
      />
    </div>
  );
};

export default HeliconeKeyTable;
