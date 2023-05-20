/* eslint-disable @next/next/no-img-element */
import Image from "next/image";

import { Fragment, useEffect, useState } from "react";
import { Dialog, Disclosure, Menu, Transition } from "@headlessui/react";
import {
  ArrowTopRightOnSquareIcon,
  Bars3BottomLeftIcon,
  BeakerIcon,
  CogIcon,
  CubeTransparentIcon,
  HomeIcon,
  InboxArrowDownIcon,
  KeyIcon,
  UserCircleIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  TableCellsIcon,
  BuildingOfficeIcon,
  ExclamationCircleIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { User, useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { DEMO_EMAIL } from "../../../lib/constants";
import { useGetKeys } from "../../../services/hooks/keys";
import ThemedModal from "../themed/themedModal";
import { useQuery } from "@tanstack/react-query";
import { Database } from "../../../supabase/database.types";
import { Result } from "../../../lib/result";
import ThemedDropdown from "../themed/themedDropdown";
import { SpeedDialIcon } from "@mui/material";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useGetOrgs } from "../../../services/hooks/organizations";
import OrgContext, { useOrg } from "./organizationContext";
import { BsCashCoin, BsCashStack } from "react-icons/bs";

interface AuthLayoutProps {
  children: React.ReactNode;
  user: User;
  hideSidebar?: boolean;
}

const AuthLayout = (props: AuthLayoutProps) => {
  const { children, user, hideSidebar } = props;
  const router = useRouter();
  const supabaseClient = useSupabaseClient<Database>();
  const { pathname } = router;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const org = useOrg();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      current: pathname.includes("/dashboard"),
    },
    {
      name: "Requests",
      href: "/requests",
      icon: TableCellsIcon,
      current: pathname.includes("/requests"),
    },
    {
      name: "Cache",
      href: "/cache",
      icon: CircleStackIcon,
      current: pathname.includes("/cache"),
    },
    {
      name: "Users",
      href: "/users",
      icon: UsersIcon,
      current: pathname.includes("/users"),
    },
    {
      name: "Models",
      href: "/models",
      icon: CubeTransparentIcon,
      current: pathname.includes("/models"),
    },
  ];

  const accountNav = [
    {
      name: "Usage",
      href: "/usage",
      icon: BeakerIcon,
      current: pathname.includes("/usage"),
    },
    {
      name: "Organizations",
      href: "/organizations",
      icon: BuildingOfficeIcon,
      current: pathname.includes("/organizations"),
    },
    {
      name: "Keys",
      href: "/keys",
      icon: KeyIcon,
      current: pathname.includes("/keys"),
    },
  ];

  const { count, isLoading, keys, refetch } = useGetKeys();
  const { data: hasConverted, isLoading: hasConvertedLoading } = useQuery({
    queryKey: ["HasConvertedToHeliconeKeys"],
    queryFn: async (query) => {
      const hasConverted: Result<boolean, string> = await fetch(
        "/api/has_converted"
      ).then((res) => res.json());
      return hasConverted?.data === true;
    },
    refetchOnWindowFocus: false,
  });

  const { data: hasUnMigratedRequest } = useQuery({
    queryKey: ["hasUnMigratedRequest"],
    queryFn: async (query) => {
      const hasConverted: Result<boolean, string> = await fetch(
        "/api/has_unmigrated_requests"
      ).then((res) => res.json());
      return hasConverted?.data === true;
    },
    refetchOnWindowFocus: false,
  });
  const [displayMigrationModal, setDisplayMigrationModal] = useState(true);

  return (
    <>
      <div>
        {!hideSidebar && (
          <>
            <Transition.Root show={sidebarOpen} as={Fragment}>
              <Dialog
                as="div"
                className="relative z-40 md:hidden"
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

                <div className="fixed inset-0 z-40 flex">
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
                        <nav className="space-y-1 px-2">
                          {navigation.map((item) => {
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                  item.current
                                    ? "bg-gray-200 text-black"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                  "group flex items-center px-2 py-2 text-md font-medium rounded-md"
                                )}
                              >
                                <item.icon
                                  className={clsx(
                                    item.current
                                      ? "text-black"
                                      : "text-gray-600 group-hover:text-gray-900",
                                    "mr-3 flex-shrink-0 h-5 w-5"
                                  )}
                                />
                                {item.name}
                              </Link>
                            );
                          })}
                          <p className="ml-1 mb-1 text-xs font-sans font-medium tracking-wider pt-8 text-gray-700">
                            Account
                          </p>
                          {accountNav.map((item) => {
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                  item.current
                                    ? "bg-gray-200 text-black"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                  "group flex items-center px-2 py-2 text-md font-medium rounded-md"
                                )}
                              >
                                <item.icon
                                  className={clsx(
                                    item.current
                                      ? "text-black"
                                      : "text-gray-600 group-hover:text-gray-900",
                                    "mr-3 flex-shrink-0 h-5 w-5"
                                  )}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            );
                          })}
                        </nav>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                  <div className="w-14 flex-shrink-0" aria-hidden="true">
                    {/* Dummy element to force sidebar to shrink to fit close icon */}
                  </div>
                </div>
              </Dialog>
            </Transition.Root>

            {/* Static sidebar for desktop */}
            <div className="hidden md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col">
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-4">
                <div className="flex flex-shrink-0 items-center px-4">
                  <button
                    onClick={() => {
                      supabaseClient.auth.getUser().then((user) => {
                        if (user.data.user?.email === DEMO_EMAIL) {
                          supabaseClient.auth.signOut().then(() => {
                            router.push("/");
                          });
                        } else {
                          router.push("/dashboard");
                        }
                      });
                    }}
                  >
                    <Image
                      className="block rounded-md"
                      src="/assets/landing/helicone.webp"
                      width={150}
                      height={150 / (1876 / 528)}
                      alt="Helicone-full-logo"
                    />
                  </button>
                </div>
                <div className="mt-5 flex flex-grow flex-col">
                  <nav className="flex-1 space-y-1 px-2 pb-4 pt-2">
                    {navigation.map((item) => {
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={clsx(
                            item.current
                              ? "bg-gray-200 text-black"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                            "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                          )}
                        >
                          <item.icon
                            className={clsx(
                              item.current
                                ? "text-black"
                                : "text-gray-600 group-hover:text-gray-900",
                              "mr-3 flex-shrink-0 h-5 w-5"
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      );
                    })}
                    <p className="ml-1 mb-1 text-xs font-sans font-medium tracking-wider pt-8 text-gray-700">
                      Account
                    </p>
                    {accountNav.map((item) => {
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={clsx(
                            item.current
                              ? "bg-gray-200 text-black"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                            "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                          )}
                        >
                          <item.icon
                            className={clsx(
                              item.current
                                ? "text-black"
                                : "text-gray-600 group-hover:text-gray-900",
                              "mr-3 flex-shrink-0 h-5 w-5"
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
        <div
          className={clsx("flex flex-1 flex-col", !hideSidebar && "md:pl-60")}
        >
          <div className="sticky top-0 z-20 flex h-16 flex-shrink-0 bg-white border-b border-gray-300">
            <button
              type="button"
              className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex flex-1 justify-end px-4">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="hidden sm:flex text-gray-500">
                  <Link
                    href="https://docs.helicone.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      "flex flex-row px-2 pt-1 text-sm font-medium pb-2 mt-1.5 mr-6"
                    )}
                  >
                    Docs
                  </Link>
                  <Link
                    href="https://discord.gg/zsSTcH2qhG"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      "flex flex-row px-2 pt-1 text-sm font-medium pb-2 mt-1.5 mr-6"
                    )}
                  >
                    Discord
                  </Link>
                  {org && (
                    <ThemedDropdown
                      selectedValue={org.currentOrg.id}
                      options={org.allOrgs.map((org) => ({
                        label: org.name,
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

                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-6">
                  <div>
                    <Menu.Button className="px-2.5 py-0.5 text-lg font-light bg-black text-white rounded-full flex items-center justify-center focus:ring-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2">
                      <span className="sr-only">Open user menu</span>
                      {user?.email?.charAt(0).toUpperCase() || (
                        <UserCircleIcon className="h-8 w-8 text-black" />
                      )}
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item key="user-email">
                        {({ active }) => (
                          <p className="truncate block px-4 py-2 text-sm text-black font-bold border-b border-gray-300">
                            {user?.email}
                          </p>
                        )}
                      </Menu.Item>
                      {accountNav.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <a
                              href={item.href}
                              className={clsx(
                                active ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-600"
                              )}
                            >
                              {item.name}
                            </a>
                          )}
                        </Menu.Item>
                      ))}
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={clsx(
                              active ? "bg-gray-100" : "",
                              "flex w-full px-4 py-2 text-sm text-gray-500 border-t border-gray-300"
                            )}
                            onClick={() => {
                              supabaseClient.auth
                                .signOut()
                                .then(() => router.push("/"));
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

          <main className="flex-1 bg">
            <div className="mx-auto px-4 sm:px-8 bg-gray-100 h-full">
              {/* Replace with your content */}

              {user?.email === DEMO_EMAIL && (
                <div className="pointer-events-none flex sm:justify-center mt-4">
                  <div className="w-full pointer-events-auto flex items-center justify-between gap-x-6 bg-red-500 shadow-md py-2.5 px-6 rounded-xl sm:py-3 sm:pr-3.5 sm:pl-4">
                    <div className="text-sm leading-6 text-white items-center">
                      <strong className="font-semibold">
                        Currently viewing DEMO
                      </strong>
                      <svg
                        viewBox="0 0 2 2"
                        className="mx-2 inline h-0.5 w-0.5 fill-current"
                        aria-hidden="true"
                      >
                        <circle cx={1} cy={1} r={1} />
                      </svg>
                      Data from{" "}
                      <Link
                        href="https://demoapp.valyrai.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        <p className="inline font-semibold">AI App Ideas</p>
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 mb-1 ml-1 inline" />
                      </Link>
                    </div>
                    <button
                      onClick={() =>
                        supabaseClient.auth.signOut().then(() => {
                          router.push("/");
                        })
                      }
                      type="button"
                      className="-m-1.5 flex-none px-3 py-1.5 text-sm bg-white hover:bg-gray-100 text-gray-900 rounded-lg"
                    >
                      Exit Demo
                    </button>
                  </div>
                </div>
              )}
              <OrgContext.Provider value={org}>
                <div className="py-4 sm:py-6" key={org?.renderKey}>
                  {children}
                </div>
              </OrgContext.Provider>
              {/* /End replace */}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AuthLayout;
