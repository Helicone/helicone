import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import {
  XMarkIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";

interface MobileSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  NAVIGATION: {
    name: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    current: boolean;
  }[];
  tier: string;
  setOpen: (open: boolean) => void;
}

const MobileSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  NAVIGATION,
  tier,
  setOpen,
}: MobileSidebarProps) => {
  return (
    <Transition.Root show={sidebarOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-30 md:hidden"
        onClose={setSidebarOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 z-30 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex flex-shrink-0 items-center px-4">
                <Image
                  className="block rounded-md"
                  src="/assets/landing/helicone.webp"
                  width={150}
                  height={150 / (1876 / 528)}
                  alt="Helicone-full-logo"
                />
              </div>
              <div className="mt-5 h-0 flex-1 overflow-y-auto">
                <nav className="p-2 flex flex-col text-sm space-y-1">
                  {NAVIGATION.map((nav) => (
                    <Link
                      key={nav.name}
                      href={nav.href}
                      className={clsx(
                        nav.current ? "bg-gray-200 dark:bg-gray-800" : "",
                        "flex items-center text-black dark:text-white px-2 py-1.5 gap-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md font-medium"
                      )}
                    >
                      <nav.icon className="h-4 w-4" />
                      {nav.name}
                    </Link>
                  ))}
                </nav>
              </div>
              <div>
                <Link
                  className="px-4 py-2 text-xs text-gray-500 flex flex-row space-x-2 hover:text-gray-900 hover:underline hover:cursor-pointer"
                  href={"https://docs.helicone.ai/introduction"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpenIcon className="h-4 w-4" />
                  <p>View Documentation</p>
                </Link>
                <Link
                  className="px-4 py-2 text-xs text-gray-500 dark:hover:text-gray-100 flex flex-row space-x-2 hover:text-gray-900 hover:underline hover:cursor-pointer"
                  href={"https://discord.gg/zsSTcH2qhG"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <QuestionMarkCircleIcon className="h-4 w-4" />
                  <p>Help And Support</p>
                </Link>
              </div>
              {tier === "free" ? (
                <div className="p-4 flex w-full justify-center">
                  <button
                    onClick={() => setOpen(true)}
                    className="bg-gray-100 border border-gray-300 text-black text-sm font-medium w-full rounded-md py-2 px-2.5 flex flex-row justify-between items-center"
                  >
                    <div className="flex flex-row items-center">
                      <CloudArrowUpIcon className="h-5 w-5 mr-1.5" />
                      <p>Free Plan</p>
                    </div>

                    <p className="text-xs font-normal text-sky-600">
                      Learn More
                    </p>
                  </button>
                </div>
              ) : (
                <div className="h-4" />
              )}
            </Dialog.Panel>
          </Transition.Child>
          <div className="w-14 flex-shrink-0" aria-hidden="true">
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default MobileSidebar;
