import { Fragment, useState } from "react";
import { Dialog, Transition, Menu } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database } from "../../../supabase/database.types";
import { useOrg } from "../organizationContext";
import { signOut } from "../../shared/utils/utils";
import { Button } from "@/components/ui/button";
import {
  XMarkIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  CloudArrowUpIcon,
  UserCircleIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import ThemedDropdown from "../../shared/themed/themedDropdown";
import { NavigationItem } from "./DesktopSidebar";

interface MobileNavigationProps {
  NAVIGATION: NavigationItem[];
  setOpen: (open: boolean) => void;
}

const MobileNavigation = ({ NAVIGATION, setOpen }: MobileNavigationProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const supabaseClient = useSupabaseClient<Database>();
  const user = useUser();
  const org = useOrg();
  const tier = org?.currentOrg?.tier;

  return (
    <>
      <div className="sticky top-0 z-20 h-16 flex md:hidden flex-shrink-0 bg-white dark:bg-black border-b border-gray-300 dark:border-gray-700">
        <button
          type="button"
          className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex flex-1 justify-end px-4">
          <div className="ml-4 flex items-center md:ml-6">
            <div className="flex md:hidden">
              {org && (
                <ThemedDropdown
                  selectedValue={org.currentOrg?.id}
                  options={org.allOrgs.map((org) => ({
                    label:
                      org.owner === user?.id ? `${org.name} (Owner)` : org.name,
                    value: org.id,
                  }))}
                  onSelect={(value) => {
                    if (value) {
                      org.setCurrentOrg(value);
                    }
                  }}
                  align="right"
                />
              )}
            </div>

            <Menu as="div" className="relative ml-6">
              <Menu.Button className="px-2.5 py-0.5 text-lg font-light bg-black text-white rounded-full flex items-center justify-center focus:ring-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2">
                <span className="sr-only">Open user menu</span>
                {user?.email?.charAt(0).toUpperCase() || (
                  <UserCircleIcon className="h-8 w-8 text-black" />
                )}
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item key="user-email">
                    {({ active }) => (
                      <p className="truncate block px-4 py-2 text-sm text-black font-bold border-b border-gray-300">
                        {user?.email}
                      </p>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          active ? "bg-gray-100" : "",
                          "flex w-full px-4 py-2 text-sm text-gray-500 border-t border-gray-300"
                        )}
                        onClick={async () => {
                          signOut(supabaseClient).then(() => {
                            router.push("/");
                          });
                        }}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

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
                  <nav className="grid gap-1 px-2">
                    {NAVIGATION.map((link, index) => (
                      <Link
                        key={index}
                        href={link.href}
                        className={clsx(
                          "flex items-center rounded-md px-2 py-1.5 text-sm font-medium",
                          link.current
                            ? "bg-gray-200 text-gray-900"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {link.icon && (
                          <link.icon
                            className={clsx(
                              "mr-3 h-6 w-6",
                              link.current ? "text-gray-500" : "text-gray-400"
                            )}
                          />
                        )}
                        {link.name}
                        {link.featured && (
                          <span className="ml-auto text-xs font-normal text-gray-400">
                            New
                          </span>
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>
                <div className="mt-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      href="https://docs.helicone.ai/introduction"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2"
                    >
                      <BookOpenIcon className="h-4 w-4 mr-2" />
                      View Documentation
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      href="https://discord.gg/zsSTcH2qhG"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2"
                    >
                      <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
                      Help And Support
                    </Link>
                  </Button>
                </div>
                {tier === "free" &&
                  org?.currentOrg?.organization_type !== "customer" && (
                    <div className="p-4">
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => {
                          setOpen(true);
                          setSidebarOpen(false);
                        }}
                      >
                        <div className="flex items-center">
                          <CloudArrowUpIcon className="h-5 w-5 mr-1.5" />
                          <span>Free Plan</span>
                        </div>
                        <span className="text-xs font-normal text-primary">
                          Learn More
                        </span>
                      </Button>
                    </div>
                  )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default MobileNavigation;
