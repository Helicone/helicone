"use client";

import { Fragment, useState } from "react";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CodeBracketIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import Image from "next/image";

import { HomeModernIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { clsx } from "@/components/shared/utils";
import RequestLogTable, {
  HELICONE_LOG_PRICING,
} from "@/components/templates/pricing/requestLogTable";
import FeatureTable from "@/components/templates/pricing/featureTable";

const Slider = ({
  min,
  max,
  exponent,
  onChange,
  color = "purple",
  labels,
}: {
  min: number;
  max: number;
  exponent: number;
  onChange: (value: number) => void;
  color?: string;
  labels?: Record<string, string>;
}) => {
  // This function converts the slider's linear value to an exponential value.
  const toExponentialValue = (linearValue: number) => {
    return Math.pow(linearValue / max, exponent) * (max - min) + min;
  };

  // This function converts an exponential value to the slider's linear value.
  const toLinearValue = (exponentialValue: number) => {
    return Math.pow((exponentialValue - min) / (max - min), 1 / exponent) * max;
  };

  // Initialize the slider's value using the inverse transformation function.
  const [sliderValue, setSliderValue] = useState(toLinearValue(min));

  const handleSliderChange = (e: any) => {
    const linearValue = e.target.value;
    setSliderValue(linearValue);
    const expValue = toExponentialValue(linearValue);
    onChange(expValue);
  };

  // Calculate the offset for a label based on its value
  const calculateOffset = (value: number) => {
    const linearValue = toLinearValue(value);
    const percentage = ((linearValue - min) / (max - min)) * 100;
    return `${percentage}%`;
  };
  return (
    <div className="slider-container relative my-4">
      <input
        type="range"
        min={0}
        max={max}
        value={sliderValue}
        onChange={handleSliderChange}
        className="w-full"
      />
      {labels && (
        <div className="relative w-full flex justify-between">
          {/* Map through the labels and create a div for each */}
          {Object.entries(labels).map(([key, text], idx) => (
            <button
              key={key}
              className={clsx(
                toExponentialValue(sliderValue) >= Number(key)
                  ? "font-bold text-black"
                  : "text-gray-500",
                "absolute text-xs"
              )}
              onClick={() => {
                setSliderValue(toLinearValue(Number(key)));
                onChange(Number(key));
              }}
              style={{
                left: `calc(${calculateOffset(Number(key))} - ${
                  idx * 0.25
                }rem)`,
              }}
            >
              {text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TIERS: {
  name: string;
  ctaCopy: string;
  features: {
    name: string;
    included: boolean | string;
  }[];
  href: string;
}[] = [
  {
    name: "Free",
    ctaCopy: "Start building for free",
    features: [
      { name: "Observability and Analytics", included: true },
      { name: "Core Tooling", included: true },
      { name: "Prompt Templates", included: true },
      { name: "Limited Prompt Experiments", included: true },
      { name: "SOC-2 Compliance", included: false },
      { name: "On-Prem Deployment", included: false },
    ],
    href: "https://us.helicone.ai/signup",
  },
  {
    name: "Growth",
    ctaCopy: "Get started for free",
    features: [
      { name: "Observability and Analytics", included: true },
      { name: "Feature-Rich Tooling", included: true },
      { name: "Prompt Templates", included: true },
      { name: "Prompt Experiments", included: true },
      { name: "SOC-2 Compliance", included: false },
      { name: "On-Prem Deployment", included: false },
    ],
    href: "https://us.helicone.ai/signup",
  },
  {
    name: "Enterprise",
    ctaCopy: "Get in touch",
    features: [
      { name: "Observability and Analytics", included: true },
      { name: "Feature-Rich Tooling", included: true },
      { name: "Prompt Templates", included: true },
      { name: "Prompt Experiments", included: true },
      { name: "SOC-2 Compliance", included: true },
      { name: "On-Prem Deployment", included: true },
    ],
    href: "/contact",
  },
];

export default function Example() {
  const [requestLogs, setRequestLogs] = useState(0);
  const [showPlans, setShowPlans] = useState(false);

  const handleRequestLogChange = (newValue: any) => {
    setRequestLogs(newValue);
  };

  const handleLogCostCalculation = (currentLogValue: number) => {
    // calculate the estimated cost for the `currentValue` using tax brackets
    const calculateCost = (currentValue: number) => {
      let cost = 0;
      let remainingValue = currentValue;
      for (const pricing of HELICONE_LOG_PRICING) {
        const logCount = Math.min(
          pricing.upper - pricing.lower,
          remainingValue
        );
        cost += logCount * pricing.rate;
        remainingValue -= logCount;
        if (remainingValue <= 0) {
          break;
        }
      }
      return cost;
    };

    return calculateCost(currentLogValue);
  };

  const renderLogCost = () => {
    if (requestLogs <= 100_000) {
      return "$0.00";
    }
    if (requestLogs >= 50_000_000) {
      return "Contact us for pricing";
    }

    return new Intl.NumberFormat("us", {
      style: "currency",
      currency: "USD",
    }).format(handleLogCostCalculation(requestLogs));
  };

  return (
    <div className="bg-[#f8feff]">
      <div className="bg-[#f8feff] mx-auto px-4 antialiased text-black">
        <div className="flex flex-col max-w-6xl mx-auto p-4 pb-24 pt-8 sm:pb-32 lg:flex">
          <span className="block sm:hidden">
            <Image
              src={"/static/pricing/bouncing-cube.png"}
              alt={""}
              width={100}
              height={50}
            />
          </span>
          <span className="hidden sm:block">
            <Image
              src={"/static/pricing/bouncing-cube.png"}
              alt={""}
              width={200}
              height={100}
            />
          </span>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-4xl pt-8">
            Pricing that&apos;s <span className=" text-sky-500">simple</span>
          </h1>
          <p className="mt-4 w-full text-md sm:text-lg leading-7 text-gray-700 max-w-xl">
            Only pay for what you use. We offer{" "}
            <span className="underline underline-offset-4 decoration-sky-300">
              usage-based pricing
            </span>{" "}
            that scales with your business when you need it.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <Link
              href="/contact"
              className="bg-sky-500 hover:bg-sky-600 border-2 border-sky-700 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Get a demo
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-16">
            {/* map over an array of 3 */}
            {TIERS.map((tier, index) => (
              <div
                key={tier.name}
                className="w-full h-full border border-gray-300 rounded-xl flex flex-col space-y-4 p-8 bg-white"
              >
                <h2 className="text-sm font-semibold">{tier.name}</h2>
                <div className="flex items-baseline space-x-1">
                  {tier.name === "Free" && (
                    <>
                      <p className="text-3xl font-semibold">$0.00</p>
                      <p className="text-sm text-gray-500">/month</p>
                    </>
                  )}
                  {tier.name === "Growth" && (
                    <>
                      <p className="text-3xl font-semibold">
                        {renderLogCost()}
                      </p>
                      <p className="text-sm text-gray-500">/month</p>
                    </>
                  )}
                  {tier.name === "Enterprise" && (
                    <>
                      <p className="text-3xl font-semibold">Get in touch</p>
                    </>
                  )}
                </div>
                {tier.name === "Free" && (
                  <div className="h-32 border-t border-b border-gray-100 flex items-center w-full justify-center">
                    <p className="text-center font-medium text-gray-500 px-4">
                      Free for up to 100k requests per month
                    </p>
                  </div>
                )}
                {tier.name === "Growth" && (
                  <div className="h-32 border-t border-b border-gray-100 flex items-center w-full">
                    <div className="py-4 w-full">
                      <p className="text-xs text-black font-semibold">
                        {new Intl.NumberFormat("us", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(requestLogs)}
                        <span className="text-gray-500 font-normal">
                          {" "}
                          requests / month
                        </span>
                      </p>
                      <Slider
                        min={0}
                        max={10_000_000}
                        exponent={3} // Adjust the exponent as needed for the scale you want
                        onChange={handleRequestLogChange}
                        labels={{
                          0: "0",
                          100_000: "100k",
                          1_000_000: "1m",
                          3_500_000: "3.5m",
                          10_000_000: "10m",
                        }}
                      />
                    </div>
                  </div>
                )}
                {tier.name === "Enterprise" && (
                  <div className="h-32 border-t border-b border-gray-100 flex items-center w-full justify-center">
                    <p className="text-center font-medium text-gray-500 px-4">
                      Contact us for a tailored plan for your business
                    </p>
                  </div>
                )}

                <ul className="text-gray-500 text-sm">
                  {tier.features.map((feature) => (
                    <li
                      className="flex items-center gap-4 py-2"
                      key={feature.name}
                    >
                      {feature.included === true ? (
                        <CheckCircleIcon className="h-5 w-5 text-sky-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-gray-300" />
                      )}
                      <span className="">
                        {feature.name}{" "}
                        {typeof feature.included === "string" &&
                          `(${feature.included})`}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className={clsx(
                    "w-full flex items-center justify-center gap-2",
                    tier.name === "Growth"
                      ? "bg-sky-500 hover:bg-sky-600 border-2 border-sky-700 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                      : "bg-white hover:bg-gray-100 ease-in-out duration-500 text-black border-[3px] border-gray-300 rounded-lg px-4 py-2 text-sm font-bold shadow-lg flex w-full justify-center text-center items-center gap-1"
                  )}
                >
                  {tier.ctaCopy}
                </Link>
              </div>
            ))}
          </div>
          <div className="flex flex-col max-w-6xl mx-auto space-y-8 py-4 w-full">
            <button
              onClick={() => {
                setShowPlans(!showPlans);
              }}
              className="text-sky-500 w-fit flex items-center gap-2 mx-auto"
            >
              {!showPlans ? (
                <ChevronDownIcon className="h-6 w-6 text-sky-500" />
              ) : (
                <ChevronUpIcon className="h-6 w-6 text-sky-500" />
              )}
              Show More Info
            </button>

            {showPlans && (
              <>
                <div className="flex flex-col space-y-2">
                  <p className="text-xs text-gray-700 font-semibold">
                    Request Log Table Rates
                  </p>
                  <RequestLogTable />
                </div>

                <FeatureTable />
              </>
            )}
          </div>
          <div className="flex flex-col max-w-6xl mx-auto space-y-8 py-16 w-full">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight max-w-4xl pt-8">
              Available <span className=" text-sky-500">discounts</span>
            </h2>
            <ul className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <li className="flex items-start gap-4 col-span-1 w-full">
                <div>
                  <HomeModernIcon className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="text-black font-semibold">Startups</h3>
                  <p className="text-gray-700 text-sm">
                    For most startups under two years old, we offer 50% off for
                    the first year.
                  </p>
                </div>
              </li>{" "}
              <li className="flex items-start gap-4 col-span-1 w-full">
                <div>
                  <HomeModernIcon className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="text-black font-semibold">Non-Profits</h3>
                  <p className="text-gray-700 text-sm">
                    For most non-profits, we offer large discounts depending on
                    organization size.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4 col-span-1 w-full">
                <div>
                  <CodeBracketIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="text-black font-semibold">
                    Open-Source Companies
                  </h3>
                  <p className="text-gray-700 text-sm">
                    For fellow open-source companies, we offer a $5,000 credit
                    for the first year.
                  </p>
                </div>
              </li>{" "}
              <li className="flex items-start gap-4 col-span-1 w-full">
                <div>
                  <AcademicCapIcon className="h-6 w-6 text-black" />
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="text-black font-semibold">Students</h3>
                  <p className="text-gray-700 text-sm">
                    For most students and educators, we provide Helicone free of
                    charge.
                  </p>
                </div>
              </li>{" "}
            </ul>
            <div className="flex items-center justify-center">
              <Link
                href="/contact"
                className="bg-white hover:bg-gray-100 ease-in-out duration-500 text-black border-[3px] border-gray-300 rounded-lg px-4 py-2 text-sm font-bold shadow-lg flex w-fit items-center gap-1"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
