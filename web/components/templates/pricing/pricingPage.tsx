import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import Footer from "../../shared/layout/footer";
import NavBarV2 from "../../shared/layout/navbar/navBarV2";
import PremSupport from "./premSupport";

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
      "1 Organization",
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
      "Everything in Basic, plus essential tools for scaling up your business.",
    features: [
      "Unlimited Requests",
      "Bucket Caching",
      "User Management and Rate Limiting",
      "GraphQL API",
      "Request Retries",
      "Unlimited Organizations",
      "Up to 2GB of storage",
    ],
    buttonText: "Get started",
    backgroundColor: "bg-pink-600",
    hoverBackgroundColor: "hover:bg-pink-500",
    textColor: "text-pink-600",
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: "/sales",
    price: (
      <p className="mt-6 flex items-baseline gap-x-1">
        <span className="text-5xl font-bold tracking-tight text-gray-900">
          Custom
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

export default function PricingPage() {
  return (
    <>
      <NavBarV2 />
      <div className="bg-gray-50">
        <div className="flex flex-col mx-auto max-w-7xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiasing">
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Pricing thats{" "}
            <span className="bg-gradient-to-r from-sky-500 via-pink-500 to-violet-500 bg-[length:100%_4px] pb-1 bg-no-repeat bg-bottom">
              simple
            </span>
          </h1>
          <p className="mt-6 w-full text-xl leading-8 text-gray-700">
            No need to build or maintain expensive infrastructure. Helicone
            makes monitoring Large-Language Models easy.
          </p>
          <div className="mt-20 flow-root">
            <div className="isolate -mt-16 grid max-w-sm grid-cols-1 gap-y-16 divide-y divide-gray-300 divide-dashed sm:mx-auto lg:-mx-8 lg:mt-0 lg:max-w-none lg:grid-cols-3 lg:divide-x lg:divide-y-0 xl:-mx-14">
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
        <PremSupport />
      </div>
      <Footer />
    </>
  );
}
