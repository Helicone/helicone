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
      <div className=" mx-auto antialiased">
        <div className="flex flex-col max-w-6xl mx-auto p-4 pb-24 pt-8 sm:pb-32 lg:flex gap-8 md:gap-16">
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
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl md:pt-8 text-center text-accent-foreground">
              Simple, predictable pricing
            </h1>
            <p className="md:mt-4 w-full text-md sm:text-lg leading-7 max-w-xl text-center text-muted-foreground">
              Built to scale with you. Only pay for what you use.
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

          <div className="flex mt-4 justify-center flex-col items-center gap-4">
            <h2 className="text-xl font-semibold text-sidebar-foreground text-center leading-8">
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

          <div className="py-16 sm:p-8 flex flex-col sm:flex-row sm:justify-between">
            <div className="w-full sm:w-1/2">
              <h3 className="text-[36px] font-bold text-slate-900">
                Frequently asked <br />
                questions
              </h3>
            </div>
            <div className="w-full sm:w-1/2 text-accent-foreground">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="font-medium text-left">
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
                  <AccordionTrigger className="font-medium text-left">
                    How is Helicone&apos;s usage-based pricing calculated?
                  </AccordionTrigger>
                  <AccordionContent className="accordion-content-style">
                    Helicone&apos;s usage-based pricing has two components:
                    <br />
                    <br />
                    <strong>Request-based pricing:</strong> The first 10,000
                    requests are free. After that, rates decrease as your usage
                    grows, starting at $0.0007/request and going as low as
                    $0.00002/request for high volumes.
                    <br />
                    <br />
                    <strong>Storage-based pricing:</strong> Storage is billed in
                    tiers starting at $3.25/GB for the first 30 GB, decreasing
                    to $0.50/GB for volumes over 450 GB.
                    <br />
                    <br />
                    You can find your monthly usage in the{" "}
                    <Link
                      href="https://us.helicone.ai/settings/billing"
                      className="underline hover:text-brand"
                    >
                      Billing
                    </Link>{" "}
                    page in product.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="font-medium text-left">
                    What happens if I exceed my limits?
                  </AccordionTrigger>
                  <AccordionContent className="accordion-content-style">
                    On the Free plan, you get 10,000 free requests and 1 GB of
                    storage. We continue logging all your requests in the
                    background. To access them, you can upgrade to the Pro plan
                    at any time.
                    <br />
                    <br />
                    If you are on the Pro or Team plan, additional usage is
                    automatically billed at tiered rates that decrease as you
                    scale - the more you use, the less you pay per unit.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="font-medium text-left">
                    Can I switch plans or cancel anytime?
                  </AccordionTrigger>
                  <AccordionContent className="accordion-content-style">
                    Yes! You can switch plans or cancel anytime - no lock-ins or
                    long-term commitments. You can manage your plan directly in
                    the{" "}
                    <Link
                      href="https://us.helicone.ai/settings/billing"
                      className="underline hover:text-brand"
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
                      className="underline hover:text-brand"
                    >
                      contact us
                    </Link>{" "}
                    about a custom Enterprise plan.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="font-medium text-left">
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
                      className="underline hover:text-brand"
                    >
                      Integration docs
                    </Link>{" "}
                    or reach out to us - we&apos;re happy to help you get set
                    up.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="font-medium text-left">
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
                    <Link href="/signup" className="underline hover:text-brand">
                      Contact us
                    </Link>{" "}
                    to learn more or get a quote tailored to your team.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger className="font-medium text-left">
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
                      className="underline hover:text-brand"
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
              <div className="lg:grid lg:grid-cols-3 lg:gap-8 items-center">
                <div className="bg-gray-50 rounded-lg p-8 col-span-1 lg:col-span-2">
                  <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                    Understand your
                    <span className="block text-brand">
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
                <div className="mt-10 lg:mt-0 h-full">
                  <Col className="bg-white p-6 rounded-lg shadow h-full">
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
                          <BookOpenIcon className="size-4 mr-2" />
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
