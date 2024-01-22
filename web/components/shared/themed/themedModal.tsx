import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { clsx } from "../clsx";
import { useTheme } from "../theme/themeContext";

interface ThemedModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
}

const ThemedModal = (props: ThemedModalProps) => {
  const { open, setOpen, children } = props;

  const themeContext = useTheme();

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className={clsx(themeContext?.theme ?? "light", "relative z-40")}
        onClose={setOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-300 dark:bg-gray-700 bg-opacity-50 dark:bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white dark:bg-black px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 w-fit sm:p-6">
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ThemedModal;
