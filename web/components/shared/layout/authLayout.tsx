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
} from "@heroicons/react/24/outline";
import {
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
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
                            if (
                              item.name === "Keys" &&
                              !isLoading &&
                              count < 1
                            ) {
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className={clsx(
                                    item.current
                                      ? "bg-gray-200 text-black"
                                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                    "group flex items-center px-2 py-2 text-md font-medium rounded-md w-full justify-between"
                                  )}
                                >
                                  <div className="flex flex-row items-center">
                                    <item.icon
                                      className={clsx(
                                        item.current
                                          ? "text-black"
                                          : "text-gray-600 group-hover:text-gray-900",
                                        "mr-3 flex-shrink-0 h-5 w-5"
                                      )}
                                    />
                                    {item.name}
                                  </div>
                                  <div>
                                    <ExclamationCircleIcon className="h-6 w-6 mr-1 text-red-500" />
                                  </div>
                                </Link>
                              );
                            }
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
                            if (
                              item.name === "Keys" &&
                              !isLoading &&
                              count < 1
                            ) {
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className={clsx(
                                    item.current
                                      ? "bg-gray-200 text-black"
                                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                    "group flex items-center px-2 py-2 text-md font-medium rounded-md w-full justify-between"
                                  )}
                                >
                                  <div className="flex flex-row items-center">
                                    <item.icon
                                      className={clsx(
                                        item.current
                                          ? "text-black"
                                          : "text-gray-600 group-hover:text-gray-900",
                                        "mr-3 flex-shrink-0 h-5 w-5"
                                      )}
                                    />
                                    {item.name}
                                  </div>
                                  <div>
                                    <ExclamationCircleIcon className="h-5 w-5 mr-1 text-red-500" />
                                  </div>
                                </Link>
                              );
                            }
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
                      <ul className="p-4 font-medium text-md text-gray-500 space-y-4">
                        <li>
                          <Link
                            href="https://docs.helicone.ai/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-gray-900"
                          >
                            Docs
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="https://discord.gg/zsSTcH2qhG"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-gray-900"
                          >
                            Discord
                          </Link>
                        </li>
                      </ul>
                      <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
                        <div className="group block w-full flex-shrink-0">
                          <Disclosure>
                            <div className="flex items-center">
                              <div>
                                <div className="px-2.5 py-0.5 text-lg font-light bg-black text-white rounded-full flex items-center justify-center focus:ring-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2">
                                  <span className="sr-only">
                                    Open user menu
                                  </span>
                                  {user?.email?.charAt(0).toUpperCase() || (
                                    <UserCircleIcon className="h-8 w-8 text-black" />
                                  )}
                                </div>
                              </div>
                              <div className="ml-3 flex flex-col items-start">
                                <p className="text-sm font-medium text-gray-700">
                                  {user?.email}
                                </p>
                                <Disclosure.Button className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                                  Sign Out
                                </Disclosure.Button>
                              </div>
                            </div>
                            <Disclosure.Panel className="text-gray-500">
                              {({ close }) => (
                                <div className="w-full flex justify-between gap-4 mt-4">
                                  <button
                                    onClick={() => {
                                      close();
                                    }}
                                    className={clsx(
                                      "relative inline-flex w-full justify-center border border-gray-300 items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                                    )}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() =>
                                      supabaseClient.auth.signOut().then(() => {
                                        router.push("/");
                                      })
                                    }
                                    className={clsx(
                                      "relative inline-flex w-full justify-center text-center items-center rounded-md hover:bg-red-700 bg-red-500 px-4 py-2 text-sm font-medium text-white"
                                    )}
                                  >
                                    Sign Out
                                  </button>
                                </div>
                              )}
                            </Disclosure.Panel>
                          </Disclosure>
                        </div>
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
                      if (item.name === "Keys" && !isLoading && count < 1) {
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                              item.current
                                ? "bg-gray-200 text-black"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                              "group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full justify-between"
                            )}
                          >
                            <div className="flex flex-row items-center">
                              <item.icon
                                className={clsx(
                                  item.current
                                    ? "text-black"
                                    : "text-gray-600 group-hover:text-gray-900",
                                  "mr-3 flex-shrink-0 h-5 w-5"
                                )}
                              />
                              {item.name}
                            </div>
                            <div>
                              <ExclamationCircleIcon className="h-5 w-5 mr-1 text-red-500" />
                            </div>
                          </Link>
                        );
                      }
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
                      if (item.name === "Keys" && !isLoading && count < 1) {
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                              item.current
                                ? "bg-gray-200 text-black"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                              "group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full justify-between"
                            )}
                          >
                            <div className="flex flex-row items-center">
                              <item.icon
                                className={clsx(
                                  item.current
                                    ? "text-black"
                                    : "text-gray-600 group-hover:text-gray-900",
                                  "mr-3 flex-shrink-0 h-5 w-5"
                                )}
                              />
                              {item.name}
                            </div>
                            <div>
                              <ExclamationCircleIcon className="h-5 w-5 mr-1 text-red-500" />
                            </div>
                          </Link>
                        );
                      }
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

                <ul className="p-4 font-medium text-sm text-gray-500 space-y-4">
                  <li>
                    <Link
                      href="https://docs.helicone.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gray-900"
                    >
                      Docs
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://discord.gg/zsSTcH2qhG"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gray-900"
                    >
                      Discord
                    </Link>
                  </li>
                </ul>
                <div className="flex flex-col border-t border-gray-200 p-4 space-y-4">
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
                      verticalAlign="top"
                    />
                  )}
                  <div className="flex flex-shrink-0">
                    <div className="group block w-full flex-shrink-0">
                      <Disclosure>
                        <div className="flex items-center">
                          <div>
                            <div className="px-2.5 py-0.5 text-lg font-light bg-black text-white rounded-full flex items-center justify-center focus:ring-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2">
                              <span className="sr-only">Open user menu</span>
                              {user?.email?.charAt(0).toUpperCase() || (
                                <UserCircleIcon className="h-8 w-8 text-black" />
                              )}
                            </div>
                          </div>
                          <div className="ml-3 flex flex-col items-start">
                            <p className="text-sm font-medium text-gray-700">
                              {user?.email}
                            </p>
                            <Disclosure.Button className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                              Sign Out
                            </Disclosure.Button>
                          </div>
                        </div>
                        <Disclosure.Panel className="text-gray-500">
                          {({ close }) => (
                            <div className="w-full flex justify-between gap-4 mt-4">
                              <button
                                onClick={() => {
                                  close();
                                }}
                                className={clsx(
                                  "relative inline-flex w-full justify-center border border-gray-300 items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                                )}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() =>
                                  supabaseClient.auth.signOut().then(() => {
                                    router.push("/");
                                  })
                                }
                                className={clsx(
                                  "relative inline-flex w-full justify-center text-center items-center rounded-md hover:bg-red-700 bg-red-500 px-4 py-2 text-sm font-medium text-white"
                                )}
                              >
                                Sign Out
                              </button>
                            </div>
                          )}
                        </Disclosure.Panel>
                      </Disclosure>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <div
          className={clsx("flex flex-1 flex-col", !hideSidebar && "md:pl-60")}
        >
          <div className="sticky md:hidden top-0 z-20 flex h-14 flex-shrink-0 bg-white border-b border-gray-300">
            <button
              type="button"
              className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <main className="flex-1 bg">
            <div className="mx-auto px-4 sm:px-8 bg-gray-100 h-full">
              {/* Replace with your content */}
              {hasUnMigratedRequest &&
                displayMigrationModal &&
                (user?.email ?? "") !== DEMO_EMAIL && (
                  <div className="pointer-events-none flex sm:justify-center mt-4">
                    <div className="text-sm text-white w-full pointer-events-auto flex flex-col items-left justify-between gap-x-6 bg-cyan-500 shadow-md py-2.5 px-6 rounded-xl sm:py-3 sm:pr-3.5 sm:pl-4">
                      <div className="text-sm leading-6 items-center font-bold">
                        Sorry for the inconvenience
                      </div>
                      <div className=" leading-6items-center">
                        <strong className="font-semibold">
                          We recently migrated our systems to support orgs and
                          are still migrating your data to the new system. This
                          process is taking a few days to complete. Any reuqests
                          before April 22nd are still being migrated. Please
                          contact us on discord if you have any questions.
                        </strong>
                      </div>
                      <button
                        className="leading-6 text-left font-bold"
                        onClick={() => {
                          setDisplayMigrationModal(false);
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              {user?.email !== DEMO_EMAIL &&
                !hasConvertedLoading &&
                !hasConverted && (
                  <div className="pointer-events-none flex sm:justify-center mt-4">
                    <div className="w-full pointer-events-auto flex flex-col items-left justify-between gap-x-6 bg-red-500 shadow-md py-2.5 px-6 rounded-xl sm:py-3 sm:pr-3.5 sm:pl-4">
                      <div className="text-sm leading-6 text-yellow-200 items-center">
                        ⚠️ Action Required ⚠️
                      </div>
                      <div className="text-sm leading-6 text-white items-center">
                        <strong className="font-semibold">
                          We have detected you have not switched to using
                          Helicone Keys. We are deprecating this way of matching
                          requests to your account.
                        </strong>
                      </div>
                      <div className="text-sm leading-6 text-white items-center">
                        Please see our transition docs:{" "}
                        <Link
                          href="https://www.helicone.ai/auth-transition"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          <p className="inline font-semibold">
                            Auth Transition
                          </p>
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 mb-1 ml-1 inline" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
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
                <div className="py-4 sm:py-8" key={org?.renderKey}>
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
