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
          /month
        </span>
      </p>
    ),
    description: "Everything necessary to get started.",
    features: [
      "Up to 100,000 requests per month",
      "Monitoring and Dashboards",
      "Custom Properties",
      "Basic Exporting",
      "5 Seats",
      "Unlimited Proxy Requests",
      "10,000 logs per hour",
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
          $25
        </span>
        <span className="text-sm font-semibold leading-6 text-gray-600">
          /month
        </span>
      </p>
    ),
    description:
      "Everything in Free, plus essential tools for scaling up your business.",
    features: [
      "Unlimited Requests",
      "Bucket Caching",
      "User Management and Rate Limiting",
      "GraphQL API",
      "Request Retries",
      "Key Vault",
      "10 Seats",
      "Up to 2GB of storage",
      "Unlimited Proxy Requests",
      "50,000 logs per hour",
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
    ],
    buttonText: "Contact us",
    backgroundColor: "bg-purple-600",
    hoverBackgroundColor: "hover:bg-purple-500",
    textColor: "text-purple-600",
  },
];

const includedFeatures = [
  "Dedicated Discord or Slack channel",
  "Helm chart for easy deployment",
  "Priority feature requests",
  "Access to our support team",
  "Support for self-deployed Helicone instances",
  "Custom ETL integrations",
];
export default function PricingPage() {
  return (
    <>
      <NavBarV2 />
      <div className="bg-gray-50">
        <div className="flex flex-col mx-auto max-w-6xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiased">
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Pricing thats{" "}
            <span className="bg-gradient-to-r from-sky-500 via-pink-500 to-violet-500 bg-[length:100%_4px] pb-1 bg-no-repeat bg-bottom">
              simple
            </span>
          </h1>
          <p className="mt-6 w-full text-xl leading-8 text-gray-700 max-w-2xl">
            No need to build or maintain expensive infrastructure. Helicone
            makes monitoring Large-Language Models easy.
          </p>
          <div className="mt-20 flow-root">
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
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 antialiased pb-24 sm:pb-32">
          <div className="bg-white mx-auto max-w-2xl rounded-3xl border border-gray-200 shadow-sm sm:mt-20 lg:mx-0 lg:flex lg:items-center lg:max-w-none">
            <div className="p-8 sm:p-10 lg:flex-auto">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                Priority Support
              </h3>
              <p className="mt-6 text-base leading-7 text-gray-600">
                Using Helicone? Enjoy a dedicated Discord or Slack channel, an
                easy-to-use Helm chart, priority on feature requests, and expert
                support. We{"'"}ve got you covered for self-deployed instances
                and offer custom ETL integrations.
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
            <div className="-mt-2 p-10 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
              <div className="rounded-2xl bg-indigo-50 shadow-sm py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                <div className="mx-auto max-w-xs px-8">
                  <p className="text-base font-semibold text-gray-600">
                    Starting at
                  </p>
                  <p className="mt-8 flex items-baseline justify-center gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-gray-900">
                      $349
                    </span>
                    <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">
                      /month
                    </span>
                  </p>
                  <Link
                    href="https://buy.stripe.com/28o7t75VagBedEc005"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 block w-56 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Get Priority Support
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
