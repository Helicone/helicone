import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import Footer from "../../shared/layout/footer";
import NavBarV2 from "../../shared/layout/navbar/navBarV2";

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
      "Up to 100,000 requests per month",
      "Monitoring and Dashboards",
      "Custom Properties",
      "Basic Exporting",
      "5 Seats",
      "Unlimited Proxy Requests per minute",
      "1,000 logs per minute",
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
          / month per organization
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
      "Unlimited Proxy Requests per minute",
      "10,000 logs per minute",
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
      </div>
      <Footer />
    </>
  );
}
