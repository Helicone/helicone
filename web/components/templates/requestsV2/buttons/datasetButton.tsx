import { Menu } from "@headlessui/react";
import {
  ListBulletIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Row } from "../../../layout/common";
import { useUser } from "@supabase/auth-helpers-react";
import GenericButton from "../../../layout/common/button";

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
  const user = useUser();

  if (!user?.email?.includes("@helicone.ai")) return null;

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <Row className="gap-2">
          {!datasetMode || items.length === 0 ? (
            <GenericButton
              onClick={() => setDatasetMode(!datasetMode)}
              icon={
                datasetMode ? (
                  <XMarkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ListBulletIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                )
              }
              text={!datasetMode ? "Select Mode" : "Cancel"}
            />
          ) : (
            <>
              {isDatasetPage ? (
                customButtons
              ) : (
                <GenericButton
                  onClick={() => {
                    if (renderModal) {
                      setModalOpen(true);
                    } else {
                      onAddToDataset();
                    }
                  }}
                  icon={
                    <PlusIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                  }
                  text="Add to dataset"
                  count={items.length}
                />
              )}
              <GenericButton
                onClick={() => setDatasetMode(!datasetMode)}
                icon={
                  <XMarkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                }
                text={"Cancel"}
              />
            </>
          )}
        </Row>
      </Menu>
      {renderModal && renderModal(modalOpen, () => setModalOpen(false))}
    </>
  );
}
