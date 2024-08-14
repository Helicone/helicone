import { Menu } from "@headlessui/react";
import { ListBulletIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Row } from "../../../layout/common";
import ThemedModal from "../../../shared/themed/themedModal";
import NewDataset from "../../datasets/NewDataset";
import { NormalizedRequest } from "../builder/abstractRequestBuilder";

interface SortButtonProps<T> {
  datasetMode: boolean;
  setDatasetMode: (datasetMode: boolean) => void;
  requests: NormalizedRequest[];
}

export default function DatasetButton<T>(props: SortButtonProps<T>) {
  const { datasetMode, setDatasetMode, requests } = props;
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <Row>
          {!datasetMode || requests.length === 0 ? (
            <Menu.Button
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
              onClick={() => setDatasetMode(!datasetMode)}
            >
              <ListBulletIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />

              <div className="text-sm font-medium items-center text-gray-900 dark:text-gray-100 hidden sm:flex gap-1">
                {!datasetMode ? "Select Mode" : "Cancel"}
              </div>
            </Menu.Button>
          ) : (
            <Menu.Button
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
              onClick={() => setModalOpen(true)}
            >
              <PlusIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
              <div className="text-sm font-medium items-center text-gray-900 dark:text-gray-100 hidden sm:flex gap-1">
                Add to dataset
              </div>
              <code className="text-xs text-gray-500 dark:text-gray-400">
                ({requests.length})
              </code>
            </Menu.Button>
          )}
        </Row>
      </Menu>
      <ThemedModal open={modalOpen} setOpen={setModalOpen}>
        <NewDataset requests={requests} setModalOpen={setModalOpen} />
      </ThemedModal>
    </>
  );
}
