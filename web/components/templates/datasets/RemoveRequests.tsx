import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";

interface RemoveRequestsModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  requestCount: number;
  onConfirm: () => void;
}

const RemoveRequestsModal: React.FC<RemoveRequestsModalProps> = ({
  open,
  setOpen,
  requestCount,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] px-6 py-8 space-y-4">
        <DialogHeader className="space-y-8">
          <DialogTitle>
            Remove {requestCount} requests from dataset?
          </DialogTitle>
          <DialogDescription>
            You won&apos;t be able to undo this action.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex w-full flex-row justify-between gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Confirm remove
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveRequestsModal;
