/* eslint-disable @next/next/no-img-element */
import { Dialog, Popover, Transition } from "@headlessui/react";
import {
  BanknotesIcon,
  Bars3Icon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { Fragment, useState } from "react";
import OnboardingButton from "../auth/onboardingButton";
import { SocialMeta } from "./basePageV2";

const navigation = [
  {
    name: "Docs",
    description: "Learn how to use Helicone to its fullest potential.",
    href: "https://docs.helicone.ai/",
    target: "_target",
  },
  {
    name: "Roadmap",
    description: "See what we're working on and what's coming next.",
    href: "/roadmap",
    target: "_self",
  },
  {
    name: "Pricing",
    description:
      "Let us help you get back to what you do best. We'll handle the analytics.",
    href: "/pricing",
    target: "_self",
  },
  {
    name: "Contact",
    description: "Have a question? We're here to help!",
    href: process.env.NEXT_PUBLIC_HELICONE_CONTACT_LINK || "#",
    icon: QuestionMarkCircleIcon,
  },
];

interface NavBarV2Props {
  setOpenLogin: (open: boolean) => void;
  setOpenOnboarding: (open: boolean) => void;
  socials: SocialMeta[];
}

const NavBarV2 = (props: NavBarV2Props) => {
  const { setOpenLogin, setOpenOnboarding, socials } = props;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="bg-gray-50 border-b border-gray-200">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-x-6 p-4 lg:px-8"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Helicone</span>
            {/* 1324 × 364 */}
            <Image
              className="hidden sm:block rounded-md"
              // src="/assets/heli-full-logo.png"
              src="/assets/landing/helicone.png"
              width={150}
              height={150 / (1876 / 528)}
              // height={150 / (1324 / 364)}
              alt="Helicone-full-logo"
            />
            <Image
              className="block sm:hidden rounded-md"
              src="/assets/heli-logo.png"
              width={40}
              height={40}
              alt="Helicone-full-logo"
            />
          </Link>
        </div>
        <div className="hidden lg:flex lg:gap-x-16">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-gray-900"
              target={item.target}
              rel="noopener noreferrer"
            >
              {item.name}
            </a>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-end gap-x-4">
          <div className="hidden lg:flex space-x-6 mr-6">
            {socials.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </a>
            ))}
          </div>
          <button
            onClick={() => setOpenLogin(true)}
            className="whitespace-nowrap rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold border border-gray-300 hover:bg-sky-50 text-gray-900 shadow-sm hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Log In
          </button>
          <OnboardingButton variant="secondary" title={"Sign Up"} />
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </nav>
      <Dialog
        as="div"
        className="lg:hidden"
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
      >
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-gray-50 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex flex-col gap-10 h-full">
            <div>
              <div className="flex items-center gap-x-6 justify-between">
                <a href="#" className="-m-1.5 p-1.5">
                  <span className="sr-only">Helicone</span>
                  <Image
                    className="rounded-md"
                    src="/assets/heli-full-logo.png"
                    width={150}
                    height={150}
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
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="-mx-3 block rounded-lg py-2 px-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-row gap-5">
              {socials.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
};

export default NavBarV2;
