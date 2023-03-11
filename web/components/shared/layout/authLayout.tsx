/* eslint-disable @next/next/no-img-element */
import Image from "next/image";

import { Fragment, useEffect, useState } from "react";
import { Dialog, Menu, Transition } from "@headlessui/react";
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

interface AuthLayoutProps {
  children: React.ReactNode;
  user: User;
}

const AuthLayout = (props: AuthLayoutProps) => {
  const { children, user } = props;
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const { pathname } = router;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      current: pathname === "/dashboard",
    },
    {
      name: "Requests",
      href: "/requests",
      icon: TableCellsIcon,
      current: pathname === "/requests",
    },
    {
      name: "Users",
      href: "/users",
      icon: UsersIcon,
      current: pathname === "/users",
    },
    {
      name: "Models",
      href: "/models",
      icon: CubeTransparentIcon,
      current: pathname === "/models",
    },
  ];

  const accountNav = [
    {
      name: "Usage",
      mobile: "View Usage",
      href: "/usage",
      icon: BeakerIcon,
      current: pathname === "/usage",
    },
    {
      name: "Keys",
      mobile: "Manage Keys",
      href: "/keys",
      icon: KeyIcon,
      current: pathname === "/keys",
    },
  ];

  const { count, isLoading, keys, refetch } = useGetKeys();

  return (
    <>
      <div>
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
                      className="rounded-md"
                      src="/assets/heli-full-logo.png"
                      width={150}
                      height={75}
                      alt="Helicone-full-logo"
                    />
                  </div>
                  <div className="mt-5 h-0 flex-1 overflow-y-auto">
                    <nav className="space-y-1 px-2">
                      {navigation.map((item) => {
                        if (item.name === "Keys" && !isLoading && count < 1) {
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={clsx(
                                item.current
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                "group flex items-center px-2 py-2 text-base font-medium rounded-md w-full justify-between"
                              )}
                            >
                              <div className="flex flex-row items-center">
                                <item.icon
                                  className={clsx(
                                    item.current
                                      ? "text-gray-500"
                                      : "text-gray-400 group-hover:text-gray-500",
                                    "mr-4 flex-shrink-0 h-5 w-5"
                                  )}
                                  aria-hidden="true"
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
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                              "group flex items-center px-2 py-2 text-base font-medium rounded-md"
                            )}
                          >
                            <item.icon
                              className={clsx(
                                item.current
                                  ? "text-gray-500"
                                  : "text-gray-400 group-hover:text-gray-500",
                                "mr-4 flex-shrink-0 h-5 w-5"
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
        <div className="hidden md:fixed md:inset-y-0 md:flex md:w-40 md:flex-col">
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
                  className="rounded-md"
                  src="/assets/heli-full-logo.png"
                  width={150}
                  height={75}
                  alt="Helicone-full-logo"
                />
              </button>
            </div>
            <div className="mt-5 flex flex-grow flex-col bg-y-el">
              <nav className="flex-1 space-y-1 px-2 pb-4 pt-2">
                {/* <p className="ml-1 mb-1 text-xs font-sans font-medium tracking-wide pt-4">
                  METRICS
                </p> */}
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
          </div>
        </div>
        <div className="flex flex-1 flex-col md:pl-40">
          <div className="sticky top-0 z-20 flex h-16 flex-shrink-0 bg-white border-b border-gray-300">
            <button
              type="button"
              className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
            </button>
            {user?.email === DEMO_EMAIL && (
              <div className="flex h-full items-center px-2">
                <div className="py-2 bg-red-600 px-4 rounded-lg text-white flex flex-row text-xs sm:text-base items-center ">
                  <div className="flex flex-row gap-1 sm:gap-2">
                    <ExclamationCircleIcon className="h-5 w-5 mt-0.5 hidden sm:inline" />
                    <p className="hidden lg:inline">
                      Currently viewing demo. Data from:
                    </p>
                    <p className="inline lg:hidden">Viewing</p>
                    <div className="flex flex-row gap-1 items-center">
                      <Link
                        href="https://demoapp.valyrai.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        <p className="hidden lg:inline">AI App Ideas</p>
                        <p className="inline lg:hidden">Demo</p>
                      </Link>
                      <ArrowTopRightOnSquareIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                </div>
                <button
                  className="flex flex-row ml-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-xs sm:text-base"
                  onClick={() =>
                    supabaseClient.auth.signOut().then(() => {
                      router.push("/");
                    })
                  }
                >
                  <span className="inline lg:hidden">Exit</span>
                  <span className="hidden lg:inline">Exit Demo</span>
                </button>
              </div>
            )}

            <div className="flex flex-1 justify-end px-4">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="hidden sm:flex text-gray-500">
                  <Link
                    href="https://docs.helicone.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      "flex flex-row px-2 pt-1 text-sm font-medium pb-2 mt-1.5 mr-4"
                    )}
                  >
                    Docs
                  </Link>
                  <Link
                    href="https://discord.gg/zsSTcH2qhG"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      "flex flex-row px-2 pt-1 text-sm font-medium pb-2 mt-1.5 mr-4"
                    )}
                  >
                    Discord
                  </Link>
                </div>

                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
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
                    <Menu.Items className="absolute right-0 z-50 mt-2 w-max min-w-48 origin-top-right rounded-md bg-white py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item key="user-email">
                        {({ active }) => (
                          <p className="block px-4 py-2 text-sm text-black font-bold border-b border-gray-300">
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
                              {item.mobile}
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
            <div className="mx-auto px-4 sm:px-8 bg-gray-100 min-h-[92.5vh]">
              {/* Replace with your content */}
              <div className="py-4 sm:py-8">{children}</div>
              {/* /End replace */}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AuthLayout;
