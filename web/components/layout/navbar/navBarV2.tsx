/* eslint-disable @next/next/no-img-element */
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { Dialog } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import SolutionsButton from "./solutionsButton";

interface NavBarV2Props {}

const NavBarV2 = (props: NavBarV2Props) => {
  const {} = props;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const heliconeAuthClient = useHeliconeAuthClient();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-inherit px-4 dark:border-gray-700 dark:bg-black">
      {!mobileMenuOpen && (
        <nav
          className="mx-auto flex max-w-6xl items-center gap-x-16 py-3 md:gap-x-8"
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
          <div className="hidden items-center gap-x-1 text-sm md:flex lg:gap-x-2">
            <SolutionsButton />

            <Link
              href="https://docs.helicone.ai/"
              className="flex flex-row items-center rounded-md px-3 py-1.5 font-medium text-gray-700 hover:text-black focus:outline-none dark:text-gray-300 dark:hover:text-white"
            >
              Docs
            </Link>
            <Link
              href="https://helicone.ai/pricing"
              className="flex flex-row items-center rounded-md px-3 py-1.5 font-medium text-gray-700 hover:text-black focus:outline-none dark:text-gray-300 dark:hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              rel="noopener noreferrer"
              className="flex flex-row items-center rounded-md px-3 py-1.5 font-medium text-gray-700 hover:text-black focus:outline-none dark:text-gray-300 dark:hover:text-white"
            >
              Blog
            </Link>
            <Link
              href="/contact"
              className="flex flex-row items-center rounded-md px-3 py-1.5 font-medium text-gray-700 hover:text-black focus:outline-none dark:text-gray-300 dark:hover:text-white"
            >
              Contact
            </Link>
          </div>
          <div className="hidden flex-1 items-center justify-end gap-x-2 md:flex">
            {heliconeAuthClient.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="whitespace-nowrap rounded-md border-2 border-sky-700 bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    await heliconeAuthClient.refreshSession();
                    await heliconeAuthClient.signOut();
                    router.push("/");
                  }}
                  className="flex w-fit items-center gap-1 rounded-lg border-[3px] border-gray-300 bg-white px-4 py-1.5 text-sm font-bold text-black shadow-lg duration-500 ease-in-out hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="whitespace-nowrap rounded-md bg-[#f8feff] px-4 py-1.5 text-sm font-semibold text-black hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="whitespace-nowrap rounded-md border-2 border-sky-700 bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
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
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-50 px-6 py-6 dark:bg-gray-900 sm:ring-1 sm:ring-gray-900/10">
          <div className="flex h-full flex-col gap-10">
            <div>
              <div className="flex items-center justify-between gap-x-6">
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
                  <div className="flex flex-col space-y-8 py-6">
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
                  <div className="w-full pt-16">
                    {heliconeAuthClient.user ? (
                      <button
                        onClick={async () => {
                          await heliconeAuthClient.refreshSession();
                          await heliconeAuthClient.signOut();
                          router.push("/");
                        }}
                        className="text-md flex w-full justify-center whitespace-nowrap rounded-md bg-gray-900 px-4 py-2 font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                      >
                        Sign Out
                      </button>
                    ) : (
                      <Link
                        href="/signin"
                        className="text-md flex w-full justify-center whitespace-nowrap rounded-md bg-gray-900 px-4 py-2 font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
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
