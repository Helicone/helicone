import { Fragment, SVGProps, useState } from "react";
import { Popover, RadioGroup, Transition } from "@headlessui/react";
import {
  BanknotesIcon,
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  CodeBracketIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import ThemedModal from "../../shared/themedModal";
import Onboarding from "../home/onboarding";
import Login from "../home/login";

const frequencies = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Annually", priceSuffix: "/year" },
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
    href: process.env.NEXT_PUBLIC_HELICONE_CONTACT_LINK,
    icon: QuestionMarkCircleIcon,
  },
];

const tiers = [
  {
    name: "Free",
    id: "free",
    href: "#",
    price: "$0",
    description: "The basic essentials for any project using GPT-3.",
    features: [
      "Up to 1,000 requests per month",
      "Basic Support",
      "Simple Metrics",
    ],
    featured: false,
    cta: "Get Started",
  },
  {
    name: "Starter",
    id: "tier-starter",
    href: "#",
    price: "$50",
    description: "A plan that scales with your rapidly growing business.",
    features: [
      "Up to 50,000 requests per month",
      "Priority Support",
      "Advanced Insights",
      "Rate Limits and Analytics",
    ],
    featured: false,
    cta: "Get Started",
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: "#",
    price: "Custom",
    description: "Dedicated support and infrastructure for your company.",
    features: [
      "Over 50,000 requests per month",
      "Design Consultation",
      "Prompt Discovery",
      "Caching",
      "Custom Features and Integrations",
    ],
    featured: true,
    cta: "Contact sales",
  },
];

export default function PricingPage() {
  const [openOnboarding, setOpenOnboarding] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const router = useRouter();

  return (
    <>
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
      <div className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-2xl font-semibold leading-8 tracking-tight text-indigo-600">
              Pricing
            </h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Pricing plans for teams of all sizes
            </p>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
            We offer a variety of plans to fit your needs. Whether you&apos;re a
            growing startup or a large enterprise, we have a plan for you.
          </p>

          <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={clsx(
                  tier.featured ? "bg-gray-900 ring-gray-900" : "ring-gray-200",
                  "rounded-3xl p-8 ring-1 xl:p-10"
                )}
              >
                <h3
                  id={tier.id}
                  className={clsx(
                    tier.featured ? "text-white" : "text-gray-900",
                    "text-lg font-semibold leading-8"
                  )}
                >
                  {tier.name}
                </h3>
                <p
                  className={clsx(
                    tier.featured ? "text-gray-300" : "text-gray-600",
                    "mt-4 text-sm leading-6"
                  )}
                >
                  {tier.description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span
                    className={clsx(
                      tier.featured ? "text-white" : "text-gray-900",
                      "text-4xl font-bold tracking-tight"
                    )}
                  >
                    {tier.price}
                  </span>
                  {tier.id !== "tier-enterprise" && (
                    <span
                      className={clsx(
                        tier.featured ? "text-gray-300" : "text-gray-600",
                        "text-sm font-semibold leading-6"
                      )}
                    >
                      /month
                    </span>
                  )}
                </p>
                {tier.id === "tier-enterprise" ? (
                  <Link
                    href={process.env.NEXT_PUBLIC_HELICONE_CONTACT_LINK || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-describedby={tier.id}
                    className={clsx(
                      tier.featured
                        ? "bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white"
                        : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600",
                      "mt-6 block rounded-md py-2 px-3 text-center text-sm leading-6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    )}
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => setOpenOnboarding(true)}
                    aria-describedby={tier.id}
                    className={clsx(
                      tier.featured
                        ? "bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white"
                        : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600",
                      "w-full mt-6 block rounded-md py-2 px-3 text-center text-sm leading-6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    )}
                  >
                    {tier.cta}
                  </button>
                )}

                <ul
                  role="list"
                  className={clsx(
                    tier.featured ? "text-gray-300" : "text-gray-600",
                    "mt-8 space-y-3 text-sm leading-6 xl:mt-10"
                  )}
                >
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon
                        className={clsx(
                          tier.featured ? "text-white" : "text-indigo-600",
                          "h-6 w-5 flex-none"
                        )}
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
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
      <ThemedModal open={openOnboarding} setOpen={setOpenOnboarding}>
        <Onboarding currentStep={currentStep} setCurrentStep={setCurrentStep} />
      </ThemedModal>
      <ThemedModal open={openLogin} setOpen={setOpenLogin}>
        <Login />
      </ThemedModal>
    </>
  );
}
