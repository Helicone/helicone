"use client";

import {
  AcademicCapIcon,
  CheckIcon,
  CodeBracketIcon,
} from "@heroicons/react/20/solid";
import Image from "next/image";
import Link from "next/link";

import { HomeModernIcon } from "@heroicons/react/24/solid";
import EnterpriseCard from "../components/templates/pricing/EnterpriseCard";
import FreeCard from "../components/templates/pricing/FreeCard";
import PricingComparisonTable from "../components/templates/pricing/PricingComparisonTable";
import ScaleCard from "../components/templates/pricing/ScaleCard";
import ProductComparisonTable from "../components/templates/pricing/ProductComparisonTable";

import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { Button } from "@/components/ui/button";
import { BookOpenIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Example() {
  return (
    <div className="bg-white">
      <div className=" mx-auto px-4 antialiased text-black">
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
          {/* <div className="flex items-center gap-4 pt-4">
            <Link
              href="https://us.helicone.ai/signup?demo=true"
              className="bg-sky-500 hover:bg-sky-600 border-2 border-sky-700 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Get a demo
            </Link>
          </div> */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-16 max-w-[500px] lg:max-w-none lg:w-full">
            <FreeCard />
            <ScaleCard />
            <EnterpriseCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 border rounded-lg max-w-[500px] lg:max-w-none lg:w-full bg-[#F9F9F9]">
            <div className=" h-[250px] w-full ">
              <Col className="h-full">
                <Col className=" py-[36px] px-[24px]  gap-[24px]  h-full">
                  <div className="h-[43px] w-[175px]">
                    <Image
                      src={"/static/other-logos/decipher.png"}
                      alt={"dechipher ai"}
                      width={1000}
                      height={50}
                    />
                  </div>
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
                  <div className="h-[43px] w-[175px]">
                    <Image
                      src={"/static/greptile.webp"}
                      alt={"greptile ai"}
                      width={1000}
                      height={50}
                    />
                  </div>
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
                  <div className="h-[43px] w-[175px]">
                    {" "}
                    <Image
                      src={"/static/qawolf.webp"}
                      alt={"greptile ai"}
                      width={1000}
                      height={50}
                    />
                  </div>
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

          <div className="border grid grid-cols-1 lg:grid-cols-12 bg-white rounded-md">
            <div className="border col-span-5 p-[24px] font-bold">
              Also included
            </div>
            <div className="border col-span-7 p-[24px] grid grid-cols-2">
              {[
                "Playground",
                "SOC-2",
                "Cache stats",
                "3 month log retention",
                "Rate limit stats",
                "10 API calls per minute",
              ].map((item) => (
                <div
                  className="col-span-1 flex gap-[8px] p-[8px] items-center"
                  key={item}
                >
                  <CheckIcon className="w-5 h-5 text-[#6AA84F]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <ProductComparisonTable />

          <div className="py-10 grid grid-cols-1 lg:grid-cols-12 bg-white rounded-md">
            <Col className="col-span-5">
              <span className="text-[36px] font-bold">
                Available <br />
                discounts
              </span>
              <Link href="/contact">
                <Button variant={"outline"} className="w-fit mt-4">
                  Apply here
                </Button>
              </Link>
            </Col>
            <div className="py-[24px] col-span-7 ">
              <div className="grid grid-cols-2 border divide-y rounded-lg divide-x">
                <div className="rounded-lg p-[24px] flex flex-col ">
                  <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px]">
                    Startups
                  </h3>
                  <p className="text-3xl font-bold mt-[32px]">
                    50%
                    <span className="text-lg font-normal text-gray-500">
                      {" "}
                      off first year
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    For most startups under 2 years old.
                  </p>
                </div>
                <div className="p-4 flex flex-col">
                  <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px]">
                    Non-profits
                  </h3>
                  <p className="text-3xl font-bold mt-[32px]">Discounts</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Depending on your org size.
                  </p>
                </div>
                <div className="p-4 flex flex-col">
                  <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px]">
                    Open-source companies
                  </h3>
                  <p className="text-3xl font-bold mt-[32px]">
                    $5,000
                    <span className="text-lg font-normal text-gray-500">
                      {" "}
                      credit
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    For the first year.
                  </p>
                </div>
                <div className="p-4 flex flex-col">
                  <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px]">
                    Students
                  </h3>
                  <p className="text-3xl font-bold mt-[32px]">Free</p>
                  <p className="text-sm text-gray-500 mt-2">
                    For most students and educators.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="py-16 flex flex-row justify-between">
            <div className="w-1/2">
              <h3 className="text-[36px] font-bold">
                Frequently <br />
                asked <br />
                questions</h3>
            </div>
            <div className="w-1/2">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    Which Helicone plan is right for me?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes. It&apos;s right for you.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    What are the limits for each plan?
                  </AccordionTrigger>
                  <AccordionContent>
                    For the Developer plan, you have access to 10k free requests
                    and dashboard analytics. For the Team plan, you have access to
                    all features, such as Playground, Prompts, Exports, Evals and
                    more. For each feature, you will pay as you go.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    I went over my limits. What can I do?
                  </AccordionTrigger>
                  <AccordionContent>
                    You can switch to the Team plan. If you are already on the
                    Team plan, you will be automatically charged for your usage.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    Am I eligible for any discounts?
                  </AccordionTrigger>
                  <AccordionContent>
                    If you are a startup under 2 years old, a non-profit, an
                    open-source company or a student, you may be eligible for
                    discounts.{" "}
                    <a href="/contact" className="text-blue-600 hover:underline">
                      Apply here
                    </a>
                    .
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="py-16 ">
            <div className="">
              <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
                <div className="bg-gray-50 rounded-lg p-8">
                  <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Understand your AI
                    <span className="block text-[#0CA5EA]">
                      performance bottleneck
                    </span>
                    with Helicone.
                  </h2>
                  <div className="mt-8 flex">
                    <div className="inline-flex rounded-md shadow">
                      <Link href="/signup">
                        <Button className="bg-[#0CA5EA] hover:bg-[#0B94D3] text-white">
                          Start for free
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="mt-10 lg:mt-0 h-full">
                  <Col className="bg-white p-6 rounded-lg shadow h-full">
                    <h3 className="text-lg font-medium text-gray-900">
                      Helicone or LangSmith?
                    </h3>
                    <p className="mt-2 text-base text-gray-500">
                      More provider flexibility, cost-effective and transparent
                      (open-source).
                    </p>
                    <div className="mt-auto">
                      <Link href="/comparison">
                        <Button
                          variant="outline"
                          className="text-black hover:text-blue-500"
                        >
                          <BookOpenIcon className="w-4 h-4 mr-2" />
                          Read about key differences
                        </Button>
                      </Link>
                    </div>
                  </Col>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
