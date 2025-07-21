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
      <div className="mt-8 flex max-w-2xl flex-col gap-2 space-y-12">
        <div className="flex flex-col space-y-8 text-sm text-gray-900 dark:text-gray-100">
          <div className="flex flex-row justify-between sm:items-center">
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
              className="whitespace-nowrap rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-gray-100 dark:text-black dark:hover:bg-gray-300"
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
