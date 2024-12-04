import {
  FolderIcon,
  PencilIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../../../../ui/button";
import { Dices } from "lucide-react";

interface AddRowPopoverProps {
  setPopoverOpen: (open: boolean) => void;
  setShowAddManualRow: () => void;
  setShowExperimentInputSelector: (open: boolean) => void;
  setShowRandomInputSelector: (open: boolean) => void;
}

export const AddRowPopover: React.FC<AddRowPopoverProps> = ({
  setPopoverOpen,
  setShowAddManualRow,
  setShowExperimentInputSelector,
  setShowRandomInputSelector,
}) => {
  return (
    <div>
      <Button
        onClick={() => {
          setPopoverOpen(false);
          setShowAddManualRow();
        }}
        className="h-8 w-full flex items-center justify-start"
        variant="ghost"
      >
        <PencilIcon className="inline h-4 w-4 mr-2" />
        Manual input
      </Button>
      <Button
        onClick={() => {
          setPopoverOpen(false);
          setShowExperimentInputSelector(true);
        }}
        className="h-8 w-full flex items-center justify-start"
        variant="ghost"
      >
        <TableCellsIcon className="inline h-4 w-4 mr-2" />
        Select an input set
      </Button>
      <Button
        onClick={() => {
          setPopoverOpen(false);
          setShowRandomInputSelector(true);
        }}
        className="h-8 w-full flex items-center justify-start"
        variant="ghost"
      >
        <Dices className="inline h-4 w-4 mr-2" />
        Random prod
      </Button>
      <Button
        className="w-full h-8 flex items-center justify-start"
        variant="ghost"
      >
        <FolderIcon className="inline h-4 w-4 mr-2" />
        Select a dataset
      </Button>
    </div>
  );
};
