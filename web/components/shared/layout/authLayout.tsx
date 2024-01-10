/* eslint-disable @next/next/no-img-element */
import Image from "next/image";

import { Dialog, Disclosure, Menu, Transition } from "@headlessui/react";
import {
  ArrowTopRightOnSquareIcon,
  Bars3BottomLeftIcon,
  BellIcon,
  BeakerIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ChevronRightIcon,
  CircleStackIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  CubeTransparentIcon,
  GlobeAltIcon,
  HomeIcon,
  KeyIcon,
  LockClosedIcon,
  QuestionMarkCircleIcon,
  TableCellsIcon,
  TagIcon,
  UserCircleIcon,
  UserGroupIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { User, useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";
import { DEMO_EMAIL } from "../../../lib/constants";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../clsx";
import ThemedDropdown from "../themed/themedDropdown";
import OrgContext, { useOrg } from "./organizationContext";

import { GrGraphQl } from "react-icons/gr";
import { useFeatureFlags } from "../../../services/hooks/featureFlags";
import UpgradeProModal from "../upgradeProModal";
import OrgDropdown from "./orgDropdown";

import { useLocalStorage } from "../../../services/hooks/localStorage";
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

  const tier = org?.currentOrg?.tier;

  const [open, setOpen] = useState(false);
  const { hasFlag } = useFeatureFlags(
    "webhook_beta",
    org?.currentOrg?.id || ""
  );
  const [openDev, setOpenDev] = useLocalStorage("openDev", "true");
  const [openOrg, setOpenOrg] = useLocalStorage("openOrg", "false");

  let hasPrivileges = org?.currentOrg?.organization_type !== "customer";

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
      name: "Alerts",
      href: "/alerts",
      icon: BellIcon,
      current: pathname.includes("/alerts"),
    },
    ...(hasPrivileges
      ? [
          {
            name: "Properties",
            href: "/properties",
            icon: TagIcon,
            current: pathname.includes("/properties"),
          },
          {
            name: "Cache",
            href: "/cache",
            icon: CircleStackIcon,
            current: pathname.includes("/cache"),
          },
          {
            name: "Jobs",
            href: "/jobs",
            icon: BriefcaseIcon,
            current: pathname.includes("/jobs"),
          },
          {
            name: "Models",
            href: "/models",
            icon: CubeTransparentIcon,
            current: pathname.includes("/models"),
          },
        ]
      : []),
    {
      name: "Playground",
      href: "/playground",
      icon: BeakerIcon,
      current: pathname.includes("/playground"),
    },

    ...(!hasPrivileges
      ? [
          {
            name: "Members",
            href: "/organization/members",
            icon: UserGroupIcon,
            current: pathname.includes("/members"),
          },
          {
            name: "Keys",
            href: "/keys",
            icon: KeyIcon,
            current: pathname.includes("/keys"),
          },
        ]
      : []),
  ];

  const organizationNav = [
    {
      name: "Settings",
      href: "/organization/settings",
      icon: Cog6ToothIcon,
      current: pathname.includes("/settings"),
    },
    {
      name: "Plan",
      href: "/organization/plan",
      icon: ChartBarIcon,
      current: pathname.includes("/plan"),
    },
    {
      name: "Members",
      href: "/organization/members",
      icon: UserGroupIcon,
      current: pathname.includes("/members"),
    },
  ];

  const developerNav = [
    {
      name: "Keys",
      href: "/keys",
      icon: KeyIcon,
      current: pathname.includes("/keys"),
    },
    {
      name: "GraphQL",
      href: "/graphql",
      icon: GrGraphQl,
      current: pathname.includes("/graphql"),
    },
  ];

  if (hasFlag) {
    developerNav.push({
      name: "Webhooks",
      href: "/webhooks",
      icon: GlobeAltIcon,
      current: pathname.includes("/webhooks"),
    });
  }

  if (tier === "pro" || tier === "enterprise") {
    developerNav.push({
      name: "Vault",
      href: "/vault",
      icon: LockClosedIcon,
      current: pathname.includes("/vault"),
    });
  }

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
                          {navigation.map((item, idx) => {
                            return (
                              <Link
                                key={idx}
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
                          {organizationNav.map((item, i) => {
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                  "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                  "group flex items-center px-2 py-2 text-md font-medium rounded-md w-full"
                                )}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center">
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
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
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

            {/* Static sidebar for desktop */}
            <div className="hidden md:fixed md:inset-y-0 md:flex md:w-56 md:flex-col z-10">
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="w-full flex flex-grow flex-col overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
                <div className="w-full bg-white dark:bg-black absolute flex flex-row justify-between items-center px-2 border-b border-r border-gray-200 dark:border-gray-800 h-16 min-h-[4rem]">
                  <div className="flex flex-col w-full">
                    <OrgDropdown />
                  </div>
                </div>

                <div
                  className={clsx(
                    org?.currentOrg?.organization_type === "reseller" ||
                      org?.isResellerOfCurrentCustomerOrg
                      ? "mt-20"
                      : "mt-16",
                    "flex flex-grow flex-col"
                  )}
                >
                  {(org?.currentOrg?.organization_type === "reseller" ||
                    org?.isResellerOfCurrentCustomerOrg) && (
                    <div className="flex w-full">
                      <button
                        onClick={() => {
                          router.push("/enterprise/portal");
                          if (
                            org.currentOrg?.organization_type === "customer" &&
                            org.currentOrg?.reseller_id
                          ) {
                            org.setCurrentOrg(org.currentOrg.reseller_id);
                          }
                        }}
                        className="border border-gray-300 dark:border-gray-700 dark:text-white w-full flex text-black px-4 py-1 text-sm font-medium items-center text-center justify-center mx-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-md"
                      >
                        {org.currentOrg?.organization_type === "customer"
                          ? "Back to Portal"
                          : "Customer Portal"}
                      </button>
                    </div>
                  )}
                  <nav className="flex-1 space-y-6 px-2 pb-4 pt-2">
                    <div className="flex flex-col space-y-1">
                      {navigation.map((item, idx) => {
                        return (
                          <Link
                            key={idx}
                            href={item.href}
                            className={clsx(
                              item.current
                                ? "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100",
                              "group flex items-center px-2 py-1.5 text-sm font-medium rounded-md"
                            )}
                          >
                            <item.icon
                              className={clsx(
                                item.current
                                  ? "text-black dark:text-white"
                                  : "text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100",
                                "mr-3 flex-shrink-0 h-4 w-4"
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                    {hasPrivileges && (
                      <div>
                        <div className="mb-1 text-xs font-sans font-medium tracking-wider text-gray-500 flex items-center space-x-2 rounded-md px-2 py-1">
                          <p>Developer</p>
                        </div>
                        <div className="flex flex-col space-y-1">
                          {developerNav.map((item, i) => {
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                  item.current
                                    ? "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100",
                                  "group flex items-center px-2 py-1.5 text-sm font-medium rounded-md"
                                )}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center">
                                    <item.icon
                                      className={clsx(
                                        item.current
                                          ? "text-black dark:text-white"
                                          : "text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100",
                                        "mr-3 flex-shrink-0 h-4 w-4"
                                      )}
                                      aria-hidden="true"
                                    />
                                    {item.name}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {hasPrivileges && (
                      <Disclosure
                        defaultOpen={
                          router.pathname.includes("/organization/settings") ||
                          router.pathname.includes("/organization/plan") ||
                          router.pathname.includes("/organization/members")
                        }
                      >
                        {({ open }) => (
                          <div>
                            <Disclosure.Button
                              onClick={() => {
                                setOpenOrg(
                                  openOrg === "true" ? "false" : "true"
                                );
                              }}
                              className="w-full mb-1 text-xs font-sans font-medium tracking-wider text-gray-500 flex items-center space-x-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 px-2 py-1"
                            >
                              <p>Organization</p>
                              <ChevronRightIcon
                                className={clsx(
                                  open ? "transform rotate-90" : "",
                                  "h-3 w-3 inline"
                                )}
                              />
                            </Disclosure.Button>
                            <Transition
                              enter="transition duration-100 ease-out"
                              enterFrom="transform scale-95 opacity-0"
                              enterTo="transform scale-100 opacity-100"
                              leave="transition duration-75 ease-out"
                              leaveFrom="transform scale-100 opacity-100"
                              leaveTo="transform scale-95 opacity-0"
                            >
                              <Disclosure.Panel className="flex flex-col space-y-1">
                                {organizationNav.map((item, i) => {
                                  return (
                                    <Link
                                      key={item.name}
                                      href={item.href}
                                      className={clsx(
                                        item.current
                                          ? "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
                                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100",
                                        "group flex items-center px-2 py-1.5 text-sm font-medium rounded-md"
                                      )}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                          <item.icon
                                            className={clsx(
                                              item.current
                                                ? "text-black dark:text-white"
                                                : "text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100",
                                              "mr-3 flex-shrink-0 h-4 w-4"
                                            )}
                                            aria-hidden="true"
                                          />
                                          {item.name}
                                        </div>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </Disclosure.Panel>
                            </Transition>
                          </div>
                        )}
                      </Disclosure>
                    )}
                  </nav>
                </div>
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

                      <p className="text-xs font-normal text-sky-600">
                        Learn More
                      </p>
                    </button>
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </div>
            </div>
          </>
        )}
        <div
          className={clsx("flex flex-1 flex-col", !hideSidebar && "md:pl-56")}
        >
          <div className="sticky top-0 z-20 h-16 flex md:hidden flex-shrink-0 bg-white dark:bg-black border-b border-gray-300 dark:border-gray-700">
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
                <div className="flex md:hidden">
                  {org && (
                    <ThemedDropdown
                      selectedValue={org.currentOrg?.id}
                      options={org.allOrgs.map((org) => {
                        if (org.owner === user?.id) {
                          return {
                            label: org.name + " (Owner)",
                            value: org.id,
                          };
                        } else {
                          return {
                            label: org.name,
                            value: org.id,
                          };
                        }
                      })}
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
                  <div className="flex flex-row gap-4 items-center">
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
                      {organizationNav.map((item) => (
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
                            onClick={async () => {
                              supabaseClient.auth.signOut().then(() => {
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

          <main className="flex-1">
            <div
              className={clsx(
                router.pathname.includes("enterprise")
                  ? "bg-gray-100" // change this to white after layout change
                  : "bg-gray-100",
                "mx-auto px-4 sm:px-8 dark:bg-[#17191d] h-full min-h-screen"
              )}
            >
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
                      onClick={async () => {
                        supabaseClient.auth.signOut().then(() => {
                          router.push("/");
                        });
                      }}
                      type="button"
                      className="-m-1.5 flex-none px-3 py-1.5 text-sm bg-white hover:bg-gray-100 text-gray-900 rounded-lg"
                    >
                      Exit Demo
                    </button>
                  </div>
                </div>
              )}
              <OrgContext.Provider value={org}>
                <div
                  className="py-4 sm:py-8 mx-auto w-full max-w-[100rem]"
                  key={org?.renderKey}
                >
                  {children}
                </div>
              </OrgContext.Provider>
              {/* /End replace */}
            </div>
          </main>
        </div>
      </div>
      <UpgradeProModal open={open} setOpen={setOpen} />
    </>
  );
};

export default AuthLayout;
