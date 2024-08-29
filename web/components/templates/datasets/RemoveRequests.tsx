import React from "react";
import { Button } from "../../ui/button";

interface RemoveRequestsModalProps {
  requestCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const RemoveRequestsModal: React.FC<RemoveRequestsModalProps> = ({
  requestCount,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="space-y-6 p-0 w-[350px]">
      <h3 className="text-lg font-medium leading-6 text-gray-900">
        Remove {requestCount} requests from dataset?
      </h3>
      <div className="mt-2">
        <p className="text-sm text-gray-500">
          You won&apos;t be able to undo this action.
        </p>
      </div>

      <div className="mt-4 flex justify-between space-x-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onConfirm}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Confirm remove
        </Button>
      </div>
    </div>
  );
};

export default RemoveRequestsModal;
