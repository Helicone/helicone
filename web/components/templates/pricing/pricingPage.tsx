import { Fragment } from "react";
import { CheckCircleIcon, MinusIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import NavBarV2 from "../../layout/navbar/navBarV2";
import Footer from "../../layout/footer";
import Link from "next/link";
import { Tooltip } from "@mui/material";
import ContactForm from "../../shared/contactForm";
import Image from "next/image";
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  AccordionList,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import { ChevronRightIcon, TableCellsIcon } from "@heroicons/react/24/outline";
import { Disclosure } from "@headlessui/react";

const tiers = [
  {
    name: "Free",
    id: "tier-Free",
    href: "/signup",
    priceMonthly: "$0",
    text: "Try for free",
    description: "Everything necessary to get started",
    mostPopular: false,
  },
  {
    name: "Pro",
    id: "tier-Pro",
    href: "/signup",
    priceMonthly: "$80",
    text: "Get Started",
    description:
      "Everything in Free, plus essential tools for scaling up your business.",
    mostPopular: true,
  },
  {
    name: "Custom",
    id: "tier-Custom",
    href: "/contact",
    priceMonthly: "Enterprise",
    text: "Contact us",
    description:
      "Everything in Pro, plus features needed for larger enterprises.",
    mostPopular: false,
  },
];
const sections: {
  name: string;
  features: {
    name: string;
    tiers: Record<string, boolean | string>;
    href?: string;
  }[];
}[] = [
  {
    name: "Core Functionality",
    features: [
      {
        name: "Request Logs",
        tiers: {
          Free: "50,000 / mo",
          Pro: "500,000 / mo",
          Custom: "Unlimited",
        },
      },
      {
        name: "Dashboards",
        tiers: { Free: true, Pro: true, Custom: true },
      },
      {
        name: "Request Labeling / Tagging",
        tiers: { Free: true, Pro: true, Custom: true },
      },
      {
        name: "User Analytics",
        tiers: { Free: true, Pro: true, Custom: true },
      },
      {
        name: "SOC-2 Compliance",
        tiers: { Custom: true },
      },
      {
        name: "Self-Deployment Management",
        tiers: { Custom: true },
      },
      {
        name: "Organization Seats",
        tiers: {
          Free: "3 seats",
          Pro: "8 seats",
          Custom: "Unlimited",
        },
      },
    ],
  },
  {
    name: "Features",
    features: [
      {
        name: "Prompts",
        tiers: {
          Free: "1",
          Pro: "3 + 20$/prompt (max 10)",
          Custom: "prompt bulk pricing",
        },
      },
      {
        name: "Prompt Evaluation",
        tiers: {
          Free: false,
          Pro: "limited access",
          Custom: true,
        },
      },
      {
        name: "Caching",
        tiers: {
          Free: false,
          Pro: "100mb",
          Custom: "Unlimited",
        },
      },
      {
        name: "User Rate Limiting",
        tiers: {
          Free: true,
          Pro: true,
          Custom: true,
        },
      },
      {
        name: "Request Retries",
        tiers: {
          Free: true,
          Pro: true,
          Custom: true,
        },
      },
      {
        name: "Fine-Tuning",
        tiers: {
          Free: "1 model",
          Pro: "10 models",
          Custom: "Unlimited",
        },
      },
      {
        name: "Model Load Balancing",
        tiers: {
          Free: false,
          Pro: "2 models",
          Custom: "Unlimited",
        },
      },
      {
        name: "Key Vault",
        tiers: {
          Free: false,
          Pro: "5 keys",
          Custom: "Unlimited keys",
        },
      },
      {
        name: "Webhooks",
        tiers: {
          Custom: true,
        },
      },
      {
        name: "Customer Portal",
        href: "sales?customer-portal=true",
        tiers: {
          Custom: true,
        },
      },
    ],
  },
  {
    name: "Exporting and Integrations",
    features: [
      {
        name: "CSV Export",
        tiers: { Free: true, Pro: true, Custom: true },
      },
      {
        name: "GraphQL API",
        tiers: { Free: false, Pro: "100 reqs / minute", Custom: "Unlimited" },
      },
      {
        name: "Custom ETL Integrations",
        tiers: { Custom: true },
      },
    ],
  },
];

export default function Example() {
  return (
    <div className="bg-[#f8feff]">
      <NavBarV2 />
      <div className="bg-[#f8feff] mx-auto px-6 lg:px-8 antialiased">
        <div className="flex flex-col max-w-6xl mx-auto p-4 pb-24 pt-8 sm:pb-32 lg:flex">
          <Image
            src={"/assets/pricing/bouncing-cube.png"}
            alt={""}
            width={200}
            height={100}
          />
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-4xl pt-8">
            Pricing that&apos;s <span className=" text-sky-500">simple</span>
          </h1>
          <p className="mt-4 w-full text-md sm:text-lg leading-7 text-gray-700 max-w-xl">
            We offer a generous free tier and straightforward{" "}
            <button className="underline underline-offset-4 decoration-sky-300">
              usage-based pricing
            </button>{" "}
            for when you need more. No hidden fees, no surprises.
          </p>
        </div>

        <div className="flex flex-col max-w-6xl mx-auto p-4 gap-2">
          <div className="grid grid-cols-8 border-b-2 border-gray-300 pb-2 gap-8">
            <div className="col-span-2"></div>
            <div className="col-span-4 text-sky-500 font-bold">Calculator</div>
            <div className="col-span-2 text-sky-500 font-bold">
              Estimated Cost
            </div>
          </div>
          <div className="grid grid-cols-8 py-2 gap-8 border-b-2 border-gray-300">
            <div className="col-span-2 flex items-start">
              <TableCellsIcon className="h-6 w-6 text-sky-600" />
              <span className="ml-2 font-semibold text-black">
                Request Logs
              </span>
            </div>
            <div className="col-span-4">
              <div className="w-full flex flex-col space-y-4">
                {/* show an input slider */}
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-1">
                    <p className="font-semibold text-2xl">Logs: 342,432</p>
                    <div className="italic text-xs">
                      First 500k requests are free every month!
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="text-sky-500"
                  />
                  <Disclosure as="div">
                    <Disclosure.Button className="py-2 w-full">
                      <div className="flex w-full justify-end">
                        <div className="flex text-xs">
                          How do we calculate this?
                          <ChevronRightIcon className="h-3 w-3 ml-2" />
                        </div>
                      </div>
                    </Disclosure.Button>
                    <Disclosure.Panel className="text-gray-500" as="dd">
                      Yes! You can purchase a license that you can share with
                      your entire team.
                    </Disclosure.Panel>
                  </Disclosure>
                </div>
              </div>
            </div>
            <div className="col-span-2">Estimated Cost</div>
          </div>
          <div className="grid grid-cols-8 py-2 gap-8">
            <div className="col-span-2 flex items-start">
              <TableCellsIcon className="h-6 w-6 text-green-500" />
              <span className="ml-2 font-semibold text-black">
                Prompt Templates
              </span>
            </div>
            <div className="col-span-4">
              <div className="w-full flex flex-col space-y-4">
                {/* show an input slider */}
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-1">
                    <p className="font-semibold text-2xl">Prompts: 8</p>
                    <div className="italic text-xs">
                      Your first 3 prompts are free!
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="text-sky-500"
                  />
                  <Disclosure as="div">
                    <Disclosure.Button className="py-2 w-full">
                      <div className="flex w-full justify-end">
                        <div className="flex text-xs">
                          How do we calculate this?
                          <ChevronRightIcon className="h-3 w-3 ml-2" />
                        </div>
                      </div>
                    </Disclosure.Button>
                    <Disclosure.Panel className="text-gray-500" as="dd">
                      Yes! You can purchase a license that you can share with
                      your entire team.
                    </Disclosure.Panel>
                  </Disclosure>
                </div>
              </div>
            </div>
            <div className="col-span-2">Estimated Cost</div>
          </div>
        </div>

        {/* xs to lg */}
        <div className="mx-auto mt-4 max-w-md space-y-8 sm:mt-8 lg:hidden">
          {tiers.map((tier) => (
            <section
              key={tier.id}
              className={clsx(
                tier.mostPopular
                  ? "rounded-xl bg-gray-400/5 ring-1 ring-inset ring-gray-200"
                  : "",
                "p-8"
              )}
            >
              <h3
                id={tier.id}
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                {tier.name}
              </h3>
              <p className="mt-2 flex items-baseline gap-x-1 text-gray-900">
                <span className="text-4xl font-bold">{tier.priceMonthly}</span>
                <span className="text-sm font-semibold">/month</span>
              </p>
              <a
                href={tier.href}
                aria-describedby={tier.id}
                className={clsx(
                  tier.mostPopular
                    ? "bg-sky-600 text-white hover:bg-sky-500"
                    : "text-sky-600 ring-1 ring-inset ring-sky-200 hover:ring-sky-300",
                  "mt-8 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                )}
              >
                {tier.text}
              </a>
              <ul
                role="list"
                className="mt-10 space-y-4 text-sm leading-6 text-gray-900"
              >
                {sections.map((section) => (
                  <li key={section.name}>
                    <ul role="list" className="space-y-4">
                      {section.features.map((feature) =>
                        feature.tiers[tier.name] ? (
                          <li key={feature.name} className="flex gap-x-3">
                            <CheckCircleIcon
                              className="h-6 w-5 flex-none text-sky-600"
                              aria-hidden="true"
                            />
                            <span>
                              {feature.name}{" "}
                              {typeof feature.tiers[tier.name] === "string" ? (
                                <span className="text-sm leading-6 text-gray-500">
                                  ({feature.tiers[tier.name]})
                                </span>
                              ) : null}
                            </span>
                          </li>
                        ) : null
                      )}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* lg+ */}
        <div className="isolate mt-4 mb-32 hidden lg:block max-w-6xl mx-auto">
          <div className="relative">
            {tiers.some((tier) => tier.mostPopular) ? (
              <div className="absolute inset-x-4 inset-y-0 -z-10 flex">
                <div
                  className="flex w-1/4 px-4"
                  aria-hidden="true"
                  style={{
                    marginLeft: `${
                      (tiers.findIndex((tier) => tier.mostPopular) + 1) * 25
                    }%`,
                  }}
                >
                  <div className="w-full rounded-t-xl border-x border-t border-gray-900/10 bg-gray-400/5" />
                </div>
              </div>
            ) : null}
            <table className="w-full table-fixed border-separate border-spacing-x-8 text-left">
              <caption className="sr-only">Pricing plan comparison</caption>
              <colgroup>
                <col className="w-1/4" />
                <col className="w-1/4" />
                <col className="w-1/4" />
                <col className="w-1/4" />
              </colgroup>
              <thead>
                <tr>
                  <td />
                  {tiers.map((tier) => (
                    <th
                      key={tier.id}
                      scope="col"
                      className="px-6 pt-6 xl:px-8 xl:pt-8"
                    >
                      <div className="text-sm font-semibold leading-7 text-gray-900">
                        {tier.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">
                    <span className="sr-only">Price</span>
                  </th>
                  {tiers.map((tier) => (
                    <td key={tier.id} className="px-6 pt-2 xl:px-8">
                      <div className="flex items-baseline gap-x-1 text-gray-900">
                        <span className="text-4xl font-bold">
                          {tier.priceMonthly}
                        </span>
                        {tier.name !== "Custom" && (
                          <span className="text-sm font-semibold leading-6">
                            /month
                          </span>
                        )}
                      </div>
                      <a
                        href={tier.href}
                        className={clsx(
                          tier.mostPopular
                            ? "bg-sky-600 text-white hover:bg-sky-500"
                            : "text-sky-600 ring-1 ring-inset ring-sky-200 hover:ring-sky-300",
                          "mt-8 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                        )}
                      >
                        {tier.text}
                      </a>
                    </td>
                  ))}
                </tr>
                {sections.map((section, sectionIdx) => (
                  <Fragment key={section.name}>
                    <tr>
                      <th
                        scope="colgroup"
                        colSpan={4}
                        className={clsx(
                          sectionIdx === 0 ? "pt-8" : "pt-16",
                          "pb-4 text-sm font-semibold leading-6 text-gray-900"
                        )}
                      >
                        {section.name}
                        <div className="absolute inset-x-8 mt-4 h-px bg-gray-900/10" />
                      </th>
                    </tr>
                    {section.features.map((feature) => (
                      <tr key={feature.name}>
                        <th
                          scope="row"
                          className="py-4 text-sm font-normal leading-6 text-gray-900"
                        >
                          {feature.href ? (
                            <Tooltip
                              title="Share your Helicone dashboards with your customers"
                              placement="top"
                            >
                              <Link href={feature.href} className="underline">
                                {feature.name}
                              </Link>
                            </Tooltip>
                          ) : (
                            <>
                              {feature.name}
                              <div className="absolute inset-x-8 mt-4 h-px bg-gray-900/5" />
                            </>
                          )}
                        </th>
                        {tiers.map((tier) => (
                          <td key={tier.id} className="px-6 py-4 xl:px-8">
                            {typeof feature.tiers[tier.name] === "string" ? (
                              <div className="text-center text-sm leading-6 text-gray-500">
                                {feature.tiers[tier.name]}
                              </div>
                            ) : (
                              <>
                                {feature.tiers[tier.name] === true ? (
                                  <CheckCircleIcon
                                    className="mx-auto h-5 w-5 text-sky-600"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <MinusIcon
                                    className="mx-auto h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                  />
                                )}

                                <span className="sr-only">
                                  {feature.tiers[tier.name] === true
                                    ? "Included"
                                    : "Not included"}{" "}
                                  in {tier.name}
                                </span>
                              </>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div
          id="startup"
          className="flex flex-col max-w-6xl mx-auto p-4 lg:px-8 mt-8 mb-32 lg:flex antialiased"
        >
          <div className="border border-gray-300 rounded-lg shadow-lg p-6 sm:p-12">
            <div className="flex flex-col md:flex-row gap-4 justify-between w-full py-4">
              <div className="flex flex-col w-full">
                <section className="font-semibold text-3xl sm:text-4xl">
                  Helicone for{" "}
                  <span className="md:border border-sky-600 border-dashed text-sky-600 md:py-1 md:px-2">
                    startups
                  </span>
                </section>
                <p className="mt-4 text-sm sm:text-lg text-gray-700">
                  If your startup is under two years old and has raised less
                  than $5m, consider our startup program.
                </p>
                <p className="mt-8 text-sm sm:text-md font-semibold text-gray-700">
                  Benefits
                </p>
                <div className="flex flex-col gap-4 w-full text-sm sm:text-md mt-4">
                  <div className="flex items-center gap-4 col-span-1">
                    <CheckCircleIcon
                      className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600"
                      aria-hidden="true"
                    />
                    Discount on Pro plan
                  </div>
                  <div className="flex items-center gap-4 col-span-1">
                    <CheckCircleIcon
                      className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600"
                      aria-hidden="true"
                    />
                    Customer Success Channel
                  </div>
                  <div className="flex items-center gap-4 col-span-1">
                    <CheckCircleIcon
                      className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600"
                      aria-hidden="true"
                    />
                    Helicone Merch
                  </div>
                  <div className="flex items-center gap-4 col-span-1">
                    <CheckCircleIcon
                      className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600"
                      aria-hidden="true"
                    />
                    Startup Spotlight
                  </div>
                  <figure className="mt-8 sm:mt-8 border-l border-gray-200 pl-4 pr-4 sm:pl-8 sm:pr-16 text-gray-600">
                    <blockquote className="text-xs sm:text-base leading-7">
                      <p>
                        &quot;It makes everything from tracking usage, to
                        debugging, even getting data exports for fine-tuning
                        100x easier. If you&apos;re serious about building with
                        LLMs, I am begging you to use Helicone.&quot;
                      </p>
                    </blockquote>
                    <figcaption className="mt-6 flex gap-x-4 text-xs sm:text-sm leading-6 items-center">
                      <img
                        src="/assets/pricing/daksh.png"
                        alt=""
                        className="h-8 w-8 flex-none rounded-full"
                      />
                      <div>
                        <span className="font-semibold text-gray-900">
                          Daksh Gupta
                        </span>{" "}
                        – Founder of{" "}
                        <Link
                          href={"https://app.getonboardai.com/"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Onboard AI
                        </Link>
                      </div>
                    </figcaption>
                  </figure>
                </div>
              </div>

              <div className="w-full -mt-8">
                <ContactForm
                  contactTag={"startups"}
                  buttonText={"Contact Us"}
                  defaultPlaceholder="I am interested in the Helicone startup program..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
