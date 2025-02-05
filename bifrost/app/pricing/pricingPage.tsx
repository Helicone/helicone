"use client";

import Image from "next/image";
import Link from "next/link";

import EnterpriseCard from "../components/templates/pricing/EnterpriseCard";
import FreeCard from "../components/templates/pricing/FreeCard";
import ScaleCard from "../components/templates/pricing/ScaleCard";
import ProductComparisonTable from "../components/templates/pricing/ProductComparisonTable";

import { Col } from "@/components/common/col";
import { Button } from "@/components/ui/button";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PricingComparisonTable from "../components/templates/pricing/PricingComparisonTable";
import TeamCard from "../components/templates/pricing/TeamCard";
import CustomerHighlights from "../components/templates/pricing/CustomerHighlights";
import AvailableDiscounts from "../components/templates/pricing/AvailableDiscounts";

export default function PricingPage() {
  return (
    <div className="bg-white text-slate-700">
      <div className=" mx-auto px-4 antialiased">
        <div className="flex flex-col max-w-6xl mx-auto p-4 pb-24 pt-8 sm:pb-32 lg:flex gap-24">
          <Col className="items-center gap-4">
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
              Simple, predictable pricing
            </h1>
            <p className="mt-4 w-full text-md sm:text-lg leading-7 max-w-xl text-center">
              Start for free, then choose a plan that grows with you
            </p>
          </Col>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
            id="plans"
          >
            <FreeCard />
            <ScaleCard />
            <TeamCard />
            <EnterpriseCard />
          </div>
          <CustomerHighlights />
          <PricingComparisonTable />
          <ProductComparisonTable />
          <AvailableDiscounts />

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
                  <AccordionContent className="text-slate-600 text-sm">
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
                  <AccordionContent className="text-slate-600 text-sm">
                    For the Pro plan, you have access to 10k requests per month
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
                  <AccordionContent className="text-slate-600 text-sm">
                    You can switch to the Pro plan to keep logging after 10k
                    requests per month. Don&apos;t worry, we are still logging
                    all your incoming requests, upgrade to Pro to view them.
                    <br />
                    <br />
                    If you are already on the Pro plan, you will be
                    automatically charged for your usage over 10k requests per
                    month.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="font-medium">
                    Am I eligible for any discounts?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-sm">
                    If you are a startup under 2 years old with &lt;$5m in
                    funding, a non-profit, an open-source company or a student,
                    you may be eligible for discounts.{" "}
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
