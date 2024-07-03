"use client";

import { PiTerminalBold } from "react-icons/pi";
import Link from "next/link";

const features = [
  {
    name: "Prompts",
    description:
      "Monitor Prompts Version.",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/prompts",
  },
  {
    name: "Custom Properties",
    description:
      "Label & segment requests.",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/advanced-usage/custom-properties",

  },
  {
    name: "Caching",
    description:
      "Save money & improve latency.",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/advanced-usage/caching",

  },
  {
    name: "Omitting Logs",
    description:
      "Remove requests and responses.",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/advanced-usage/omit-logs",

  },
  {
    name: "User Metrics",
    description:
      "Get insights into your user's usage .",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/advanced-usage/user-metrics",
  },
  {
    name: "Feedback",
    description:
      "Provide user feedback on outputs. ",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/advanced-usage/feedback",
  },
  {
    name: "Scores",
    description:
      "Score your requests and experiments.",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/advanced-usage/scores",
  },
  {
    name: "Gateway Fallback",
    description:
      "Use any provider via a single endpoint.",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/getting-started/integration-method/gateway-fallbacks",
  },
  {
    name: "Retries",
    description:
      "Smartly retry requests.",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/advanced-usage/retries",
  },
  {
    name: "Rate Limiting",
    description:
      "Easily rate limit power users.",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/advanced-usage/custom-rate-limits",
  },
  {
    name: "KeyVault",
    description:
      "Manage and distribute your provider API keys securely.",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/advanced-usage/vault",
  },
  {
    name: "Moderation Integration",
    description:
      "Integrate OpenAi moderation to safeguard your chat completion.",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/advanced-usage/moderations",
  },
  {
    name: "LLM Security",
    description:
      "Secure OpenAI chat completions against prompt injections.",
    icon: PiTerminalBold,
    href: "https://docs.helicone.ai/features/advanced-usage/llm-security",

  },
];

export default function Platform() {
  return (
    <>
      <div className="flex flex-col space-y-4 w-full items-center">
        <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight leading-tight">
          No packages, just{" "}
          <span className="text-sky-500 ">headers</span>
        </h2>
        <p className="text-md md:text-md text-gray-600 max-w-4xl font-light">
          Access just about every Helicone features in seconds.
        </p>
      </div>
      <div className="relative overflow-hidden pt-2">
        <div className="mx-auto max-w-8xl px-6 lg:px-8">

          <div className="relative" aria-hidden="true">
            <div />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-8xl sm:mt-20 md:mt-24 lg:px-8">
        <dl className="mx-auto grid max-w-2xl grid-cols-2 gap-x-6 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
          {features.map((feature) => (
            <div key={feature.name} className="relative lg:flex" >
              <feature.icon
                className=" h-5 w-5 text-sky-500 lg:mr-2 flex-shrink-0"
                aria-hidden="true"

              />
              <div className="lg:flex flex-col">
                <dt className="inline font-semibold text-nowrap text-sm text-sky-500">
                  <Link href={feature.href}>
                    {feature.name}
                  </Link>
                </dt>{" "}
                <dd className="font-light text-sm pt-1 lg:">{feature.description}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
