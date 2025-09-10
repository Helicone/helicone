"use client";

import Image from "next/image";
import { CreditsWaitlistForm } from "./CreditsWaitlist";
import { Col } from "@/components/common/col";
import { ArrowUpRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function WaitlistPage() {
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.helicone.ai";
  
  // Fetch count once at the page level
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/v1/public/waitlist/feature/count?feature=credits`,
          {
            headers: {
              Authorization: "Bearer undefined",
            },
          }
        );
        if (response.ok) {
          const result = await response.json();
          const count = result.data?.count || 0;
          setWaitlistCount(count > 0 ? count : 100); // Show at least 100
        } else {
          setWaitlistCount(100);
        }
      } catch (err) {
        console.error("Error fetching waitlist count:", err);
        setWaitlistCount(100);
      }
    };
    fetchCount();
  }, [apiUrl]);
  
  return (
    <div className="bg-background text-slate-700 antialiased">
      <div className="flex flex-col">
        {/* Hero Section - contained width */}
        <div className="max-w-6xl mx-auto p-4 pt-4">
          <Col className="items-center gap-4">
            <span className="block sm:hidden">
              <Image
                src="/static/pricing/bouncing-cube.webp"
                alt="bouncing-cube"
                width={100}
                height={50}
              />
            </span>
            <span className="hidden sm:block">
              <Image
                src="/static/pricing/bouncing-cube.webp"
                alt="bouncing-cube"
                width={200}
                height={100}
              />
            </span>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-3xl md:pt-4 text-center text-accent-foreground">
              One balance. Every LLM provider.
              <br />
              <span className="text-brand">Zero markup.</span>
            </h1>

            <p className="md:mt-4 w-full text-md sm:text-lg leading-7 max-w-2xl text-center text-muted-foreground">
              Stop juggling API keys and invoices. Fund once, use everywhere.
              Full observability included at exact provider prices.
            </p>

            {/* Waitlist Form */}
            <div className="w-full max-w-md mt-8 mx-auto" id="waitlist-form">
              <CreditsWaitlistForm variant="card" initialCount={waitlistCount} />
            </div>
          </Col>
        </div>

        {/* Features Grid - new design inspired by OpenSource */}
        <div className="max-w-6xl mx-auto p-4 mt-16">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-12 text-slate-900">
            Everything you need for better LLM billing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {/* Unified API Card */}
            <div className="col-span-1 md:col-span-4 px-6 pt-6 pb-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-slate-500">One integration</p>
                <h3 className="text-xl sm:text-2xl font-semibold text-black">
                  Unified API for 100+ models
                </h3>
              </div>
              <p className="text-base sm:text-lg text-slate-600">
                Access OpenAI, Anthropic, Google, Meta, and dozens more through
                a single endpoint. Automatic failover, load balancing, and
                seamless provider switching.
              </p>
              <Link
                href="https://docs.helicone.ai/gateway/overview"
                target="_blank"
                className="flex items-center gap-2 text-brand font-medium hover:underline"
              >
                View documentation
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 99.9% Uptime Card */}
            <div className="col-span-1 md:col-span-2 p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-slate-500">Reliability</p>
                  <h3 className="text-xl font-semibold text-black">
                    100% uptime
                  </h3>
                </div>
                <p className="text-base text-slate-600">
                  Claude down on Anthropic? We route to Bedrock or GCP. Same model, different provider.
                </p>
              </div>
            </div>

            {/* Real-time Analytics Card */}
            <div className="col-span-1 md:col-span-2 p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-slate-500">Monitoring</p>
                  <h3 className="text-xl font-semibold text-black">
                    Real-time analytics
                  </h3>
                </div>
                <p className="text-base text-slate-600">
                  Track usage, costs, and performance metrics as they happen.
                </p>
              </div>
            </div>

            {/* Team Management Card */}
            <div className="col-span-1 md:col-span-4 px-6 pt-6 pb-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-slate-500">Collaboration</p>
                <h3 className="text-xl sm:text-2xl font-semibold text-black">
                  Built for teams
                </h3>
              </div>
              <p className="text-base sm:text-lg text-slate-600">
                Share credits across your organization with granular access
                controls, spending limits, and detailed audit logs. One balance,
                complete visibility.
              </p>
              <Link
                href="https://docs.helicone.ai/features/organizations"
                target="_blank"
                className="flex items-center gap-2 text-brand font-medium hover:underline"
              >
                Learn about team features
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* How It Works Section - full width background */}
        <div className="w-full mt-16 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col gap-16">
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex items-center gap-2.5">
                  <p className="text-base sm:text-xl">01</p>
                  <div className="text-base sm:text-lg font-medium text-slate-700">
                    Fund
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-2xl sm:text-3xl mb-3 text-black">
                    Add credits to your account
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    One-time or recurring top-ups. Your balance works across
                    OpenAI, Anthropic, Google, and 100+ other models. No
                    expiration dates, no provider lock-in.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex items-center gap-2.5">
                  <p className="text-base sm:text-xl">02</p>
                  <div className="text-base sm:text-lg font-medium text-slate-700">
                    Build
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-2xl sm:text-3xl mb-3 text-black">
                    Ship faster with unified API
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    One endpoint for all providers. Automatic failover, load
                    balancing, and response caching. Switch models without
                    changing code.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex items-center gap-2.5">
                  <p className="text-base sm:text-xl">03</p>
                  <div className="text-base sm:text-lg font-medium text-slate-700">
                    Scale
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-2xl sm:text-3xl mb-3 text-black">
                    <span className="text-brand">$0 platform fees</span>,
                    observability included
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    Monitor usage, debug errors, analyze performance. Set
                    spending limits, share credits with your team. Everything
                    you need to scale — at provider prices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section - EXACT COPY FROM FAQ.TSX */}
        <div className="w-full px-4 pt-14 sm:pt-20 pb-12 md:pb-14">
          <div className="flex flex-col md:flex-row gap-6 md:gap-32 max-w-4xl mx-auto">
            <div className="flex-shrink-0">
              <h2 className="text-4xl sm:text-5xl font-semibold text-black">
                Frequently asked <br />
                questions
              </h2>
            </div>
            <div className="flex-1 min-w-0">
              <Accordion type="multiple">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="font-medium text-left">
                    How does Credits billing work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You add credits to your account, and we deduct the exact
                    provider cost for each API call. No markups, no platform
                    fees — you pay exactly what OpenAI, Anthropic, Google, and
                    others charge. Your credits work across all supported
                    providers from a single balance.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="font-medium text-left">
                    Which providers are supported?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Credits work with 100+ models across all major providers
                    including OpenAI, Anthropic, Google, Meta, Mistral, Cohere,
                    AWS Bedrock, Azure, and many more. You access everything
                    through our unified API — one integration for all providers.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="font-medium text-left">
                    Is observability really included for free?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! You get Helicone's full observability platform at no
                    extra cost. This includes real-time monitoring, detailed
                    analytics, debugging tools, alerting, caching, and more.
                    There are no hidden fees or usage limits on observability
                    features.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="font-medium text-left">
                    What's the minimum credit purchase?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We're still finalizing the details, but we plan to have a
                    low minimum to make it accessible for everyone — from indie
                    developers to enterprises. Credits never expire, so you can
                    add what you need and use them at your own pace.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="font-medium text-left">
                    How do credits compare to direct provider billing?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    With credits, you get the same provider pricing but with
                    major advantages: unified billing across all providers, no
                    need to manage multiple API keys and invoices, automatic
                    failover between providers, and full observability included.
                    It's simpler, more reliable, and costs the same.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="font-medium text-left">
                    When will Credits be available?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We're launching Credits soon! Join the waitlist to be among
                    the first to get access. We'll notify you as soon as it's
                    available for your organization. Early access users may
                    receive special benefits and pricing.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {/* Bottom CTA - full width background */}
        <div className="w-full bg-slate-50 dark:bg-slate-900 py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-slate-900">
              Done juggling API keys and invoices?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              One integration for 100+ models. Zero markup. Full observability included.
            </p>
            <div className="max-w-md mx-auto">
              <CreditsWaitlistForm variant="card" initialCount={waitlistCount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
