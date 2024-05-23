import { Fragment, useState } from "react";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  CodeBracketIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import NavBarV2 from "../../layout/navbar/navBarV2";
import Footer from "../../layout/footer";
import Link from "next/link";
import ContactForm from "../../shared/contactForm";
import Image from "next/image";

import {
  ChevronRightIcon,
  HomeModernIcon,
  TableCellsIcon,
} from "@heroicons/react/24/solid";
import { Disclosure } from "@headlessui/react";
import RequestLogTable, { HELICONE_LOG_PRICING } from "./requestLogTable";
import FeatureTable from "./featureTable";
import HcButton from "../../ui/hcButton";

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
  },
];

export default function Example() {
  const [requestLogs, setRequestLogs] = useState(0);
  const [promptCount, setPromptCount] = useState(0);
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

  const handlePromptCostCalculation = (currentPromptValue: number) => {
    const PRICE_PER_PROMPT = 5;

    return currentPromptValue * PRICE_PER_PROMPT;
  };

  const renderPromptCost = () => {
    if (promptCount <= 3) {
      return "Free";
    }
    if (promptCount >= 100) {
      return "Contact us for pricing";
    }

    return new Intl.NumberFormat("us", {
      style: "currency",
      currency: "USD",
    }).format(handlePromptCostCalculation(promptCount));
  };

  const handlePromptCountChange = (newValue: number) => {
    setPromptCount(newValue);
  };

  return (
    <div className="bg-[#f8feff]">
      <NavBarV2 />
      <div className="bg-[#f8feff] mx-auto px-4 antialiased">
        <div className="flex flex-col max-w-6xl mx-auto p-4 pb-24 pt-8 sm:pb-32 lg:flex">
          <span className="block sm:hidden">
            <Image
              src={"/assets/pricing/bouncing-cube.png"}
              alt={""}
              width={100}
              height={50}
            />
          </span>
          <span className="hidden sm:block">
            <Image
              src={"/assets/pricing/bouncing-cube.png"}
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
            <Link
              className="underline underline-offset-4 decoration-sky-300"
              // navigate to the pricing section
              href="#pricing"
            >
              usage-based pricing
            </Link>{" "}
            that scales with your business when you need it.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <Link
              href="/contact"
              className="bg-white hover:bg-gray-100 ease-in-out duration-500 text-black border-[3px] border-gray-300 rounded-lg px-4 py-2 text-sm font-bold shadow-lg flex w-fit items-center gap-1"
            >
              Get a demo
            </Link>
            {/* <Link
              href="/signup"
              className="bg-sky-500 hover:bg-sky-600 ease-in-out duration-500 text-white border-[3px] border-sky-700 rounded-lg pl-4 pr-2 py-2 text-sm font-bold shadow-lg flex w-fit items-center gap-1"
            >
              Start Building
              <ChevronRightIcon className="w-5 h-5 inline text-white" />
            </Link> */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
            {/* map over an array of 3 */}
            {TIERS.map((tier, index) => (
              <div className="w-full h-full border border-gray-300 rounded-xl flex flex-col space-y-4 p-8 bg-white">
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
                    <li className="flex items-center gap-4 py-2">
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

                <HcButton
                  variant={index === 1 ? "primary" : "secondary"}
                  size={"sm"}
                  title={tier.ctaCopy}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col max-w-6xl mx-auto space-y-8 py-4">
            <HcButton
              variant="light"
              size="lg"
              title="Compare Plans"
              icon={!showPlans ? ChevronDownIcon : ChevronUpIcon}
              onClick={() => {
                setShowPlans(!showPlans);
              }}
            />
            {showPlans && <FeatureTable />}
          </div>
          <div className="flex flex-col max-w-6xl mx-auto space-y-8 py-16 w-full">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight max-w-4xl pt-8">
              Available <span className=" text-sky-500">discounts</span>
            </h2>
            <ul className="grid grid-cols-4 gap-8">
              <li className="flex items-start gap-4 col-span-1 w-full">
                <div>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1 ml-2"
                  >
                    <g clipPath="url(#clip0_24_57)">
                      <rect
                        width="24"
                        height="24"
                        rx="5.4"
                        fill="#FF5100"
                      ></rect>
                      <rect
                        x="0.5"
                        y="0.5"
                        width="23"
                        height="23"
                        rx="4.9"
                        stroke="#FF844B"
                      ></rect>
                      <path
                        d="M7.54102 7.31818H9.28604L11.9458 11.9467H12.0552L14.715 7.31818H16.46L12.7662 13.5028V17.5H11.2349V13.5028L7.54102 7.31818Z"
                        fill="white"
                      ></path>
                    </g>
                    <rect
                      x="0.5"
                      y="0.5"
                      width="23"
                      height="23"
                      rx="4.9"
                      stroke="#FF5100"
                      strokeOpacity="0.1"
                    ></rect>
                    <rect
                      x="0.5"
                      y="0.5"
                      width="23"
                      height="23"
                      rx="4.9"
                      stroke="url(#paint0_radial_24_57)"
                    ></rect>
                    <defs>
                      <radialGradient
                        id="paint0_radial_24_57"
                        cx="0"
                        cy="0"
                        r="1"
                        gradientUnits="userSpaceOnUse"
                        gradientTransform="translate(7.35) rotate(58.475) scale(34.1384)"
                      >
                        <stop stopColor="white" stopOpacity="0.56"></stop>
                        <stop
                          offset="0.28125"
                          stopColor="white"
                          stopOpacity="0"
                        ></stop>
                      </radialGradient>
                      <clipPath id="clip0_24_57">
                        <rect
                          width="24"
                          height="24"
                          rx="5.4"
                          fill="white"
                        ></rect>
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="text-black font-semibold">YC Companies</h3>
                  <p className="text-gray-700 text-sm">
                    For companies in the current batch, we offer a $10,000
                    credit for the first year.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4 col-span-1 w-full">
                <div>
                  <HomeModernIcon className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="text-black font-semibold">
                    Startups / Non-Profits
                  </h3>
                  <p className="text-gray-700 text-sm">
                    For most startups under two years old and non-profits, we
                    offer 50% off for the first year.{" "}
                    <Link href="/contact" className="text-blue-500 underline">
                      Get in touch
                    </Link>{" "}
                    to learn more.
                  </p>
                </div>
              </li>{" "}
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
          </div>
        </div>

        {/* <div
          id="pricing"
          className="flex flex-col max-w-6xl mx-auto p-4 gap-2 pt-36"
        >
          <div className="text-2xl font-bold items-center flex gap-2">
            Transparent Pricing{" "}
          </div>
          <p className="mt-2 text-sm sm:text-md text-gray-700 max-w-xl">
            We charge like a utility - where you only pay for what you use and
            we make money through volume.
          </p>
          <div className="hidden sm:grid grid-cols-8 border-b-2 border-gray-300 pb-2 gap-8 pt-8">
            <div className="col-span-2"></div>
            <div className="col-span-4 text-black font-bold">Calculator</div>
            <div className="col-span-2 text-black font-bold justify-end w-full flex">
              Estimated
            </div>
          </div>
          <div className="grid grid-cols-8 py-2 gap-8 border-b-2 border-gray-300">
            <div className="col-span-6 sm:col-span-2 flex items-start order-1">
              <div className="flex items-center">
                <TableCellsIcon className="h-6 w-6 text-sky-600" />
                <span className="ml-2 font-semibold text-black text-lg tracking-wide">
                  Request Logs
                </span>
              </div>
            </div>
            <div className="col-span-8 sm:col-span-4 order-3 sm:order-2">
              <div className="w-full flex flex-col space-y-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-end gap-1">
                      <p className="font-semibold text-2xl">
                        {new Intl.NumberFormat("us", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                          .format(requestLogs)
                          .toString()}
                      </p>
                      <span className="text-xs text-gray-500 pb-1">
                        {" "}
                        requests / month
                      </span>
                    </div>

                    <div className="italic text-xs">
                      First 100k requests are free every month!
                    </div>
                  </div>

                  <Slider
                    min={100_000}
                    max={50_000_000}
                    exponent={3} // Adjust the exponent as needed for the scale you want
                    onChange={handleRequestLogChange}
                    labels={{
                      100000: "100k",
                      1_000_000: "1m",
                      5000000: "5m",
                      20000000: "20m",
                      50000000: "50m",
                    }}
                  />
                  <Disclosure as="div">
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="py-2 w-full mt-4">
                          <div className="flex w-full justify-end">
                            <div className="flex text-xs items-center italic text-gray-500">
                              How do we calculate this?
                              <ChevronRightIcon
                                className={clsx(
                                  open ? "rotate-90" : "rotate-0",
                                  "h-3 w-3 ml-2 transition duration-200 ease-in-out"
                                )}
                              />
                            </div>
                          </div>
                        </Disclosure.Button>
                        <Disclosure.Panel as="dd">
                          <RequestLogTable />
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                </div>
              </div>
            </div>
            <div className="col-span-2 order-2 sm:order-3 flex justify-end font-bold text-xl">
              {renderLogCost()}
            </div>
          </div>

          <div className="w-full justify-end flex items-center">
            <p className="text-xl font-bold">
              {new Intl.NumberFormat("us", {
                style: "currency",
                currency: "USD",
              })
                .format(
                  handleLogCostCalculation(requestLogs) +
                    handlePromptCostCalculation(promptCount)
                )
                .toString()}
            </p>{" "}
            <span className="text-gray-500 text-xs pt-1">/month</span>
          </div>
        </div>

        <div
          id="startup"
          className="flex flex-col max-w-6xl mx-auto p-4 lg:px-4 my-32 lg:flex antialiased"
        >
          <div className="flex flex-col md:flex-row gap-4 justify-between w-full py-4">
            <div className="flex flex-col w-full">
              <div className="text-2xl font-bold items-center flex gap-2">
                Helicone for{" "}
                <span className="text-sky-500 inline-flex items-center gap-1">
                  <HomeModernIcon className="h-6 w-6" /> Startups
                </span>
              </div>
              <p className="mt-2 text-sm sm:text-md text-gray-700 max-w-xl">
                If your startup is under two years old and has raised less than
                $5m, consider our startup program.
              </p>
              <div className="flex flex-col gap-4 w-full text-sm sm:text-md mt-8">
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
                      debugging, even getting data exports for fine-tuning 100x
                      easier. If you&apos;re serious about building with LLMs, I
                      am begging you to use Helicone.&quot;
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
          </div> */}
        {/* </div> */}
        {/* </div> */}
      </div>
      <Footer />
    </div>
  );
}
