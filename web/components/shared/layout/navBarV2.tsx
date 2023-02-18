import { Popover, Transition } from "@headlessui/react";
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

const navigation = [
  {
    name: "Pricing",
    description:
      "Let us help you get back to what you do best. We'll handle the analytics.",
    href: "/pricing",
    icon: BanknotesIcon,
    target: "_self",
  },
  {
    name: "Docs",
    description: "Learn how to use Helicone to its fullest potential.",
    href: "https://docs.helicone.ai/",
    icon: BookOpenIcon,
    target: "_target",
  },
  {
    name: "Github",
    description: "We're open source! Check out our code and contribute!",
    href: "https://github.com/Helicone/helicone",
    icon: CodeBracketIcon,
    target: "_blank",
  },
  {
    name: "Discord",
    description: "Join our vibrant community and chat with us!",
    href: "https://discord.gg/zsSTcH2qhG",
    icon: ChatBubbleLeftRightIcon,
    target: "_blank",
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
}

const NavBarV2 = (props: NavBarV2Props) => {
  const { setOpenLogin, setOpenOnboarding } = props;

  const router = useRouter();

  return (
    <header>
      <Popover className="relative bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-6 md:justify-start md:space-x-10 lg:px-8 h-16 md:h-24">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <button
              onClick={() => router.push("/")}
              className="hidden sm:block"
            >
              <Image
                className="rounded-md"
                src="/assets/logos/logo-transparent.png"
                width={200}
                height={125}
                alt="Helicone-full-logo"
              />
            </button>
            <button
              onClick={() => router.push("/")}
              className="block sm:hidden -ml-8"
            >
              <Image
                className="rounded-md"
                src="/assets/logos/logo-blocks-transparent.png"
                width={75}
                height={50}
                alt="Helicone-full-logo"
              />
            </button>
          </div>
          <div className="-my-2 -mr-2 md:hidden">
            <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
              <span className="sr-only">Open menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </Popover.Button>
          </div>
          <Popover.Group as="nav" className="hidden space-x-10 md:flex">
            {navigation.map((item) => (
              <Link
                href={item.href as string}
                target={item.target}
                key={`desktop-${item.name}`}
                className="text-base font-medium text-gray-500 hover:text-gray-900"
                rel="noopener noreferrer"
              >
                {item.name}
              </Link>
            ))}
          </Popover.Group>
          <div className="hidden items-center justify-end md:flex md:flex-1 lg:w-0">
            <button
              onClick={() => setOpenLogin(true)}
              className="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-900"
            >
              Sign in
            </button>
            <button
              onClick={() => setOpenOnboarding(true)}
              className="ml-8 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-gradient-to-r from-sky-600 to-indigo-500 bg-origin-border px-4 py-2 text-base font-medium text-white shadow-sm hover:from-sky-700 hover:to-indigo-600"
            >
              Sign up
            </button>
          </div>
        </div>

        <Transition
          as={Fragment}
          enter="duration-200 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-100 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Popover.Panel
            focus
            className="absolute inset-x-0 top-0 z-30 origin-top-right transform p-2 transition md:hidden"
          >
            <div className="divide-y-2 divide-gray-50 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="px-5 pt-5 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    {/* <img
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/mark.svg?from-color=purple&from-shade=600&to-color=indigo&to-shade=600&toShade=600"
                    alt="Your Company"
                  /> */}
                  </div>
                  <div className="-mr-2">
                    <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                      <span className="sr-only">Close menu</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </Popover.Button>
                  </div>
                </div>
                <div className="mt-6">
                  <nav className="grid grid-cols-1 gap-7">
                    {navigation.map((item) => (
                      <a
                        key={`mobile-${item.name}`}
                        href={item.href}
                        className="-m-3 flex items-center rounded-lg p-3 hover:bg-gray-50"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-r from-sky-600 to-indigo-500 text-white">
                          <item.icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div className="ml-4 text-base font-medium text-gray-900">
                          {item.name}
                        </div>
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
              <div className="py-6 px-5">
                <div className="">
                  <Popover.Panel>
                    {({ close }) => (
                      <button
                        className="flex w-full items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-sky-600 to-indigo-500 bg-origin-border px-4 py-2 text-base font-medium text-white shadow-sm hover:from-purple-700 hover:to-indigo-700"
                        onClick={() => {
                          close();
                          setOpenOnboarding(true);
                        }}
                      >
                        Sign Up
                      </button>
                    )}
                  </Popover.Panel>
                  <p className="mt-6 text-center text-base font-medium text-gray-500">
                    Existing customer?{` `}
                    <Popover.Panel className="inline">
                      {({ close }) => (
                        <button
                          className="text-gray-900"
                          onClick={() => {
                            close();
                            setOpenLogin(true);
                          }}
                        >
                          Sign In
                        </button>
                      )}
                    </Popover.Panel>
                  </p>
                </div>
              </div>
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>
    </header>
  );
};

export default NavBarV2;
