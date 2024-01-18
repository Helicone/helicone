import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import Footer from "../../shared/layout/footer";
import NavBarV2 from "../../shared/layout/navbar/navBarV2";
import Link from "next/link";

const tiers = [
  {
    name: "Free",
    id: "tier-free",
    href: "/signup",
    price: (
      <p className="mt-6 flex items-baseline gap-x-1">
        <span className="text-5xl font-bold tracking-tight text-gray-900">
          $0
        </span>
        <span className="text-sm font-semibold leading-6 text-gray-600">
          / month per organization
        </span>
      </p>
    ),
    description: "Everything necessary to get started.",
    features: [
      "Up to 50,000 requests per month",
      "Monitoring and Dashboards",
      "Custom Properties",
      "Basic Exporting",
      "3 Seats",
      "Unlimited Proxy Requests per minute",
      "100 logs per minute",
    ],
    buttonText: "Try for free",
    backgroundColor: "bg-sky-600",
    hoverBackgroundColor: "hover:bg-sky-500",
    textColor: "text-sky-600",
  },
  {
    name: "Pro",
    id: "tier-pro",
    href: "/signup",
    price: (
      <p className="mt-6 flex items-baseline gap-x-1">
        <span className="text-5xl font-bold tracking-tight text-gray-900">
          $80
        </span>
        <span className="text-sm font-semibold leading-6 text-gray-600">
          / month per organization
        </span>
      </p>
    ),
    description:
      "Everything in Free, plus essential tools for scaling up your business.",
    features: [
      "500,000 Requests",
      "100mb of Bucket Caching",
      "10 User Rate Limits",
      "1,000 GraphQL API request/day",
      "Request Retries",
      "Model Load Balancing (up to 2 models)",
      "Key Vault (5 keys)",
      "8 Seats",
      "Up to 500mb of storage",
      "Unlimited Proxy Requests per minute",
      "1,000 logs per minute",
    ],
    buttonText: "Get Started",
    backgroundColor: "bg-pink-600",
    hoverBackgroundColor: "hover:bg-pink-500",
    textColor: "text-pink-600",
  },
  {
    name: "Custom",
    id: "tier-enterprise",
    href: "/sales",
    price: (
      <p className="mt-6 flex items-baseline gap-x-1">
        <span className="text-5xl font-bold tracking-tight text-gray-900">
          Enterprise
        </span>
      </p>
    ),
    description:
      "Everything in Pro, plus features needed for larger enterprises.",
    features: [
      "SOC-2 Compliance",
      "Self-Deployment Management",
      "Dedicated Support Channel (24/7 access)",
      "Custom ETL integrations",
      "Priority Feature Requests",
      "Higher Rate Limits",
    ],
    buttonText: "Contact us",
    backgroundColor: "bg-purple-600",
    hoverBackgroundColor: "hover:bg-purple-500",
    textColor: "text-purple-600",
  },
];

const includedFeatures = [
  "API Authentication",
  "Custom Domains",
  "White labeled Helicone",
  "Per customer rate limiting",
  "Customer facing dashboards",
  "Billing APIs",
  "Custom cost calculations",
  "White glove onboarding",
];

export default function PricingPage() {
  return (
    <>
      <NavBarV2 />

      <div className="bg-white">
        <div className="relative isolate">
          <svg
            className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="abc"
                width={25}
                height={25}
                x="50%"
                y={-1}
                patternUnits="userSpaceOnUse"
              >
                <path d="M25 200V.5M.5 .5H200" fill="none" />
              </pattern>
              <defs>
                <pattern
                  id="123"
                  width="12.5"
                  height="12.5"
                  patternUnits="userSpaceOnUse"
                >
                  <path d="M12.5 0V12.5M0 12.5H12.5" fill="none" />
                </pattern>
              </defs>
            </defs>
            <rect width="100%" height="100%" strokeWidth={0} fill="url(#abc)" />
          </svg>
          <div className="flex flex-col mx-auto max-w-6xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiased text-center">
            <h1 className="text-4xl sm:text-6xl font-semibold leading-tight sm:leading-snug max-w-4xl mx-auto">
              Pricing that&apos;s{" "}
              <span className="md:border-2 border-emerald-500 border-dashed text-emerald-500 md:py-2 md:px-4">
                simple
              </span>
            </h1>
            <p className="mt-6 w-full text-xl leading-8 text-gray-700 max-w-2xl mx-auto">
              Free to get started, and easy to scale when you need to.
              We&apos;re here to help you grow at whatever stage you&apos;re at.
            </p>
          </div>
        </div>

        <div className="flow-root flex-col mx-auto max-w-6xl p-4 md:px-8 pb-24 sm:pb-32 lg:flex antialiased">
          <div className="isolate -mt-16 grid max-w-sm grid-cols-1 gap-y-16 divide-y divide-gray-200 sm:mx-auto lg:-mx-8 lg:mt-0 lg:max-w-none lg:grid-cols-3 lg:divide-x lg:divide-y-0 xl:-mx-14">
            {tiers.map((tier) => (
              <div key={tier.id} className="pt-16 lg:px-8 lg:pt-0 xl:px-14">
                <h3
                  id={tier.id}
                  className="text-base font-semibold leading-7 text-gray-900"
                >
                  {tier.name}
                </h3>
                {tier.price}
                <a
                  href={tier.href}
                  aria-describedby={tier.id}
                  className={clsx(
                    tier.backgroundColor,
                    tier.hoverBackgroundColor,
                    "mt-10 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-smfocus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  )}
                >
                  {tier.buttonText}
                </a>
                <p className="mt-10 text-sm font-semibold leading-6 text-gray-900 h-12">
                  {tier.description}
                </p>
                <ul
                  role="list"
                  className="mt-6 space-y-3 text-sm leading-6 text-gray-600"
                >
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckCircleIcon
                        className={clsx(tier.textColor, "h-6 w-5 flex-none")}
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
        <div className="mx-auto max-w-7xl px-6 lg:px-8 antialiased pb-24 sm:pb-32">
          <div className="bg-white mx-auto max-w-2xl rounded-3xl border border-gray-200 shadow-sm  lg:mx-0 lg:flex lg:items-center lg:max-w-none">
            <div className="p-8 sm:p-10 lg:flex-auto">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                Customer Portal
              </h3>
              <p className="mt-6 text-base leading-7 text-gray-600">
                Helicone&apos;s Customer Portal is a fully customizable
                customer-facing dashboard that allows your customers to interact
                with your API. It&apos;s a great way to show off your API&apos;s
                capabilities and build trust with your customers.
                <Link
                  href="https://docs.helicone.ai/features/customer_portal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 block w-56 rounded-md bg-black px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Learn more
                </Link>
              </p>
              <div className="mt-10 flex items-center gap-x-4">
                <h4 className="flex-none text-sm font-semibold leading-6 text-indigo-600">
                  What&apos;s included
                </h4>
                <div className="h-px flex-auto bg-gray-100" />
              </div>
              <ul
                role="list"
                className="mt-6 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-4"
              >
                {includedFeatures.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckCircleIcon
                      className="h-6 w-5 flex-none text-indigo-600"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className=" p-10 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
              <div className="rounded-2xl bg-indigo-50 shadow-sm py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                <div className="mx-auto max-w-xs px-8">
                  <p className="text-base font-semibold text-gray-600">
                    Starting at
                  </p>
                  <p className="mt-8 flex items-baseline justify-center gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-gray-900">
                      $799
                    </span>
                    <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">
                      /month
                    </span>
                  </p>
                  <Link
                    href="/sales?customer-portal=true"
                    rel="noopener noreferrer"
                    className="mt-8 block w-56 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Get started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
