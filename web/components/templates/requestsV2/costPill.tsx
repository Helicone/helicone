import { useState } from "react";
import ThemedModal from "../../shared/themed/themedModal";
import Link from "next/link";
import { clsx } from "../../shared/clsx";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

const CostPill = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenModal = (
    event: React.MouseEvent<HTMLSpanElement, MouseEvent>
  ) => {
    event.stopPropagation();
    setIsOpen(true);
  };

  return (
    <>
      <span
        onClick={handleOpenModal}
        className={clsx(
          "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-800",
          "w-max flex items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset cursor-pointer"
        )}
      >
        Cost Unsupported{" "}
        <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4 text-orange-500 inline-block" />
      </span>

      {isOpen && (
        <ThemedModal open={isOpen} setOpen={() => setIsOpen(false)}>
          <div
            className="flex flex-col gap-8 inset-0 bg-opacity-50 w-full sm:w-[450px] max-w-[450px] h-full rounded-3xl"
            onClick={() => setIsOpen(false)}
          >
            <h1 className="col-span-4 font-semibold text-xl text-gray-900 dark:text-gray-100">
              Cost Unsupported
            </h1>

            <p className="text-sm text-gray-900 dark:text-gray-100">
              Currently, we do not support the cost of this model. Please create
              an issue in Github{" "}
              <Link
                target="_blank"
                href="https://github.com/Helicone/helicone"
                className="underline text-blue-500"
              >
                https://github.com/Helicone/helicone
              </Link>{" "}
              or reach out to us at Discord{" "}
              <Link
                target="_blank"
                href="https://discord.gg/zsSTcH2qhG"
                className="underline text-blue-500"
              >
                https://discord.gg/zsSTcH2qhG
              </Link>{" "}
            </p>
            <div className="col-span-4 flex justify-end gap-2 pt-4">
              <button
                type="submit"
                className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Close
              </button>
            </div>
          </div>
        </ThemedModal>
      )}
    </>
  );
};

export default CostPill;
