"use client";

import Image from "next/image";
import Link from "next/link";

import EnterpriseCard from "../components/templates/pricing/EnterpriseCard";
import FreeCard from "../components/templates/pricing/FreeCard";
import ScaleCard from "../components/templates/pricing/ScaleCard";
import ProductComparisonTable from "../components/templates/pricing/ProductComparisonTable";

import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { Button } from "@/components/ui/button";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PricingComparisonTableV2 from "../components/templates/pricing/PricingComparisonTableV2";
import AddOnsTable from "../components/templates/pricing/AddOnsTable";

export default function Example() {
  return (
    <div className="bg-white text-slate-700">
      <div className=" mx-auto px-4 antialiased">
        <div className="flex flex-col max-w-6xl mx-auto p-4 pb-24 pt-8 sm:pb-32 lg:flex">
          <Col className="items-center">
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
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl pt-8 text-center text-slate-900">
              Find a plan that accelerates your business
            </h1>
            <p className="mt-4 w-full text-md sm:text-lg leading-7 max-w-xl text-center">
              Pricing that scales with you. Only pay for what you use.
            </p>
          </Col>

          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-16 max-w-[500px] lg:max-w-none lg:w-full items-center"
            id="plans"
          >
            <FreeCard />
            <ScaleCard />
            <EnterpriseCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 max-w-[500px] lg:max-w-none lg:w-full items-center">
            <div className=" h-[250px] w-full border lg:border-r-0 rounded-tl-xl rounded-tr-xl rounded-bl-none lg:rounded-tr-none lg:rounded-bl-xl border-slate-200">
              <Col className="h-full">
                <Col className=" py-[36px] px-[24px] justify-around h-full">
                  <p>
                    <b>386 hours</b> saved by using cached responses.
                  </p>
                  <div className="h-[43px] w-[175px]">
                    <Image
                      src={"/static/other-logos/decipher.png"}
                      alt={"dechipher ai"}
                      width={1000}
                      height={50}
                    />
                  </div>
                </Col>
                <Row className="w-full h-[72px] px-[24px] items-center justify-between border-t text-slate-900 font-medium border-slate-200">
                  <span>Free</span>
                  <Button variant={"outline"}>Start for Free</Button>
                </Row>
              </Col>
            </div>
            <div className="h-[280px] w-full rounded-none lg:rounded-xl border-brand border-2">
              <Col className="h-full">
                <Col className="py-[36px] px-[24px] justify-around h-full">
                  <h1 className="text-lg">
                    <b>2 days</b> saved combing through requests.
                  </h1>
                  <div className="h-[43px] w-[175px]">
                    <Image
                      src={"/static/greptile.webp"}
                      alt={"greptile ai"}
                      width={1000}
                      height={50}
                    />
                  </div>
                </Col>
                <Row className="w-full h-[97px] px-[24px] items-center justify-between border-t border-slate-200 text-slate-900 font-medium">
                  <span>Pro</span>
                  <Button className="bg-brand text-white font-bold">
                    Upgrade now
                  </Button>
                </Row>
              </Col>
            </div>
            <div className="h-[250px] w-full border border-slate-200 lg:border-l-0 rounded-bl-xl rounded-br-xl rounded-tr-none lg:rounded-tr-xl lg:rounded-br-xl lg:rounded-bl-none">
              <Col className="h-full">
                <Col className=" py-[36px] px-[24px] justify-around h-full">
                  <h1>
                    <b>Critical bug detected</b>, saved agent runtime by 30%.
                  </h1>
                  <div className="h-[43px] w-[175px]">
                    <Image
                      src={"/static/qawolf.webp"}
                      alt={"greptile ai"}
                      width={1000}
                      height={50}
                    />
                  </div>
                </Col>
                <Row className=" w-full h-[72px] px-[24px] items-center justify-between border-t border-slate-200 text-slate-900 font-medium">
                  <span>Enterprise</span>
                  <Button variant={"outline"}>Contact Sales</Button>
                </Row>
              </Col>
            </div>
          </div>
          <PricingComparisonTableV2 />
          <AddOnsTable />
          <ProductComparisonTable />

          <div className="py-10 sm:p-8 grid grid-cols-1 lg:grid-cols-12 bg-white rounded-md">
            <Col className="col-span-5">
              <span className="text-[36px] font-bold text-slate-900">
                Available <br />
                discounts
              </span>
              <Button
                asChild
                variant={"outline"}
                className="w-fit mt-4 text-slate-900 border-slate-200 shadow-none"
              >
                <Link href="/contact">Apply here</Link>
              </Button>
            </Col>
            <div className="py-[24px] col-span-7 ">
              <div className="grid grid-cols-1 sm:grid-cols-2 border divide-y divide-slate-200 rounded-lg divide-x border-slate-200">
                <div className="rounded-t-lg sm:rounded-tr-none p-[24px] flex flex-col border-t border-l border-r sm:border-r-0 border-slate-200">
                  <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px] text-slate-900">
                    Startups
                  </h3>
                  <p className="text-3xl font-bold mt-[32px] text-slate-900">
                    50%
                    <span className="text-sm font-normal text-slate-500">
                      {" "}
                      off first year
                    </span>
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    For most startups under 2 years old.
                  </p>
                </div>
                <div className="p-4 flex flex-col !border-r sm:rounded-tr-lg border-slate-200">
                  <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px] text-slate-900">
                    Non-profits
                  </h3>
                  <p className="text-3xl font-bold mt-[32px] text-slate-900">
                    Discounts
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Depending on your org size.
                  </p>
                </div>
                <div className="p-4 flex flex-col !border-b-0 !border-r sm:!border-b sm:!border-r-0 sm:rounded-bl-lg border-slate-200">
                  <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px] text-slate-900">
                    Open-source companies
                  </h3>
                  <p className="text-3xl font-bold mt-[32px] text-slate-900">
                    $100
                    <span className="text-sm font-normal text-slate-500">
                      {" "}
                      credit
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    For the first year.
                  </p>
                </div>
                <div className="p-4 flex flex-col !border-b !border-r rounded-b-lg sm:rounded-bl-none border-slate-200">
                  <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px] text-slate-900">
                    Students
                  </h3>
                  <p className="text-3xl font-bold mt-[32px] text-slate-900">
                    Free
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    For most students and educators.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="py-16 sm:p-8 flex flex-col sm:flex-row sm:justify-between">
            <div className="w-full sm:w-1/2">
              <h3 className="text-[36px] font-bold text-slate-900">
                Frequently <br />
                asked <br />
                questions
              </h3>
            </div>
            <div className="w-full sm:w-1/2 text-slate-900">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="font-medium">
                    Which Helicone plan is right for me?
                  </AccordionTrigger>
                  <AccordionContent>
                    If you have a production ready application and you are
                    looking to improve the quality and looking for an all-in-one
                    observability platform; choose the Pro plan. Exploring or
                    building a side project, the Free plan is a great start
                    before it grows into a larger project.
                    <br />
                    <br />
                    Security, on-prem, or extremely high usage, contact us for
                    custom Enterprise pricing.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="font-medium">
                    What are the limits for each plan?
                  </AccordionTrigger>
                  <AccordionContent>
                    For the Pro plan, you have access to 100k requests per month
                    and all features such as Playground, Cache, Exports, Evals
                    and more. You will also be able to enable Prompts and Alerts
                    as add-ons.
                    <br />
                    <br />
                    For the Free plan, you have access to 10k requests per month
                    for free and dashboard analytics.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="font-medium text-left">
                    I need more requests on the Free plan. What can I do?
                  </AccordionTrigger>
                  <AccordionContent>
                    You can switch to the Pro plan to keep logging after 10k
                    requests per month. Don’t worry, we are still logging all
                    your incoming requests, upgrade to Pro to view them. <br />
                    <br />
                    If you are already on the Pro plan, you will be
                    automatically charged for your usage over 100k requests per
                    month.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="font-medium">
                    Am I eligible for any discounts?
                  </AccordionTrigger>
                  <AccordionContent>
                    If you are a startup under 2 years old, a non-profit, an
                    open-source company or a student, you may be eligible for
                    discounts.{" "}
                    <Link
                      href="/contact"
                      className="underline hover:text-brand"
                    >
                      Contact us
                    </Link>
                    .
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="py-16 ">
            <div className="">
              <div className="lg:grid lg:grid-cols-3 lg:gap-8 items-center">
                <div className="bg-gray-50 rounded-lg p-8 col-span-1 lg:col-span-2">
                  <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                    Understand your AI
                    <span className="block text-brand">
                      performance bottleneck
                    </span>
                    with Helicone.
                  </h2>
                  <div className="mt-8 flex">
                    <div className="inline-flex rounded-md shadow">
                      <Link href="/signup">
                        <Button className="bg-brand hover:bg-[#0B94D3] text-white font-bold">
                          Start for free
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="mt-10 lg:mt-0 h-full">
                  <Col className="bg-white p-6 rounded-lg shadow h-full">
                    <h3 className="text-lg font-medium text-slate-900">
                      Helicone or LangSmith?
                    </h3>
                    <p className="mt-2 text-base text-slate-700">
                      More provider flexibility, cost-effective and transparent
                      (open-source).
                    </p>
                    <div className="mt-4 lg:mt-auto">
                      <Button
                        asChild
                        variant="outline"
                        className="text-slate-900 hover:text-brand"
                      >
                        <Link href="/blog/langsmith">
                          <BookOpenIcon className="w-4 h-4 mr-2" />
                          Read about key differences
                        </Link>
                      </Button>
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
