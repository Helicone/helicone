/* eslint-disable @next/next/no-img-element */
import { Dialog } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import SolutionsButton from "./solutionsButton";
import { signOut } from "../../shared/utils/utils";

interface NavBarV2Props {}

const NavBarV2 = (props: NavBarV2Props) => {
  const {} = props;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = useUser();
  const router = useRouter();
  const supabaseClient = useSupabaseClient();

  return (
    <header className="bg-inherit dark:bg-black top-0 sticky z-30 border-b border-gray-200 dark:border-gray-700 px-4">
      {!mobileMenuOpen && (
        <nav
          className="mx-auto flex max-w-6xl items-center md:gap-x-8 gap-x-16 py-3"
          aria-label="Global"
        >
          <div className="flex items-center">
            <Link href="/" className="-m-1.5">
              <span className="sr-only">Helicone</span>
              <Image
                className="dark:hidden"
                src={"/static/logo.svg"}
                alt="Helicone - Open-source LLM observability and monitoring platform for developers"
                height={150}
                width={150}
                priority={true}
              />
              <Image
                className="hidden dark:block"
                src={"/static/logo-white.svg"}
                alt="Helicone - Open-source LLM observability and monitoring platform for developers"
                height={100}
                width={100}
                priority={true}
              />
            </Link>
          </div>
          <div className="hidden md:flex gap-x-1 lg:gap-x-2 items-center text-sm">
            <SolutionsButton />

            <Link
              href="https://docs.helicone.ai/"
              className="flex flex-row items-center font-medium hover:text-black dark:hover:text-white rounded-md px-3 py-1.5 focus:outline-none text-gray-700 dark:text-gray-300"
            >
              Docs
            </Link>
            <Link
              href="https://helicone.ai/pricing"
              className="flex flex-row items-center font-medium hover:text-black dark:hover:text-white rounded-md px-3 py-1.5 focus:outline-none text-gray-700 dark:text-gray-300"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              rel="noopener noreferrer"
              className="flex flex-row items-center font-medium hover:text-black dark:hover:text-white rounded-md px-3 py-1.5 focus:outline-none text-gray-700 dark:text-gray-300"
            >
              Blog
            </Link>
            <Link
              href="/contact"
              className="flex flex-row items-center font-medium hover:text-black dark:hover:text-white rounded-md px-3 py-1.5 focus:outline-none text-gray-700 dark:text-gray-300"
            >
              Contact
            </Link>
          </div>
          <div className="flex-1 hidden md:flex items-center justify-end gap-x-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="bg-sky-500 hover:bg-sky-600 border-2 border-sky-700 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    supabaseClient.auth.refreshSession();
                    signOut(supabaseClient).then(() => {
                      router.push("/");
                    });
                  }}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ease-in-out duration-500 text-black dark:text-white border-[3px] border-gray-300 dark:border-gray-600 text-sm rounded-lg px-4 py-1.5 font-bold shadow-lg flex w-fit items-center gap-1"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="bg-[#f8feff] dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-black dark:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-sky-500 hover:bg-sky-600 border-2 border-sky-700 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                  Sign up for free
                </Link>
              </>
            )}
          </div>
          <div className="flex flex-1 justify-end md:hidden">
            {mobileMenuOpen ? (
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">close main menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
          </div>
        </nav>
      )}
      {/* MOBILE */}
      <Dialog
        as="div"
        className="md:hidden"
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
      >
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 px-6 py-6 sm:ring-1 sm:ring-gray-900/10">
          <div className="flex flex-col gap-10 h-full">
            <div>
              <div className="flex items-center gap-x-6 justify-between">
                <a href="#" className="-m-1.5 p-1.5">
                  <span className="sr-only">Helicone</span>
                  <Image
                    className="block rounded-md"
                    src="/assets/landing/helicone.webp"
                    width={150}
                    height={150 / (1876 / 528)}
                    alt="Helicone-full-logo"
                  />
                </a>

                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6">
                  <div className="py-6 flex flex-col space-y-8">
                    <Link
                      href="https://helicone.ai/pricing"
                      className="text-md font-semibold text-gray-900 dark:text-gray-300"
                    >
                      Pricing
                    </Link>
                    <Link
                      href="https://docs.helicone.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-md font-semibold text-gray-900 dark:text-gray-300"
                    >
                      Documentation
                    </Link>
                    <Link
                      href="/roadmap"
                      className="text-md font-semibold text-gray-900 dark:text-gray-300"
                    >
                      Roadmap
                    </Link>
                    <Link
                      href="https://github.com/Helicone/helicone"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-md font-semibold text-gray-900 dark:text-gray-300"
                    >
                      Github
                    </Link>
                    <Link
                      href="/blog"
                      rel="noopener noreferrer"
                      className="text-md font-semibold text-gray-900 dark:text-gray-300"
                    >
                      Blog
                    </Link>
                  </div>
                  <div className="pt-16 w-full">
                    {user ? (
                      <button
                        onClick={() => {
                          supabaseClient.auth.refreshSession();
                          signOut(supabaseClient).then(() => {
                            router.push("/");
                          });
                        }}
                        className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap flex w-full justify-center rounded-md px-4 py-2 text-md font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                      >
                        Sign Out
                      </button>
                    ) : (
                      <Link
                        href="/signin"
                        className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap flex w-full justify-center rounded-md px-4 py-2 text-md font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                      >
                        Sign In
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
};

export default NavBarV2;
