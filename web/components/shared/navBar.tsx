/* eslint-disable @next/next/no-img-element */
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useEffect } from "react";
import { clsx } from "./clsx";

interface NavBarProps {
  variant?: "primary" | "secondary";
}

const NavBar = (props: NavBarProps) => {
  const { variant = "primary" } = props;
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const user = useUser();
  const { pathname } = router;

  useEffect(() => {
    // rerender the navbar when the user changes
  }, [user]);

  const paths = [
    {
      name: "Home",
      path: "/",
      active: pathname === "/",
    },
    {
      name: "Dashboard",
      path: "/dashboard",
      active: pathname === "/dashboard",
    },
  ];

  const leftPaths = [
    // {
    //   name: "View Account",
    //   path: "/settings/account",
    //   active: pathname === "/settings/account",
    // },
    {
      name: "Manage Keys",
      path: "/settings/keys",
      active: pathname === "/settings/keys",
    },
    // {
    //   name: "View Pricing",
    //   path: "/settings/pricing",
    //   active: pathname === "/settings/pricing",
    // },
  ];

  return (
    <Disclosure
      as="nav"
      className={clsx(
        variant === "primary"
          ? "bg-gray-300"
          : "bg-white border-b-[0.5px] border-gray-300 sm:px-4"
      )}
    >
      {({ open }) => (
        <>
          <div className="mx-auto py-1 font-sans">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <div className="text-lg border border-black p-2 rounded-lg">
                    Valyr.ai
                  </div>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <div className="hidden sm:ml-6 sm:flex sm:flex-row sm:space-x-6 p-1 pr-4 text-black">
                  {!user && (
                    <Link
                      href="/"
                      key="home"
                      className={clsx(
                        "flex flex-row px-2 pt-1 text-sm font-medium pb-2 mt-1.5",
                        pathname === "/" && "border-b-2 border-sky-500"
                      )}
                    >
                      Home
                    </Link>
                  )}
                  <Link
                    href="https://docs.valyrai.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      "flex flex-row px-2 pt-1 text-sm font-medium pb-2 mt-1.5"
                    )}
                  >
                    Docs
                  </Link>
                  <Link
                    href="https://discord.gg/zsSTcH2qhG"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      "flex flex-row px-2 pt-1 text-sm font-medium pb-2 mt-1.5"
                    )}
                  >
                    Discord
                  </Link>
                  {!user && (
                    <button
                      onClick={() => router.push("/login")}
                      className="rounded-md bg-black px-3.5 py-1.5 text-sm font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Sign In
                    </button>
                  )}
                </div>

                {/* Profile dropdown */}
                {user && (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
                        <UserCircleIcon className="h-8 w-8 text-black" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-fit origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <p
                          className={clsx(
                            "hover:none block px-4 py-2 text-sm text-gray-700 border-b border-gray-300 font-bold"
                          )}
                        >
                          {user?.email}
                        </p>
                        {leftPaths.map((path) => (
                          <Menu.Item key={path.name}>
                            {({ active }) => (
                              <Link
                                href={path.path}
                                className={clsx(
                                  active ? "bg-gray-100" : "",
                                  "block px-4 py-2 text-sm text-gray-700"
                                )}
                              >
                                {path.name}
                              </Link>
                            )}
                          </Menu.Item>
                        ))}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={clsx(
                                active ? "bg-gray-100" : "",
                                "flex w-full px-4 py-2 text-sm text-gray-500"
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
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden border border-black rounded-md py-2 px-1 absolute min-w-[92vw] z-40 bg-white">
            <div className="space-y-1 pt-2 pb-3">
              {paths.map((path) => (
                <Disclosure.Button
                  key={path.name}
                  as="a"
                  href={path.path}
                  className={clsx(
                    "block py-2 pl-3 pr-4 text-base font-medium",
                    path.active &&
                      "border-l-4 border-sky-500 bg-sky-300 text-black"
                  )}
                >
                  {path.name}
                </Disclosure.Button>
              ))}
              <Link
                href="https://discord.gg/zsSTcH2qhG"
                target="_blank"
                rel="noopener noreferrer"
                className={clsx("block py-2 pl-3 pr-4 text-base font-medium")}
              >
                Discord
              </Link>
              <div className="border-b border-gray-300"></div>
              {leftPaths.map((path) => (
                <Disclosure.Button
                  key={path.name}
                  as="a"
                  href={path.path}
                  className={clsx(
                    "block py-2 pl-3 pr-4 text-base font-medium",
                    path.active &&
                      "border-l-4 border-sky-500 bg-sky-300 text-black"
                  )}
                >
                  {path.name}
                </Disclosure.Button>
              ))}
              <Disclosure.Button
                onClick={() => {
                  supabaseClient.auth.signOut().then(() => router.push("/"));
                }}
                className={clsx(
                  "block py-2 pl-3 pr-4 text-base font-medium text-gray-500"
                )}
              >
                Sign Out
              </Disclosure.Button>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default NavBar;
