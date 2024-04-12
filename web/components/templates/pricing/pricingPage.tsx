import { Fragment, useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
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
                "absolute text-md"
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

export default function Example() {
  const [requestLogs, setRequestLogs] = useState(100_000);
  const [promptCount, setPromptCount] = useState(0);

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
      return "Free";
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
            <Link
              href="/signup"
              className="bg-sky-500 hover:bg-sky-600 ease-in-out duration-500 text-white border-[3px] border-sky-700 rounded-lg pl-4 pr-2 py-2 text-sm font-bold shadow-lg flex w-fit items-center gap-1"
            >
              Start Building
              <ChevronRightIcon className="w-5 h-5 inline text-white" />
            </Link>
          </div>
        </div>
        <FeatureTable />
        <div
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
          {/* <div className="grid grid-cols-8 py-2 gap-4 sm:gap-8 border-b-2 border-gray-300">
            <div className="col-span-6 md:col-span-2 order-1 flex items-start">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-sky-600" />
                <span className="ml-2 font-semibold text-black text-lg tracking-wide w-full">
                  Prompt Templates
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
                          .format(promptCount)
                          .toString()}
                      </p>
                      <span className="text-xs text-gray-500 pb-1">
                        {" "}
                        prompts / month
                      </span>
                    </div>

                    <div className="italic text-xs">
                      First 3 prompts are free!
                    </div>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    exponent={1}
                    color="green"
                    onChange={handlePromptCountChange}
                    labels={{
                      0: "0",
                      25: "25",
                      50: "50",
                      75: "75",
                      100: "100+",
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
                          <p className="text-right text-sm pb-4">
                            We charge $5 per prompt after the first 3 prompts.
                          </p>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                </div>
              </div>
            </div>
            <div className="col-span-2 order-2 sm:order-3 md:col-span-2 flex justify-end font-bold text-xl">
              {renderPromptCost()}
            </div>
          </div> */}
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
          </div>
          {/* <div className="border border-gray-300 rounded-lg shadow-lg p-6 sm:p-12">
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
          </div> */}
        </div>
      </div>
      <Footer />
    </div>
  );
}
