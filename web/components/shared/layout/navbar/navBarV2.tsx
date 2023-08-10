/* eslint-disable @next/next/no-img-element */
import { Dialog, Popover, Transition } from "@headlessui/react";
import {
  BanknotesIcon,
  Bars3Icon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  QuestionMarkCircleIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { Fragment, useState } from "react";
import OnboardingButton from "../../auth/onboardingButton";
import { SocialMeta } from "../basePageV2";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import LoginButton from "../../auth/loginButton";
import { clsx } from "../../clsx";
import SolutionsButton from "./solutionsButton";
import DeveloperButton from "./developerButton";

interface NavBarV2Props {}

const NavBarV2 = (props: NavBarV2Props) => {
  const {} = props;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = useUser();
  const router = useRouter();
  const supabaseClient = useSupabaseClient();

  return (
    <header className="bg-gray-50 top-0 sticky z-30">
      {!mobileMenuOpen && (
        <nav
          className="mx-auto flex max-w-7xl items-center md:gap-x-8 gap-x-16 p-4 md:px-8"
          aria-label="Global"
        >
          <div className="flex">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Helicone</span>
              {/* 1324 × 364 */}
              <Image
                className="block rounded-lg"
                src="/assets/landing/helicone.webp"
                width={150}
                height={150 / (1876 / 528)}
                alt="Helicone-full-logo"
              />
            </Link>
          </div>
          <div className="hidden md:flex md:gap-x-2 items-center">
            <SolutionsButton />
            <DeveloperButton />
            <Link
              href="/pricing"
              className="flex flex-row items-center font-semibold hover:bg-gray-200 rounded-lg px-4 py-2 focus:outline-none"
            >
              Pricing
            </Link>
          </div>
          <div className="flex-1 hidden md:flex items-center justify-end gap-x-4">
            <Link
              href="https://github.com/Helicone/helicone"
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                "text-xs font-semibold text-gray-900 flex flex-row gap-x-2 items-center"
              )}
            >
              <StarIcon className="h-3 w-3 text-gray-900 " />
              <div className="hidden lg:block">Star us on Github</div>
              <div className="lg:hidden">Github</div>
            </Link>
            {user ? (
              <button
                onClick={() => {
                  supabaseClient.auth.signOut().then(() => {
                    router.push("/");
                  });
                }}
                className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-lg px-4 py-2 text-md font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/signin"
                className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-lg px-4 py-2 text-md font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Sign In
              </Link>
            )}
          </div>
          <div className="flex flex-1 justify-end md:hidden">
            {mobileMenuOpen ? (
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">close main menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
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
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-gray-50 px-6 py-6 sm:ring-1 sm:ring-gray-900/10">
          <div className="flex flex-col gap-10 h-full">
            <div>
              <div className="flex items-center gap-x-6 justify-between">
                <a href="#" className="-m-1.5 p-1.5">
                  <span className="sr-only">Helicone</span>
                  <Image
                    className="block rounded-lg"
                    src="/assets/landing/helicone.webp"
                    width={150}
                    height={150 / (1876 / 528)}
                    alt="Helicone-full-logo"
                  />
                </a>

                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-gray-700"
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
                      href="/pricing"
                      className="text-md font-semibold text-gray-900"
                    >
                      Pricing
                    </Link>
                    <Link
                      href="https://docs.helicone.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-md font-semibold text-gray-900"
                    >
                      Documentation
                    </Link>
                    <Link
                      href="/roadmap"
                      className="text-md font-semibold text-gray-900"
                    >
                      Roadmap
                    </Link>
                    <Link
                      href="https://github.com/Helicone/helicone"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-md font-semibold text-gray-900"
                    >
                      Github
                    </Link>
                    <Link
                      href="/blog"
                      className="text-md font-semibold text-gray-900"
                    >
                      Blog
                    </Link>
                  </div>
                  <div className="pt-16 w-full">
                    {user ? (
                      <button
                        onClick={() => {
                          supabaseClient.auth.signOut().then(() => {
                            router.push("/");
                          });
                        }}
                        className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap flex w-full justify-center rounded-lg px-4 py-2 text-md font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                      >
                        Sign Out
                      </button>
                    ) : (
                      <Link
                        href="/signin"
                        className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap flex w-full justify-center rounded-lg px-4 py-2 text-md font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
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
