"use client";

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
          setWaitlistCount(count > 0 ? count : 370);
        } else {
          setWaitlistCount(370);
        }
      } catch (err) {
        console.error("Error fetching waitlist count:", err);
        setWaitlistCount(370);
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
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-3xl md:pt-4 text-center text-accent-foreground">
              One bill. Every LLM provider.
              <br />
              <span className="text-brand">$0 fees</span>
            </h1>

            <p className="md:mt-4 w-full text-md sm:text-lg leading-7 max-w-2xl text-center text-muted-foreground">
              Stop juggling API keys and invoices. Fund once, use everywhere.
              Full observability included{" "}
              <span className="bg-sky-200 text-sky-900 font-medium px-1.5 py-0.5 rounded">
                at exact provider prices.
              </span>
            </p>

            {/* Waitlist Form - Compact horizontal version */}
            <div className="w-full max-w-2xl mt-6 mx-auto" id="waitlist-form">
              <CreditsWaitlistForm
                variant="inline"
                initialCount={waitlistCount}
              />
            </div>

            {/* Launch Video */}
            <div className="w-full max-w-3xl mt-6">
              <video
                src="https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/Helicone_PassThrough_Final+(1).mp4"
                className="w-full rounded-xl border border-slate-200 shadow-lg"
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
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
                  Claude down on Anthropic? We route to Bedrock or GCP. Same
                  model, different provider.
                </p>
                <Link
                  href="https://docs.helicone.ai/gateway/provider-routing"
                  target="_blank"
                  className="flex items-center gap-2 text-brand font-medium hover:underline text-sm"
                >
                  Learn about provider routing
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Full Observability Suite Card */}
            <div className="col-span-1 md:col-span-2 p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-slate-500">Included free</p>
                  <h3 className="text-xl font-semibold text-black">
                    Full observability suite
                  </h3>
                </div>
                <p className="text-base text-slate-600">
                  Complete Helicone platform included. Analytics, debugging,
                  monitoring, caching, and more.
                </p>
                <Link
                  href="https://docs.helicone.ai/getting-started/platform-overview"
                  target="_blank"
                  className="flex items-center gap-2 text-brand font-medium hover:underline text-sm"
                >
                  Explore platform features
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Smart Routing Card */}
            <div className="col-span-1 md:col-span-4 px-6 pt-6 pb-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-slate-500">Always the best price</p>
                <h3 className="text-xl sm:text-2xl font-semibold text-black">
                  Intelligent routing
                </h3>
              </div>
              <p className="text-base sm:text-lg text-slate-600">
                Automatically routes to the cheapest provider first. Instant
                failover on rate limits, timeouts, and errors. Zero-config
                reliability across 100+ models.
              </p>
              <Link
                href="https://docs.helicone.ai/gateway/overview"
                target="_blank"
                className="flex items-center gap-2 text-brand font-medium hover:underline"
              >
                Gateway technical docs
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
                  <p className="text-lg text-slate-600 leading-relaxed mb-4">
                    One endpoint for all providers. Automatic failover, load
                    balancing, and response caching. Switch models without
                    changing code.
                  </p>
                  {/* Code snippet */}
                  <div className="bg-[#24292e] rounded-lg overflow-hidden max-w-2xl">
                    <pre className="p-4 overflow-x-auto text-sm text-gray-300">
                      <code>{`import { OpenAI } from "openai";

const client = new OpenAI({
  baseURL: "https://ai-gateway.helicone.ai",
  apiKey: process.env.HELICONE_API_KEY,
});

// Works with any model from any provider
const response = await client.chat.completions.create({
  model: "o3", // or claude-opus-4, gemini-2.5-pro, grok-4, llama-3.3-70b...
  messages: [{ role: "user", content: "Hello!" }]
});`}</code>
                    </pre>
                  </div>
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
                    provider cost for each API call. You pay exactly what the
                    providers charge plus the Stripe transaction fee. We charge
                    nothing extra — no markups, no platform fees. Your credits
                    work across all supported providers from a single balance.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="font-medium text-left">
                    Which providers are supported?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Credits work with 100+ models across all major providers
                    including OpenAI, Anthropic, Google, Meta, Mistral, Cohere,
                    AWS Bedrock, Azure, and many more. View the full list at{" "}
                    <Link
                      href="https://www.helicone.ai/models"
                      target="_blank"
                      className="text-brand underline"
                    >
                      helicone.ai/models
                    </Link>
                    . We&apos;re adding new models every day — one integration
                    for all providers.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="font-medium text-left">
                    Is observability really included for free?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! You get Helicone&apos;s full observability platform at
                    no extra cost. This includes real-time monitoring, detailed
                    analytics, debugging tools, alerting, caching, and more. We
                    can offer this because we negotiate lower rates with
                    providers — the difference covers our platform costs while
                    you still pay standard provider prices.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="font-medium text-left">
                    What&apos;s the minimum credit purchase?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The minimum credit purchase is $5. Credits never expire, so
                    you can add what you need and use them at your own pace.
                    This low minimum makes it accessible for everyone — from
                    indie developers to enterprises.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="font-medium text-left">
                    Can I bring my own API keys (BYOK)?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! If you prefer to use your own API keys, we offer BYOK
                    with a 3% platform fee. This includes access to
                    Helicone&apos;s full observability platform — monitoring,
                    analytics, debugging, caching, and all other features. You
                    get the same powerful tools whether you use Credits or BYOK.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="font-medium text-left">
                    When will Credits be available?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We&apos;re already working with beta partners and
                    continuously adding more to the beta program. Join the
                    waitlist to be next in line for access. We&apos;ll notify
                    you as soon as Credits is available for your organization.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

      </div>
      
      {/* Bottom CTA - full width background */}
      <div className="w-full bg-sky-50 dark:bg-sky-950 py-16 -mx-[50vw] relative left-[50%] right-[50%] w-[100vw]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-slate-900">
            Done juggling API keys and invoices?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            One integration for 100+ models. Full observability included{" "}
            <span className="bg-sky-200 text-sky-900 font-medium px-1.5 py-0.5 rounded">
              at exact provider prices.
            </span>
          </p>
          <div className="max-w-md mx-auto">
            <CreditsWaitlistForm
              variant="card"
              initialCount={waitlistCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
