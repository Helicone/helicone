import { useState } from "react";
import AddKeyModal from "./components/addKeyModal";
import DeleteKeyModal from "./components/DeleteKeyModal";
import EditKeyModal from "./components/EditKeyModal";
import HeliconeKeyTable from "./components/HeliconeKeyTable";
import { Button } from "@/components/ui/button";

const KeyPage = () => {
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
      <div className="flex w-full max-w-6xl flex-col border border-border bg-background">
        <div className="border-b border-border p-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold">API Keys</h1>
              <p className="text-xs text-muted-foreground mt-1">
                These keys can be used to read and write data to Helicone. Please
                do not share these keys and make sure you store them somewhere
                secure.
              </p>
            </div>
            <Button
              onClick={() => setAddKeyOpen(true)}
              size="sm"
              className="text-xs"
            >
              Generate New Key
            </Button>
          </div>
        </div>

        <div>
          <HeliconeKeyTable
            onAddKey={() => setAddKeyOpen(true)}
            onEdit={onEditHandler}
            onDelete={onDeleteHeliconeHandler}
          />
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
