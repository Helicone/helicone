import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowsPointingOutIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/20/solid";
import {
  ClipboardDocumentListIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useState } from "react";
import { clsx } from "../clsx";
import useNotification from "../notification/useNotification";

interface ThemedDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

const ThemedDrawer = (props: ThemedDrawerProps) => {
  const { open, setOpen, children, title, actions } = props;

  const { setNotification } = useNotification();

  const [expanded, setExpanded] = useState(false);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-100"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-300 bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-200 sm:duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200 sm:duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  className={clsx(
                    expanded ? "max-w-4xl" : "max-w-lg",
                    "pointer-events-auto w-screen"
                  )}
                >
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-2xl">
                    <div className="px-4 sm:px-6 flex flex-row justify-between">
                      <div className="flex flex-row items-center space-x-2 text-gray-500 w-full">
                        <button
                          onClick={() => setOpen(false)}
                          className="hover:bg-gray-200 rounded-md -m-1 p-1"
                        >
                          <ChevronDoubleRightIcon className="h-5 w-5" />
                        </button>
                        <div className="w-full">{actions}</div>
                      </div>
                    </div>
                    <div className="relative my-4 flex-1 px-4 sm:px-6">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ThemedDrawer;
