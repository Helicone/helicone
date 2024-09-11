import { Menu, Transition } from "@headlessui/react";
import {
  BookOpenIcon,
  CloudArrowUpIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { Fragment } from "react";
import { clsx } from "../../shared/clsx";
import { useOrg } from "../organizationContext";
import OrgDropdown from "../orgDropdown";

interface SidebarProps {
  NAVIGATION: {
    name: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    current: boolean;
    featured?: boolean;
  }[];
  setReferOpen: (open: boolean) => void;
  setOpen: (open: boolean) => void;
}

const DesktopSidebar = ({
  NAVIGATION,
  setReferOpen,
  setOpen,
}: SidebarProps) => {
  const user = useUser();
  const org = useOrg();
  const tier = org?.currentOrg?.tier;

  return (
    <div className="hidden fixed md:inset-y-0 md:flex md:w-56 md:flex-col z-30 bg-white dark:bg-black">
      <div className="w-full flex flex-grow flex-col overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <div className="p-2 flex items-center gap-4 h-14 border-b border-gray-300 dark:border-gray-700 absolute w-full  dark:bg-black">
          <OrgDropdown />
          <Menu as="div" className="relative">
            {/* User menu button */}
            <Menu.Button className="px-[7px] py-0.5 mr-2 text-sm bg-gray-900 dark:bg-gray-500 dark:text-gray-900 text-gray-50 rounded-full flex items-center justify-center focus:ring-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2">
              <span className="sr-only">Open user menu</span>
              {user?.email?.charAt(0).toUpperCase() || (
                <UserCircleIcon className="h-8 w-8 text-black dark:text-white" />
              )}
            </Menu.Button>
            {/* User menu dropdown */}
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute -left-2 mt-2 w-[12.5rem] z-40 origin-top-left divide-y divide-gray-200 dark:divide-gray-800 rounded-md bg-white dark:bg-black border border-gray-300 dark:border-gray-700 shadow-2xl">
                {/* User menu content */}
                {/* ... (keep the existing menu items) */}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        <div
          className={clsx(
            org?.currentOrg?.organization_type === "reseller" ||
              org?.isResellerOfCurrentCustomerOrg
              ? "mt-16"
              : "mt-14",
            "flex flex-grow flex-col"
          )}
        >
          {/* Reseller button */}
          {/* ... (keep the existing reseller button code) */}

          {/* Navigation */}
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
                {nav.featured && (
                  <span className="-mt-1.5 -ml-0.5 h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer links */}
        <div>
          <Link
            className="px-4 py-2 text-xs text-gray-500 dark:hover:text-gray-100 flex flex-row space-x-2 hover:text-gray-900 hover:underline hover:cursor-pointer"
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

        {/* Free plan button */}
        {tier === "free" &&
        org?.currentOrg?.organization_type !== "customer" ? (
          <div className="p-4 flex w-full justify-center">
            <button
              onClick={() => setOpen(true)}
              className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 dark:text-white text-black text-sm font-medium w-full rounded-md py-2 px-2.5 flex flex-row justify-between items-center"
            >
              <div className="flex flex-row items-center">
                <CloudArrowUpIcon className="h-5 w-5 mr-1.5" />
                <p>Free Plan</p>
              </div>

              <p className="text-xs font-normal text-sky-600">Learn More</p>
            </button>
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </div>
  );
};

export default DesktopSidebar;
