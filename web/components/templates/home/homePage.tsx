/* eslint-disable @next/next/no-img-element */
/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { Fragment, SVGProps, useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import {
  ArrowUturnLeftIcon,
  BanknotesIcon,
  Bars3Icon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  DocumentChartBarIcon,
  HeartIcon,
  InboxIcon,
  PencilSquareIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon, StarIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import AdvancedAnalytics from "./AdvancedAnalytics";
import Image from "next/image";
import { useRouter } from "next/router";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { DEMO_EMAIL } from "../../../lib/constants";
import Link from "next/link";
import ThemedModal from "../../shared/themedModal";
import Onboarding from "./onboarding";
import Login from "./login";
import Details from "./details";

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

const footerNavigation = {
  social: [
    {
      name: "Twitter",
      href: "https://twitter.com/helicone_ai",
      icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
    {
      name: "GitHub",
      href: "https://github.com/Helicone/helicone",
      icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ],
};

export default function HomePage() {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const [openOnboarding, setOpenOnboarding] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  return (
    <>
      <div className="bg-white">
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
                    key={item.name}
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
                  className="ml-8 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-gradient-to-r from-indigo-500 to-purple-500 bg-origin-border px-4 py-2 text-base font-medium text-white shadow-sm hover:from-purple-700 hover:to-indigo-700"
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
                            key={item.name}
                            href={item.href}
                            className="-m-3 flex items-center rounded-lg p-3 hover:bg-gray-50"
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                              <item.icon
                                className="h-6 w-6"
                                aria-hidden="true"
                              />
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
                            className="flex w-full items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-origin-border px-4 py-2 text-base font-medium text-white shadow-sm hover:from-purple-700 hover:to-indigo-700"
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

        <main>
          {/* Hero section */}
          <div className="relative">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100" />
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
              <div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
                <div className="absolute inset-0">
                  <img
                    className="h-full w-full object-cover"
                    src="/assets/landscape.png"
                    alt="People working on laptops"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-800 to-purple-700 mix-blend-multiply" />
                </div>
                <div className="relative py-16 px-6 sm:py-24 lg:py-32 lg:px-8">
                  <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                    <span className="block text-white">
                      Observability for your
                    </span>
                    <span className="block text-indigo-100">
                      GPT-3 application
                    </span>
                  </h1>
                  <p className="mx-auto mt-6 max-w-lg text-center text-xl text-indigo-200 sm:max-w-3xl">
                    Track usage, costs, and latency metrics with one line of
                    code. We&apos;re an open-source observability platform that
                    helps you better understand your GPT-3 application.
                  </p>
                  <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
                    <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
                      <button
                        onClick={() => setOpenOnboarding(true)}
                        className="w-full flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 sm:px-8"
                      >
                        Get started
                      </button>
                      <button
                        onClick={() => {
                          supabaseClient.auth.signOut().then(() => {
                            supabaseClient.auth
                              .signInWithPassword({
                                email: DEMO_EMAIL,
                                password: "valyrdemo",
                              })
                              .then((res) => {
                                router.push("/dashboard");
                              });
                          });
                        }}
                        className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-500 bg-opacity-80 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-opacity-70 sm:px-8"
                      >
                        View Demo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alternating Feature Sections */}
          <Details />

          {/* Stats section */}
          <AdvancedAnalytics />

          {/* CTA Section */}
          <div className="bg-white">
            <div className="mx-auto max-w-4xl py-16 px-6 sm:py-24 lg:flex lg:max-w-7xl lg:items-center lg:justify-between lg:px-8">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                <span className="block">We&apos;re Open Source!</span>
                <span className="-mb-1 hidden sm:block bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text pb-1 text-transparent">
                  View our repo and join our community
                </span>
                <span className="-mb-1 block sm:hidden bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text pb-1 text-transparent">
                  Join our community
                </span>
              </h2>
              <div className="mt-6 space-y-4 sm:flex sm:space-y-0 sm:space-x-5">
                <a
                  href="https://github.com/Helicone/helicone"
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-row items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-origin-border px-4 py-3 text-base font-medium text-white shadow-sm hover:from-purple-700 hover:to-indigo-700"
                >
                  Star us on GitHub
                  <StarIcon className="h-4 w-4 ml-1 text-yellow-500 animate-pulse" />
                </a>
                <a
                  href="https://discord.gg/zsSTcH2qhG"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center rounded-md border border-transparent bg-indigo-50 px-4 py-3 text-base font-medium text-indigo-800 shadow-sm hover:bg-indigo-100"
                >
                  Join Discord
                </a>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-gray-50" aria-labelledby="footer-heading">
          <h2 id="footer-heading" className="sr-only">
            Footer
          </h2>
          <div className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
            <div className="pt-8 md:flex md:items-center md:justify-between lg:mt-16">
              <div className="flex space-x-6 md:order-2">
                {footerNavigation.social.map((item) => (
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
              <div className="mt-8 text-base text-gray-400 md:order-1 md:mt-0 flex flex-row gap-4">
                &copy; 2023 Helicone, Inc. All rights reserved.
                <Link href={"/privacy"} className="hover:text-black">
                  Privacy Policy
                </Link>
                <Link href={"/terms"} className="hover:text-black">
                  Terms of Use
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <ThemedModal open={openOnboarding} setOpen={setOpenOnboarding}>
        <Onboarding currentStep={currentStep} setCurrentStep={setCurrentStep} />
      </ThemedModal>
      <ThemedModal open={openLogin} setOpen={setOpenLogin}>
        <Login />
      </ThemedModal>
    </>
  );
}
