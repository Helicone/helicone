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
import Companies from "@/components/home/Companies";

export default function PricingPage() {
  return (
    <div className="bg-background text-slate-700">
      <div className="mx-auto antialiased">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 p-4 pb-24 pt-8 sm:pb-32 md:gap-16 lg:flex">
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
            <h1 className="text-accent-foreground max-w-2xl text-center text-3xl font-bold tracking-tight sm:text-5xl md:pt-8">
              Simple, predictable pricing
            </h1>
            <p className="text-md text-muted-foreground w-full max-w-xl text-center leading-7 sm:text-lg md:mt-4">
              Built to scale with you. Only pay for what you use.
            </p>
          </Col>

          <div
            className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
            id="plans"
          >
            <FreeCard />
            <ScaleCard />
            <TeamCard />
            <EnterpriseCard />
          </div>

          <div className="mt-4 flex flex-col items-center justify-center gap-4">
            <h2 className="text-sidebar-foreground text-center text-xl font-semibold leading-8">
              Powering leading companies
              <br />
              <span className="text-muted-foreground">
                from next-gen startups to enterprise
              </span>
            </h2>
            <Companies className="w-full" />
          </div>

          <CustomerHighlights />

          <PricingComparisonTable />
          <AvailableDiscounts />
          <ProductComparisonTable />

          <div className="flex flex-col py-16 sm:flex-row sm:justify-between sm:p-8">
            <div className="w-full sm:w-1/2">
              <h3 className="text-[36px] font-bold text-slate-900">
                Frequently asked <br />
                questions
              </h3>
            </div>
            <div className="text-accent-foreground w-full sm:w-1/2">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left font-medium">
                    What do I get with the free plan?
                  </AccordionTrigger>
                  <AccordionContent className="accordion-content-style">
                    The free plan gives you everything you need to get started.
                    This includes full visibility into your LLM requests,
                    response times, detailed usage metrics, and useful toolings
                    like Sessions and Prompt Editor. It&apos;s perfect for
                    testing and building early versions of your AI app - without
                    needing a credit card.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left font-medium">
                    How is Helicone&apos;s usage-based pricing calculated?
                  </AccordionTrigger>
                  <AccordionContent className="accordion-content-style">
                    Helicone&apos;s usage-based pricing is calculated based on
                    the number of requests you make to our API. You can find the
                    rate per log under &quot;Additional logs&quot; in the table
                    above.
                    <br />
                    <br />
                    You can also find your monthly usage in the{" "}
                    <Link
                      href="https://us.helicone.ai/settings/billing"
                      className="hover:text-brand underline"
                    >
                      Billing
                    </Link>{" "}
                    page in product.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left font-medium">
                    What happens if I exceed my request limit?
                  </AccordionTrigger>
                  <AccordionContent className="accordion-content-style">
                    On the Free plan, you can view up to 10,000 requests per
                    month in Helicone. Don&apos;t worry, we are still logging
                    all your incoming requests in the background. To access
                    them, you can upgrade to the Pro plan at any time.
                    <br />
                    <br />
                    If you are on the Pro or Team plan, any usage beyond 10,000
                    requests per month will be automatically billed.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left font-medium">
                    Can I switch plans or cancel anytime?
                  </AccordionTrigger>
                  <AccordionContent className="accordion-content-style">
                    Yes! You can switch plans or cancel anytime - no lock-ins or
                    long-term commitments. You can manage your plan directly in
                    the{" "}
                    <Link
                      href="https://us.helicone.ai/settings/billing"
                      className="hover:text-brand underline"
                    >
                      Billing
                    </Link>{" "}
                    page.
                    <br />
                    <br />
                    For advanced needs like on-prem deployment, custom SLAs, or
                    additional security requriements,{" "}
                    <Link
                      href="/contact"
                      className="hover:text-brand underline"
                    >
                      contact us
                    </Link>{" "}
                    about a custom Enterprise plan.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left font-medium">
                    Does Helicone work with my LLM provider?
                  </AccordionTrigger>
                  <AccordionContent className="accordion-content-style">
                    Yes! Helicone works seamlessly with most major LLM providers
                    out of the box, including OpenAI, Anthropic, Gemini, Vercel
                    AI SDK, Azure, AWS Bedrock, OpenRouter, LangChain, Groq,
                    LiteLLM, and more. Just update your base URL and add our API
                    key.
                    <br />
                    <br />
                    If you are using a custom model or a less-known provider,
                    Helicone can still support it with a simple proxy setup. See
                    our{" "}
                    <Link
                      href="https://docs.helicone.ai/getting-started/integration-method/gateway"
                      className="hover:text-brand underline"
                    >
                      Integration docs
                    </Link>{" "}
                    or reach out to us - we&apos;re happy to help you get set
                    up.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left font-medium">
                    Is there a plan for teams or enterprise use?
                  </AccordionTrigger>
                  <AccordionContent className="accordion-content-style">
                    Yes! Helicone offers a Team plan designed for collaboration,
                    with shared dashboards, role-based access control, and
                    usage-based billing.
                    <br />
                    <br />
                    For advanced needs like on-prem deployment, custom SLAs, or
                    security reviews, we also offer custom Enterprise plans.{" "}
                    <Link href="/signup" className="hover:text-brand underline">
                      Contact us
                    </Link>{" "}
                    to learn more or get a quote tailored to your team.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-left font-medium">
                    Do you offer discounts for startups, students, or open
                    source projects?
                  </AccordionTrigger>
                  <AccordionContent className="accordion-content-style">
                    Yes! We love supporting the community.
                    <br />
                    <br />
                    If you are a startup under 2 years old with &lt; $5m in
                    funding, a non-profit, a student, or working on an
                    open-source project,{" "}
                    <Link
                      href="/contact"
                      className="hover:text-brand underline"
                    >
                      reach out
                    </Link>{" "}
                    to us! We may be able to offer discounts and credits to help
                    you get started with Helicone.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="md:py-16">
            <div className="">
              <div className="items-center lg:grid lg:grid-cols-3 lg:gap-8">
                <div className="col-span-1 rounded-lg bg-gray-50 p-8 lg:col-span-2">
                  <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                    Understand your
                    <span className="text-brand block">
                      AI performance bottleneck
                    </span>
                    with Helicone.
                  </h2>
                  <div className="mt-8 flex">
                    <div className="inline-flex rounded-md shadow">
                      <Link href="/signup">
                        <Button>Start for free</Button>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="mt-10 h-full lg:mt-0">
                  <Col className="h-full rounded-lg bg-white p-6 shadow">
                    <h3 className="text-lg font-medium text-slate-900">
                      Helicone or LangSmith?
                    </h3>
                    <p className="mt-2 text-base leading-7 text-slate-700">
                      Short answer: Helicone gives you more provider
                      flexibility, is open-source, and scales more
                      cost-effectively.
                    </p>
                    <div className="mt-4 lg:mt-auto">
                      <Button asChild variant="outline">
                        <Link href="/blog/langsmith-vs-helicone">
                          <BookOpenIcon className="mr-2 size-4" />
                          Read more
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
