import { useState } from "react";
import AddKeyModal from "./components/addKeyModal";
import DeleteKeyModal from "./components/DeleteKeyModal";
import EditKeyModal from "./components/EditKeyModal";
import HeliconeKeyTable from "./components/HeliconeKeyTable";

interface KeyPageProps {
  hideTabs?: boolean;
}

const KeyPage = (props: KeyPageProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [deleteHeliconeOpen, setDeleteHeliconeOpen] = useState(false);
  const [selectedHeliconeKey, setSelectedHeliconeKey] = useState<string>();

  const onEditHandler = (keyId: string) => {
    setSelectedHeliconeKey(keyId);
    setEditOpen(true);
  };

  const onDeleteHeliconeHandler = (keyId: string) => {
    setSelectedHeliconeKey(keyId);
    setDeleteHeliconeOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-2 max-w-2xl space-y-12 mt-8">
        <div className="text-gray-900 dark:text-gray-100 space-y-8 text-sm flex flex-col">
          <div className="flex flex-row sm:items-center justify-between">
            <p className="text-md text-gray-900 dark:text-gray-100">
              These keys can be used to read and write data to Helicone. Please
              do not share these keys and make sure you store them somewhere
              secure.
            </p>
          </div>

          <div className="space-y-12 pt-2">
            <HeliconeKeyTable
              onAddKey={() => setAddKeyOpen(true)}
              onEdit={onEditHandler}
              onDelete={onDeleteHeliconeHandler}
            />
          </div>

          <div>
            <button
              onClick={() => setAddKeyOpen(true)}
              className="bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-300 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold text-white dark:text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Generate New Key
            </button>
          </div>
        </div>
      </div>

      <AddKeyModal open={addKeyOpen} setOpen={setAddKeyOpen} />

      <EditKeyModal
        open={editOpen}
        setOpen={setEditOpen}
        selectedKey={selectedHeliconeKey}
      />
      <DeleteKeyModal
        open={deleteHeliconeOpen}
        setOpen={setDeleteHeliconeOpen}
        selectedKey={selectedHeliconeKey}
      />
    </>
  );
};

export default KeyPage;
