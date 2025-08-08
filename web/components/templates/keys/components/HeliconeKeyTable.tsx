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
        className="relative block w-full border-2 border-dashed border-muted-foreground/50 bg-muted/30 m-4 p-8 text-center hover:cursor-pointer hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
    <div className="border-t border-border">
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
            <p className="text-xs font-semibold">
              {key.api_key_name}
            </p>
          ),
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
      <style jsx global>{`
        .overflow-auto.rounded-lg.bg-white.ring-1.ring-gray-300 {
          overflow: visible !important;
          border-radius: 0 !important;
          background-color: transparent !important;
          box-shadow: none !important;
          ring: none !important;
        }
        
        .dark .overflow-auto.rounded-lg.bg-white.ring-1.ring-gray-300 {
          background-color: transparent !important;
        }
        
        .min-w-full.divide-y.divide-gray-300 {
          border-collapse: collapse !important;
        }
        
        .min-w-full.divide-y.divide-gray-300 th {
          font-size: 0.75rem !important;
          padding: 0.75rem !important;
          border-bottom: 1px solid hsl(var(--border)) !important;
          background-color: transparent !important;
        }
        
        .min-w-full.divide-y.divide-gray-300 td {
          font-size: 0.75rem !important;
          padding: 0.75rem !important;
          border-bottom: 1px solid hsl(var(--border)) !important;
        }
        
        .min-w-full.divide-y.divide-gray-300 tr:last-child td {
          border-bottom: none !important;
        }
      `}</style>
    </div>
  );
};

export default HeliconeKeyTable;
