"use client";

import { Fragment, useState } from "react";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  CheckIcon,
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
import ScaleCard from "../components/templates/pricing/ScaleCard";
import FreeCard from "../components/templates/pricing/FreeCard";
import EnterpriseCard from "../components/templates/pricing/EnterpriseCard";
import PricingComparisonTable from "../components/templates/pricing/PricingComparisonTable";

import { renderLogCost } from "@/app/utils/pricingUtils";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";

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

export default function Example() {
  const [showPlans, setShowPlans] = useState(false);

  return (
    <div className="bg-[#f8feff]">
      <div className="bg-[#f8feff] mx-auto px-4 antialiased text-black">
        <div className="flex flex-col max-w-6xl mx-auto p-4 pb-24 pt-8 sm:pb-32 lg:flex">
          <span className="block sm:hidden">
            <Image
              src={"/static/pricing/bouncing-cube.webp"}
              alt={"bouncing-cube"}
              width={100}
              height={50}
            />
          </span>
          <span className="hidden sm:block">
            <Image
              src={"/static/pricing/bouncing-cube.webp"}
              alt={"bouncing-cube"}
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
              href="https://us.helicone.ai/signup?demo=true"
              className="bg-sky-500 hover:bg-sky-600 border-2 border-sky-700 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Get a demo
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-16 max-w-[500px] lg:max-w-none lg:w-full">
            <FreeCard />
            <ScaleCard />
            <EnterpriseCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 border rounded-lg max-w-[500px] lg:max-w-none lg:w-full bg-[#F9F9F9]">
            <div className=" h-[250px] w-full ">
              <Col className="h-full">
                <Col className=" py-[36px] px-[24px]  gap-[24px]  h-full">
                  <div className="bg-blue-100 h-[43px] w-[175px]">LOGO</div>
                  <h1>
                    <b>386 hours</b> saved by using cached responses.
                  </h1>
                </Col>
                <Row className=" w-full h-[72px] px-[24px] items-center justify-between border-t">
                  <span>Developer</span>
                  <Button variant={"outline"}>Start for Free</Button>
                </Row>
              </Col>
            </div>
            <div className="bg-white h-[250px] w-full rounded-lg  border-[#0CA5EA] border-2">
              <Col className="h-full">
                <Col className=" py-[36px] px-[24px] gap-[24px] h-full">
                  <div className="bg-blue-100 h-[43px] w-[175px]">LOGO</div>
                  <h1>
                    <b>2 days</b> saved combing through requests.
                  </h1>
                </Col>
                <Row className=" w-full h-[72px] px-[24px] items-center justify-between border-t">
                  <span>Scale</span>
                  <Button className="bg-[#0CA5EA] text-white">
                    Upgrade now
                  </Button>
                </Row>
              </Col>
            </div>
            <div className="h-[250px] w-full">
              <Col className="h-full">
                <Col className=" py-[36px] px-[24px] gap-[24px] h-full">
                  <div className="bg-blue-100 h-[43px] w-[175px]">LOGO</div>
                  <h1>
                    <b>Critical bug detected</b>, saved agent runtime by 30%.
                  </h1>
                </Col>
                <Row className=" w-full h-[72px] px-[24px] items-center justify-between border-t">
                  <span>Enterprise</span>
                  <Button variant={"outline"}>Contact Sales</Button>
                </Row>
              </Col>
            </div>
          </div>

          <PricingComparisonTable />

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
