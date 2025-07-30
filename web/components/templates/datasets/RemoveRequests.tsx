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
      <DialogContent className="space-y-4 px-6 py-8 sm:max-w-[425px]">
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
              className="bg-red-500 text-white hover:bg-red-600"
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
