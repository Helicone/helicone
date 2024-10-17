import { Menu } from "@headlessui/react";
import {
  ListBulletIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Row } from "../../../layout/common";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DatasetButtonProps<T> {
  datasetMode: boolean;
  setDatasetMode: (datasetMode: boolean) => void;
  items: T[];
  onAddToDataset: () => void;
  renderModal?: (isOpen: boolean, onClose: () => void) => React.ReactNode;
  customButtons?: React.ReactNode;
  isDatasetPage?: boolean;
}

export default function DatasetButton<T>(props: DatasetButtonProps<T>) {
  const {
    datasetMode,
    setDatasetMode,
    items,
    onAddToDataset,
    renderModal,
    customButtons,
    isDatasetPage = false,
  } = props;
  const [modalOpen, setModalOpen] = useState(false);

  const renderButton = () => (
    <Button
      variant={datasetMode ? "secondary" : "ghost"}
      onClick={() => setDatasetMode(!datasetMode)}
      className="flex items-center gap-2"
      size="xs"
    >
      {datasetMode ? (
        <XMarkIcon className="h-4 w-4" />
      ) : (
        <ListBulletIcon className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <TooltipProvider>
      <Menu as="div" className="relative inline-block text-left">
        <Row className="gap-2">
          {!datasetMode || items.length === 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{renderButton()}</span>
              </TooltipTrigger>
              <TooltipContent align="center">
                {datasetMode ? "Exit request selector" : "Select requests"}
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              {isDatasetPage ? (
                customButtons
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (renderModal) {
                      setModalOpen(true);
                    } else {
                      onAddToDataset();
                    }
                  }}
                  size="xs"
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Add to dataset</span>
                  {items.length > 0 && (
                    <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {items.length}
                    </span>
                  )}
                </Button>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => setDatasetMode(!datasetMode)}
                    className="flex items-center gap-2"
                    size="xs"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span>Cancel</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="center">
                  Exit request selector
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </Row>
      </Menu>
      {renderModal && renderModal(modalOpen, () => setModalOpen(false))}
    </TooltipProvider>
  );
}
